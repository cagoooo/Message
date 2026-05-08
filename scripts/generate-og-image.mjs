#!/usr/bin/env node
/**
 * 產生 1200×630 的 OG 分享預覽圖（內嵌 Noto Sans TC，跨平台一致）
 * Direction A 配色：深紫 #6b4ed4 + 珊瑚橘 #ff7a4a + 薰衣 #fbf6ff
 * 輸出：public/og-image.png
 */
import { writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUBSET_FONT = resolve(__dirname, "fonts", "NotoSansTC-Subset.ttf");
// Windows 系統 Microsoft JhengHei Bold（含完整 CJK，無需 subset）
const SYSTEM_FONT_WIN = "C:\\Windows\\Fonts\\msjhbd.ttc";
const OUTPUT = resolve(__dirname, "..", "public", "og-image.png");

// 優先用系統字型（避免精簡字型缺字），fallback 到 subset
let fontFamily = "NotoSansTC";
if (existsSync(SYSTEM_FONT_WIN)) {
  GlobalFonts.registerFromPath(SYSTEM_FONT_WIN, "NotoSansTC");
  console.log("✓ 使用系統字型：Microsoft JhengHei Bold");
} else if (existsSync(SUBSET_FONT)) {
  GlobalFonts.registerFromPath(SUBSET_FONT, "NotoSansTC");
  console.log("✓ 使用精簡字型：NotoSansTC-Subset.ttf");
} else {
  console.error("✗ 找不到中文字型");
  process.exit(1);
}

const W = 1200;
const H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

// === Direction A 主色變數 ===
const COL = {
  primary:    "#6b4ed4",
  primaryDk:  "#4f3aa3",
  accent:     "#ff7a4a",
  accentDk:   "#e0613a",
  bg:         "#fbf6ff",
  bgDeep:     "#f0e8ff",
  ink:        "#241a3a",
  inkSoft:    "#5b4f7a",
  card:       "#ffffff",
  gold:       "#f5b73a",
  goldDk:     "#d49215",
};

// === 背景：薰衣淡底漸層 ===
const bgGradient = ctx.createLinearGradient(0, 0, W, H);
bgGradient.addColorStop(0, COL.bg);
bgGradient.addColorStop(1, COL.bgDeep);
ctx.fillStyle = bgGradient;
ctx.fillRect(0, 0, W, H);

// === 多層光暈（呼應網站背景） ===
const blob1 = ctx.createRadialGradient(140, 100, 20, 140, 100, 360);
blob1.addColorStop(0, "rgba(107,78,212,0.28)");
blob1.addColorStop(1, "rgba(107,78,212,0)");
ctx.fillStyle = blob1;
ctx.beginPath();
ctx.arc(140, 100, 360, 0, Math.PI * 2);
ctx.fill();

const blob2 = ctx.createRadialGradient(W - 120, 80, 20, W - 120, 80, 320);
blob2.addColorStop(0, "rgba(255,122,74,0.28)");
blob2.addColorStop(1, "rgba(255,122,74,0)");
ctx.fillStyle = blob2;
ctx.beginPath();
ctx.arc(W - 120, 80, 320, 0, Math.PI * 2);
ctx.fill();

const blob3 = ctx.createRadialGradient(W / 2, H + 60, 20, W / 2, H + 60, 380);
blob3.addColorStop(0, "rgba(107,78,212,0.20)");
blob3.addColorStop(1, "rgba(107,78,212,0)");
ctx.fillStyle = blob3;
ctx.beginPath();
ctx.arc(W / 2, H + 60, 380, 0, Math.PI * 2);
ctx.fill();

// === 主標題卡片（白色半透明圓角，呼應網站 Card） ===
const cardX = 80;
const cardY = 80;
const cardW = W - cardX * 2;
const cardH = 470;
ctx.shadowColor = "rgba(107,78,212,0.20)";
ctx.shadowBlur = 40;
ctx.shadowOffsetY = 12;
ctx.fillStyle = "rgba(255,255,255,0.96)";
roundRect(ctx, cardX, cardY, cardW, cardH, 36);
ctx.fill();
ctx.shadowColor = "transparent";
ctx.shadowBlur = 0;
ctx.shadowOffsetY = 0;

// 卡片頂部漸層裝飾條
const headStripGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
headStripGrad.addColorStop(0, "rgba(107,78,212,0.10)");
headStripGrad.addColorStop(0.5, "rgba(255,122,74,0.10)");
headStripGrad.addColorStop(1, "rgba(107,78,212,0.10)");
ctx.fillStyle = headStripGrad;
roundRectTop(ctx, cardX, cardY, cardW, 96, 36);
ctx.fill();

// === 圓角徽章 logo（紫橘漸層）— 呼應網站 nav 的「回」徽章 ===
const logoX = cardX + 80;
const logoY = cardY + 130;
const logoSize = 110;
drawLogoBadge(ctx, logoX, logoY, logoSize);

// === 主標題：教師回覆小幫手 Pro版 ===
ctx.fillStyle = COL.ink;
ctx.font = '900 76px "NotoSansTC"';
ctx.textBaseline = "alphabetic";
ctx.fillText("教師回覆小幫手", logoX + 145, cardY + 168);

// === Pro 版徽章（金色） ===
const proX = logoX + 145 + ctx.measureText("教師回覆小幫手").width + 18;
const proY = cardY + 122;
const proW = 120;
const proH = 60;
const proGrad = ctx.createLinearGradient(proX, proY, proX, proY + proH);
proGrad.addColorStop(0, COL.gold);
proGrad.addColorStop(1, COL.goldDk);
ctx.fillStyle = proGrad;
roundRect(ctx, proX, proY, proW, proH, 14);
ctx.fill();
ctx.fillStyle = "#2a1a05";
ctx.font = '900 32px "NotoSansTC"';
ctx.fillText("Pro版", proX + 16, proY + 41);

// === 副標題 ===
ctx.fillStyle = COL.inkSoft;
ctx.font = '600 32px "NotoSansTC"';
ctx.fillText("親師溝通的同理心 AI 回覆建議", logoX + 145, cardY + 222);

// === 三個功能 chip — 用 Direction A 情境配色（純文字，避免 emoji 被精簡字型吃掉） ===
const chips = [
  { text: "12 種情境",   bg: "rgba(107,78,212,0.12)", fg: COL.primary },
  { text: "語氣 / 長度",  bg: "rgba(255,122,74,0.14)", fg: COL.accentDk },
  { text: "OCR 識圖",    bg: "rgba(58,169,176,0.14)", fg: "#1f7a80" },
];
let chipX = cardX + 80;
const chipY = cardY + 304;
ctx.font = '700 28px "NotoSansTC"';
for (const chip of chips) {
  const padding = 24;
  const w = ctx.measureText(chip.text).width + padding * 2;
  const h = 56;
  ctx.fillStyle = chip.bg;
  roundRect(ctx, chipX, chipY, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = chip.fg;
  ctx.fillText(chip.text, chipX + padding, chipY + 38);
  chipX += w + 16;
}

// === 底部資訊條 ===
ctx.fillStyle = COL.primary;
ctx.font = '900 28px "NotoSansTC"';
ctx.fillText("cagoooo.github.io/Message", cardX + 80, cardY + cardH - 70);

ctx.fillStyle = COL.inkSoft;
ctx.font = '600 22px "NotoSansTC"';
ctx.fillText("桃園市石門國小資訊組  |  阿凱老師 設計", cardX + 80, cardY + cardH - 36);

// === 右下角「立即試用」貼紙（紫橘漸層） ===
const stickerX = W - 290;
const stickerY = H - 95;
const stickerW = 240;
const stickerH = 64;
const stickerGrad = ctx.createLinearGradient(stickerX, stickerY, stickerX + stickerW, stickerY + stickerH);
stickerGrad.addColorStop(0, COL.primary);
stickerGrad.addColorStop(1, COL.accent);
ctx.fillStyle = stickerGrad;
roundRect(ctx, stickerX, stickerY, stickerW, stickerH, 32);
ctx.fill();
ctx.fillStyle = "#FFFFFF";
ctx.font = '900 28px "NotoSansTC"';
ctx.textAlign = "center";
ctx.fillText("立即試用", stickerX + stickerW / 2, stickerY + 43);
ctx.textAlign = "left"; // restore

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

function roundRectTop(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.arcTo(x + w, y, x + w, y + r, r);
  c.lineTo(x + w, y + h);
  c.lineTo(x, y + h);
  c.lineTo(x, y + r);
  c.arcTo(x, y, x + r, y, r);
  c.closePath();
}

function drawLogoBadge(c, cx, cy, size) {
  // 圓角方形底（紫橘漸層）— 呼應網站 nav 的「回」徽章
  const radius = size * 0.30;
  const x = cx - size / 2;
  const y = cy - size / 2;
  const grad = c.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, COL.primary);
  grad.addColorStop(1, COL.accent);
  c.fillStyle = grad;
  c.shadowColor = "rgba(107,78,212,0.45)";
  c.shadowBlur = 24;
  c.shadowOffsetY = 8;
  roundRect(c, x, y, size, size, radius);
  c.fill();
  c.shadowColor = "transparent";
  c.shadowBlur = 0;
  c.shadowOffsetY = 0;

  // 中央「回」字（白色）
  c.fillStyle = "#FFFFFF";
  c.font = `900 ${size * 0.55}px "NotoSansTC"`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("回", cx, cy + size * 0.04);
  // 還原（避免影響後續文字）
  c.textAlign = "left";
  c.textBaseline = "alphabetic";
}
