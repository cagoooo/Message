#!/usr/bin/env node
/**
 * 在 build 之前執行，產出兩個檔案：
 *   - public/version.json  （前端輪詢用，偵測新版）
 *   - public/sw.js         （從 sw.template.js 替換 __BUILD_VERSION__）
 *
 * 版本號優先序：
 *   1. process.env.NEXT_PUBLIC_BUILD_VERSION（CI 可手動指定）
 *   2. process.env.GITHUB_SHA（GitHub Actions 自動帶）
 *   3. git rev-parse --short HEAD（本地）
 *   4. 'dev'（沒 git 環境）
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, "..", "public");

function getSha() {
  if (process.env.NEXT_PUBLIC_BUILD_VERSION) {
    return process.env.NEXT_PUBLIC_BUILD_VERSION;
  }
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "dev";
  }
}

const buildTime = new Date().toISOString();
const sha = getSha();
const dateStamp = buildTime.slice(0, 10).replace(/-/g, "");
const version = `${dateStamp}-${sha}`;

// 1. version.json（前端輪詢用）
const versionData = { version, sha, buildTime };
writeFileSync(
  resolve(PUBLIC, "version.json"),
  JSON.stringify(versionData, null, 2) + "\n",
);
console.log(`✓ version.json → ${version}`);

// 2. sw.js（從 template 替換）
const tplPath = resolve(PUBLIC, "sw.template.js");
const swPath = resolve(PUBLIC, "sw.js");
const tpl = readFileSync(tplPath, "utf-8");
const sw = tpl.replace(/__BUILD_VERSION__/g, version);
writeFileSync(swPath, sw);
console.log(`✓ sw.js generated (CACHE_VERSION = ${version})`);
