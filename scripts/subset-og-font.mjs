#!/usr/bin/env node
/**
 * 把 NotoSansTC-Bold.ttf (~12MB) 精簡成只包含 OG 圖會用到的字元 (~150KB)
 * 用法：node scripts/subset-og-font.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONT_IN = resolve(__dirname, "fonts", "NotoSansTC-Bold.ttf");
const FONT_OUT = resolve(__dirname, "fonts", "NotoSansTC-Subset.ttf");

const USED_TEXT = `
教師回應訊息建議小幫手覆 Pro 版
親師溝通的同理心 AI 回覆建議
為親師溝通提供同理心專業
桃園市石門國小資訊組阿凱老師設計
情境選擇家長訊息陳述狀況產生按鈕
孩童受傷嚴重衝突不理性學業行為問題
家長正面回饋會面缺交作業活動詢問健康一般其他
複製分享 LINE 立即開啟試用送出
種語氣長度識圖功能離線教學專業
©2025 2026
✨★●▸◆◇•✓✗
桃園市石門國小資訊組
`;

const ASCII =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,:;!?-_/+()[]{}|@#$%&*'\"";

const chars = Array.from(new Set([...USED_TEXT, ...ASCII])).join("");

const buffer = readFileSync(FONT_IN);
const subset = await subsetFont(buffer, chars, { targetFormat: "truetype" });
writeFileSync(FONT_OUT, subset);

const inKB = (buffer.length / 1024).toFixed(0);
const outKB = (subset.length / 1024).toFixed(0);
console.log(`✓ 精簡完成：${inKB} KB → ${outKB} KB（${chars.length} 個字元）`);
