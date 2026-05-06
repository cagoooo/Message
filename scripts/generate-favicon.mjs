#!/usr/bin/env node
/**
 * 產生多尺寸 favicon：
 *  - public/favicon.ico       (16+32+48 多尺寸合一，給瀏覽器 tab)
 *  - public/icon-192.png      (192x192, PWA / Android)
 *  - public/icon-512.png      (512x512, PWA splash, og fallback)
 *  - public/apple-touch-icon.png  (180x180, iOS home screen)
 *
 * 設計：紫色漸層圓底 + 白色對話泡泡 (三個圓點)，呼應 OG 圖
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";
import sharp from "sharp";
import toIco from "to-ico";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, "..", "public");

// === 用 Canvas 畫一張高解析度母版 (1024×1024) ===
function drawMaster() {
  const S = 1024;
  const c = createCanvas(S, S);
  const ctx = c.getContext("2d");

  // 圓底（紫色漸層，與 OG 圖呼應）
  const grad = ctx.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, "#9F86E8");
  grad.addColorStop(1, "#5A4A9A");
  ctx.fillStyle = grad;
  // 圓角方塊（iOS / Android 慣例）
  const r = S * 0.22;
  roundRect(ctx, 0, 0, S, S, r);
  ctx.fill();

  // 內部柔光圓
  const halo = ctx.createRadialGradient(S * 0.4, S * 0.35, 0, S * 0.5, S * 0.5, S * 0.6);
  halo.addColorStop(0, "rgba(255,255,255,0.35)");
  halo.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  roundRect(ctx, 0, 0, S, S, r);
  ctx.fill();

  // 主體：白色對話泡泡
  const bubbleX = S * 0.18;
  const bubbleY = S * 0.16;
  const bubbleW = S * 0.64;
  const bubbleH = S * 0.5;
  const bubbleR = bubbleH * 0.42;
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, bubbleR);
  ctx.fill();

  // 對話泡泡尾巴（左下三角）
  ctx.beginPath();
  ctx.moveTo(bubbleX + bubbleW * 0.18, bubbleY + bubbleH);
  ctx.lineTo(bubbleX + bubbleW * 0.04, bubbleY + bubbleH + S * 0.18);
  ctx.lineTo(bubbleX + bubbleW * 0.42, bubbleY + bubbleH * 0.78);
  ctx.closePath();
  ctx.fill();

  // 三個紫色圓點（對話訊息感）
  ctx.fillStyle = "#7B61C4";
  const dotR = bubbleH * 0.13;
  const dotY = bubbleY + bubbleH / 2;
  const dotSpacing = bubbleW * 0.24;
  const dotCenterX = bubbleX + bubbleW / 2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(dotCenterX + i * dotSpacing, dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
  }

  return c.toBuffer("image/png");
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

// === 主流程 ===
const master = drawMaster();
console.log("✓ 母版產生完成 (1024×1024)");

// 各尺寸 PNG
const sizes = [
  { px: 192, file: "icon-192.png" },
  { px: 512, file: "icon-512.png" },
  { px: 180, file: "apple-touch-icon.png" },
];

for (const { px, file } of sizes) {
  await sharp(master).resize(px, px).png().toFile(resolve(PUBLIC, file));
  console.log(`✓ ${file} (${px}×${px})`);
}

// favicon.ico (16/32/48 三尺寸合一)
const icoBuffers = await Promise.all(
  [16, 32, 48].map((n) => sharp(master).resize(n, n).png().toBuffer()),
);
const icoBuf = await toIco(icoBuffers);
writeFileSync(resolve(PUBLIC, "favicon.ico"), icoBuf);
console.log(`✓ favicon.ico (16/32/48 多尺寸合一, ${(icoBuf.length / 1024).toFixed(1)} KB)`);

console.log("\n🎨 全部 favicon 完成！");
