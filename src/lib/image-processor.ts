"use client";

/**
 * 客戶端圖片處理：resize + JPEG 壓縮 + base64 編碼。
 *
 * 為什麼：
 *  - 原始 LINE/相機截圖常 5-10 MB，直接 base64 編碼後超過 callable
 *    function 10 MB 限制
 *  - Gemini 對圖片有自己的縮放（保留必要細節即可），客戶端先壓
 *    省頻寬與 token
 *  - JPEG 0.85 quality 在文字截圖場景幾乎無感失真
 */

const MAX_DIMENSION = 1280; // 長邊上限（像素）
const JPEG_QUALITY = 0.85;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_INPUT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export interface ProcessedImage {
  /** "data:image/jpeg;base64,..." 形式 */
  dataUrl: string;
  /** 處理後的 byte 大小（base64 解碼前） */
  sizeBytes: number;
  width: number;
  height: number;
  originalSizeBytes: number;
}

function readFileAsDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error("讀取檔案失敗"));
    fr.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("圖片載入失敗，可能格式不支援"));
    img.src = dataUrl;
  });
}

export async function processImage(file: File): Promise<ProcessedImage> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      `不支援的圖片格式（${file.type || "unknown"}）。請上傳 JPG / PNG / WebP。`,
    );
  }
  if (file.size > MAX_INPUT_SIZE_BYTES) {
    throw new Error(
      `圖片檔過大（${formatBytes(file.size)}，超過 10 MB 上限）。請選擇較小的圖。`,
    );
  }

  const inputDataUrl = await readFileAsDataURL(file);
  const img = await loadImage(inputDataUrl);

  // 等比例 resize（不超過長邊上限）
  let { width, height } = img;
  const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height, 1);
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context 初始化失敗");
  // 白底（避免 PNG 透明背景轉 JPEG 變黑）
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("圖片壓縮失敗"))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });

  const compressedDataUrl = await readFileAsDataURL(blob);

  return {
    dataUrl: compressedDataUrl,
    sizeBytes: blob.size,
    width,
    height,
    originalSizeBytes: file.size,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
