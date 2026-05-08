#!/usr/bin/env node
/**
 * 產生多尺寸 favicon：
 *  - public/favicon.ico       (16+32+48 多尺寸合一，給瀏覽器 tab)
 *  - public/icon-192.png      (192x192, PWA / Android)
 *  - public/icon-512.png      (512x512, PWA splash, og fallback)
 *  - public/apple-touch-icon.png  (180x180, iOS home screen)
 *
 * Direction A 設計：紫橘漸層圓角徽章 + 白色「回」字（呼應網站 nav logo）
 *  · 主色 #6b4ed4 → 強調色 #ff7a4a 對角漸層
 *  · 加金色 Pro 角標（小尺寸 ≤ 48 會被 sharp 縮成模糊小點，不影響辨識）
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import sharp from "sharp";
import toIco from "to-ico";

import { existsSync } from "node:fs";
const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, "..", "public");
const SUBSET_FONT = resolve(__dirname, "fonts", "NotoSansTC-Subset.ttf");
const SYSTEM_FONT_WIN = "C:\\Windows\\Fonts\\msjhbd.ttc";

// 優先系統字型（含全 CJK），fallback 到 subset
if (existsSync(SYSTEM_FONT_WIN)) {
  GlobalFonts.registerFromPath(SYSTEM_FONT_WIN, "NotoSansTC");
  console.log("✓ 使用系統字型：Microsoft JhengHei Bold");
} else if (existsSync(SUBSET_FONT)) {
  GlobalFonts.registerFromPath(SUBSET_FONT, "NotoSansTC");
} else {
  console.warn("⚠ 找不到任何中文字型，文字可能無法顯示");
}

// === Direction A 配色 ===
const COL = {
  primary:    "#6b4ed4",
  accent:     "#ff7a4a",
  ink:        "#241a3a",
  white:      "#ffffff",
  gold:       "#f5b73a",
  goldDk:     "#d49215",
};

// === 用 Canvas 畫一張高解析度母版 (1024×1024) ===
function drawMaster() {
  const S = 1024;
  const c = createCanvas(S, S);
  const ctx = c.getContext("2d");

  // 圓角方形底（紫橘漸層）
  const grad = ctx.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, COL.primary);
  grad.addColorStop(1, COL.accent);
  ctx.fillStyle = grad;
  const r = S * 0.22;
  roundRect(ctx, 0, 0, S, S, r);
  ctx.fill();

  // 內部柔光
  const halo = ctx.createRadialGradient(S * 0.4, S * 0.35, 0, S * 0.5, S * 0.5, S * 0.6);
  halo.addColorStop(0, "rgba(255,255,255,0.30)");
  halo.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  roundRect(ctx, 0, 0, S, S, r);
  ctx.fill();

  // 中央「回」字（白色，加陰影提升辨識度）
  ctx.fillStyle = COL.white;
  ctx.shadowColor = "rgba(35,26,58,0.30)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.font = '900 600px "NotoSansTC"';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("回", S / 2, S / 2 + S * 0.03);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  return c.toBuffer("image/png");
}

/**
 * 為 ≥192 的尺寸額外畫一個 Pro 金色徽章（左上角）
 * 16/32/48 太小放上去會糊，所以只給大尺寸用
 */
function drawMasterWithProBadge() {
  const S = 1024;
  const c = createCanvas(S, S);
  const ctx = c.getContext("2d");

  // 跟 drawMaster 一樣的底
  const grad = ctx.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, COL.primary);
  grad.addColorStop(1, COL.accent);
  ctx.fillStyle = grad;
  const r = S * 0.22;
  roundRect(ctx, 0, 0, S, S, r);
  ctx.fill();

  // 柔光
  const halo = ctx.createRadialGradient(S * 0.4, S * 0.35, 0, S * 0.5, S * 0.5, S * 0.6);
  halo.addColorStop(0, "rgba(255,255,255,0.30)");
  halo.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  roundRect(ctx, 0, 0, S, S, r);
  ctx.fill();

  // 中央「回」字
  ctx.fillStyle = COL.white;
  ctx.shadowColor = "rgba(35,26,58,0.30)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.font = '900 540px "NotoSansTC"';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("回", S / 2, S / 2 + S * 0.06);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 右上角 Pro 金色徽章（圓形）
  const badgeR = S * 0.18;
  const badgeCX = S - badgeR - S * 0.06;
  const badgeCY = badgeR + S * 0.06;
  const badgeGrad = ctx.createLinearGradient(badgeCX - badgeR, badgeCY - badgeR, badgeCX + badgeR, badgeCY + badgeR);
  badgeGrad.addColorStop(0, COL.gold);
  badgeGrad.addColorStop(1, COL.goldDk);
  ctx.fillStyle = badgeGrad;
  ctx.beginPath();
  ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2);
  ctx.fill();
  // Pro 文字
  ctx.fillStyle = "#2a1a05";
  ctx.font = '900 110px "NotoSansTC"';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Pro", badgeCX, badgeCY + 6);

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
const masterSimple = drawMaster();         // 給 16/32/48 favicon 用（不含 Pro 角標，避免糊）
const masterWithBadge = drawMasterWithProBadge(); // 給 ≥180 用（含 Pro 角標）
console.log("✓ 母版產生完成 (1024×1024 × 2 版本)");

// 各尺寸 PNG（≥180 用含 Pro badge 版本）
const sizes = [
  { px: 192, file: "icon-192.png" },
  { px: 512, file: "icon-512.png" },
  { px: 180, file: "apple-touch-icon.png" },
];

for (const { px, file } of sizes) {
  await sharp(masterWithBadge).resize(px, px).png().toFile(resolve(PUBLIC, file));
  console.log(`✓ ${file} (${px}×${px}, 含 Pro 角標)`);
}

// favicon.ico (16/32/48 三尺寸合一，用 simple 版本避免糊)
const icoBuffers = await Promise.all(
  [16, 32, 48].map((n) => sharp(masterSimple).resize(n, n).png().toBuffer()),
);
const icoBuf = await toIco(icoBuffers);
writeFileSync(resolve(PUBLIC, "favicon.ico"), icoBuf);
console.log(`✓ favicon.ico (16/32/48 多尺寸合一, ${(icoBuf.length / 1024).toFixed(1)} KB)`);

console.log("\n🎨 全部 favicon 完成！(Direction A 紫橘配色 + Pro 徽章)");
