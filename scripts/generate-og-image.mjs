#!/usr/bin/env node
/**
 * 產生 1200×630 的 OG 分享預覽圖（內嵌 Noto Sans TC，跨平台一致）
 * 輸出：public/og-image.png
 */
import { writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONT_PATH = resolve(__dirname, "fonts", "NotoSansTC-Subset.ttf");
const OUTPUT = resolve(__dirname, "..", "public", "og-image.png");

if (!existsSync(FONT_PATH)) {
  console.error("✗ 找不到精簡字型，請先執行 npm run subset-og-font");
  process.exit(1);
}
GlobalFonts.registerFromPath(FONT_PATH, "NotoSansTC");

const W = 1200;
const H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

// === 背景：淡紫到溫和藍漸層（呼應 globals.css 主題） ===
const bgGradient = ctx.createLinearGradient(0, 0, W, H);
bgGradient.addColorStop(0, "#E6E6FA"); // 淡紫
bgGradient.addColorStop(0.5, "#D8D2F4");
bgGradient.addColorStop(1, "#ADD8E6"); // 溫和藍
ctx.fillStyle = bgGradient;
ctx.fillRect(0, 0, W, H);

// === 裝飾圓圈（背景柔和質感） ===
ctx.fillStyle = "rgba(255,255,255,0.35)";
ctx.beginPath();
ctx.arc(1080, 120, 90, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "rgba(255,255,255,0.22)";
ctx.beginPath();
ctx.arc(140, 540, 130, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "rgba(173,216,230,0.4)";
ctx.beginPath();
ctx.arc(1100, 580, 70, 0, Math.PI * 2);
ctx.fill();

// === 主標題卡片（白色半透明圓角） ===
const cardX = 80;
const cardY = 90;
const cardW = W - cardX * 2;
const cardH = 460;
ctx.shadowColor = "rgba(123, 97, 196, 0.18)";
ctx.shadowBlur = 30;
ctx.shadowOffsetY = 8;
ctx.fillStyle = "rgba(255,255,255,0.92)";
roundRect(ctx, cardX, cardY, cardW, cardH, 32);
ctx.fill();
ctx.shadowColor = "transparent";
ctx.shadowBlur = 0;
ctx.shadowOffsetY = 0;

// === Bot icon (對話泡泡 + 教師笑臉，純 Canvas 畫) ===
const iconX = cardX + 80;
const iconY = cardY + 80;
drawChatBubble(ctx, iconX, iconY, 110);

// === 主標題 ===
ctx.fillStyle = "#5A4A9A"; // 深紫
ctx.font = '900 72px "NotoSansTC"';
ctx.textBaseline = "alphabetic";
ctx.fillText("教師小幫手", iconX + 150, cardY + 160);

// === 副標題 ===
ctx.fillStyle = "#6B7280";
ctx.font = '700 36px "NotoSansTC"';
ctx.fillText("親師溝通的 AI 回覆建議", iconX + 150, cardY + 220);

// === 三個情境 chip ===
const chips = ["孩童受傷", "嚴重衝突", "家長回饋"];
const chipColors = [
  ["#FCA5A5", "#7F1D1D"],
  ["#FCD34D", "#78350F"],
  ["#86EFAC", "#14532D"],
];
let chipX = cardX + 80;
const chipY = cardY + 290;
ctx.font = '700 26px "NotoSansTC"';
for (let i = 0; i < chips.length; i++) {
  const [bg, fg] = chipColors[i];
  const text = chips[i];
  const padding = 22;
  const w = ctx.measureText(text).width + padding * 2;
  const h = 54;
  ctx.fillStyle = bg;
  roundRect(ctx, chipX, chipY, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.fillText(text, chipX + padding, chipY + 36);
  chipX += w + 18;
}

// === 底部資訊條 ===
ctx.fillStyle = "#5A4A9A";
ctx.font = '900 28px "NotoSansTC"';
ctx.fillText("cagoooo.github.io/Message", cardX + 80, cardY + cardH - 60);

ctx.fillStyle = "#6B7280";
ctx.font = '600 22px "NotoSansTC"';
ctx.fillText("桃園市石門國小資訊組  |  阿凱老師 設計", cardX + 80, cardY + cardH - 28);

// === 右下角貼紙 ===
const stickerX = W - 280;
const stickerY = H - 80;
ctx.fillStyle = "#FF6B35"; // 暖橘
roundRect(ctx, stickerX, stickerY - 36, 220, 60, 30);
ctx.fill();
ctx.fillStyle = "#FFFFFF";
ctx.font = '900 26px "NotoSansTC"';
ctx.fillText("✨ 立即試用", stickerX + 28, stickerY + 4);

// === 輸出 ===
writeFileSync(OUTPUT, canvas.toBuffer("image/png"));
const sizeKB = (canvas.toBuffer("image/png").length / 1024).toFixed(0);
console.log(`✓ OG 圖已產生：${OUTPUT} (${sizeKB} KB)`);

// === 工具函式 ===
function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function drawChatBubble(c, cx, cy, size) {
  // 主圓底（淡紫漸層）
  const grad = c.createRadialGradient(cx, cy, 10, cx, cy, size / 2 + 10);
  grad.addColorStop(0, "#9F86E8");
  grad.addColorStop(1, "#7B61C4");
  c.fillStyle = grad;
  c.beginPath();
  c.arc(cx, cy, size / 2, 0, Math.PI * 2);
  c.fill();

  // 對話泡泡尾巴
  c.fillStyle = "#7B61C4";
  c.beginPath();
  c.moveTo(cx - size / 2 + 10, cy + size / 4);
  c.lineTo(cx - size / 2 - 14, cy + size / 2 + 8);
  c.lineTo(cx - size / 2 + 28, cy + size / 2);
  c.closePath();
  c.fill();

  // 內部三個白點（對話訊息感）
  c.fillStyle = "#FFFFFF";
  for (let i = -1; i <= 1; i++) {
    c.beginPath();
    c.arc(cx + i * 20, cy, 6, 0, Math.PI * 2);
    c.fill();
  }
}
