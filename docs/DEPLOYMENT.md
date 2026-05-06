# GitHub 部署完整指南

> 這份文件回答一個關鍵問題：**這個 App 能不能完整移植到 GitHub 部署使用？**
> TL;DR：**不能直接掛 GitHub Pages，但有 3 條合理的部署路線都能讓 GitHub 是你的程式碼家**。

---

## 📑 目錄

1. [部署架構分析（為什麼不能純 GitHub Pages）](#1-部署架構分析為什麼不能純-github-pages)
2. [三條部署路線比較](#2-三條部署路線比較)
3. [路線 A：GitHub + Vercel（最推薦，最快上線）](#3-路線-agithub--vercel最推薦最快上線)
4. [路線 B：GitHub + Firebase App Hosting](#4-路線-bgithub--firebase-app-hosting)
5. [路線 C：GitHub Pages + Firebase Cloud Functions（純靜態前端）](#5-路線-cgithub-pages--firebase-cloud-functions純靜態前端)
6. [部署前 checklist](#6-部署前-checklist)
7. [API Key 安全防護](#7-api-key-安全防護)
8. [部署後驗證](#8-部署後驗證)
9. [常見部署問題排除](#9-常見部署問題排除)

---

## 1. 部署架構分析（為什麼不能純 GitHub Pages）

### 1.1 GitHub Pages 的限制

GitHub Pages **只能託管純靜態檔案**（HTML/CSS/JS/圖片），它的本質是 CDN，無法執行任何伺服器端程式碼。

### 1.2 本 App 的關鍵架構

打開 [src/lib/actions.ts:2](src/lib/actions.ts) 可以看到：

```ts
"use server";

import { generateParentReply, ... } from "@/ai/flows/generate-parent-reply";
```

這是 **Next.js Server Action**，必須在 Node.js 伺服器上執行，因為：

1. **保護 API Key**：`GEMINI_API_KEY` 寫在 `process.env`，前端瀏覽器看不到
2. **Genkit Flow**：`@genkit-ai/googleai` 是 server-side SDK
3. **避免 CORS / Rate Limit 直接打到使用者**

→ 所以**純 GitHub Pages 部署不可行**。

### 1.3 三種解法的核心差異

| 解法 | 程式碼放哪 | 執行環境 | 改動量 |
|---|---|---|---|
| A. Vercel | GitHub repo | Vercel Serverless | ⭐ 零改動 |
| B. Firebase App Hosting | GitHub repo | Google Cloud Run | ⭐ 零改動 |
| C. GitHub Pages + Firebase Functions | GitHub repo | GitHub Pages（前端）+ Firebase Functions（API） | ⭐⭐⭐⭐ 重大重構 |

---

## 2. 三條部署路線比較

| 維度 | A. Vercel | B. Firebase App Hosting | C. GH Pages + Firebase Functions |
|---|---|---|---|
| **費用** | Hobby 免費 | 需 Blaze 計畫（按用量計費） | GH Pages 免費 + Functions Spark 免費或 Blaze |
| **設定複雜度** | 🟢 5 分鐘 | 🟡 15 分鐘 | 🔴 1–2 小時（要重構） |
| **GitHub 整合** | ✅ 點 push 即部署 | ✅ 點 push 即部署 | ✅ Actions 手動配置 |
| **域名** | `*.vercel.app` 免費 | `*.web.app` 免費 | `*.github.io` 免費 |
| **CI/CD** | 內建 | 內建 | 需自己寫 GH Actions |
| **冷啟動延遲** | 約 0.5–2 秒 | 約 1–3 秒 | API 約 2–5 秒 |
| **適合對象** | 想最快上線、不在乎 vendor lock-in | 已經吃 Firebase 全家桶 | 堅持「程式碼在 GitHub、執行也要靠 GitHub」 |
| **改動 source code** | 0 行 | 0 行 | 大改：Server Action 拆成 Function、`fetch` 改 API、API Key 搬家 |

### 推薦選擇

```
是學校教師、想最快讓全校老師用？
  ├── 是 → 選 A (Vercel)
  └── 否
       ├── 已經是 Firebase 生態？ → 選 B
       └── 一定要 GitHub Pages？ → 選 C
```

> 💡 **阿凱老師個人建議**：先用路線 A 上線給老師用（5 分鐘搞定），之後再評估要不要遷移。
> 路線 C 雖然符合「all-in-GitHub」哲學但工程量大，除非有特殊需求否則不划算。

---

## 3. 路線 A：GitHub + Vercel（最推薦，最快上線）

### 3.1 前置準備

- [ ] GitHub 帳號（cagoooo@gmail.com 已綁）
- [ ] Gemini API Key（[詳見 USAGE.md §4.4](USAGE.md#44-申請-gemini-api-key免費)）

### 3.2 步驟一：把專案推上 GitHub

```bash
cd H:/Message/.claude/worktrees/modest-bose-01d0c6
# 確認在 git 工作樹內（已是）
git status

# 建立 GitHub repo（用 gh CLI）
gh repo create teachers-ai-assistant --public --source=. --remote=origin

# 推上去
git push -u origin main
```

> 💡 用 `--public` 公開 repo 才能用 Vercel Hobby 免費層。
> 私有 repo 需 Vercel Pro。

### 3.3 步驟二：Vercel 連結 GitHub

1. 前往 https://vercel.com/signup
2. 用 **GitHub 帳號**登入（OAuth 一鍵授權）
3. 點 **Add New → Project**
4. 選 `teachers-ai-assistant` repo → **Import**
5. Framework Preset 自動偵測為 **Next.js**（無需動）
6. **Build & Output Settings** 全部保持預設

### 3.4 步驟三：設定環境變數

在 Vercel Import 頁面下方有 **Environment Variables** 區塊：

| Key | Value |
|---|---|
| `GEMINI_API_KEY` | `AIzaSy...你的 key` |
| `NEXT_PUBLIC_SITE_URL` | `https://teachers-ai-assistant.vercel.app`（Vercel 部署後給你的網址） |

→ 點 **Deploy**，等 2–4 分鐘。

### 3.5 步驟四：自動 CI/CD

之後每次 `git push origin main`：

- Vercel 自動偵測到，啟動 build
- Build 成功 → 自動部署到正式網址
- Build 失敗 → 不影響線上版本，且會 email 通知

開 PR 也會自動產生 **Preview URL**，方便審稿。

### 3.6 步驟五：自訂網域（選用）

買了一個 `xxx.tw` 網域？

1. Vercel Dashboard → Settings → Domains
2. 加入你的網域
3. 依指示在 DNS 商加 A record / CNAME
4. SSL 證書 Vercel 自動申請（Let's Encrypt）

---

## 4. 路線 B：GitHub + Firebase App Hosting

> Firebase App Hosting 是 Google 2024 推出的「**為現代 Web 框架打造**」服務，原生支援 Next.js Server Actions、SSR、Genkit。

### 4.1 前置準備

- [ ] Firebase 專案（用 `ipad@mail2.smes.tyc.edu.tw` 帳號）
- [ ] Blaze 付費計畫已啟用（App Hosting 需要，但有免費額度）
- [ ] firebase CLI v13.15.0 以上

### 4.2 步驟一：建立 Firebase 專案

```bash
firebase login --account=ipad@mail2.smes.tyc.edu.tw
firebase projects:create teachers-ai-assistant --account=ipad@mail2.smes.tyc.edu.tw
```

### 4.3 步驟二：在 Firebase Console 設定 App Hosting

1. 開 https://console.firebase.google.com/project/teachers-ai-assistant/apphosting
2. 點 **Get started**
3. **Connect to GitHub** → 選 `teachers-ai-assistant` repo
4. Branch：`main`
5. Root directory：`/`（保留預設）
6. App name：`teachers-ai-assistant`

### 4.4 步驟三：設定 Secret（API Key）

```bash
firebase apphosting:secrets:set GEMINI_API_KEY \
  --project=teachers-ai-assistant \
  --account=ipad@mail2.smes.tyc.edu.tw
# 提示輸入時貼上 AIzaSy... 那串
```

然後在專案根目錄建立 `apphosting.yaml`：

```yaml
runConfig:
  minInstances: 0
  maxInstances: 10
  cpu: 1
  memoryMiB: 512

env:
  - variable: GEMINI_API_KEY
    secret: GEMINI_API_KEY
  - variable: NEXT_PUBLIC_SITE_URL
    value: https://teachers-ai-assistant--{project-id}.web.app
```

提交：

```bash
git add apphosting.yaml
git commit -m "feat: configure Firebase App Hosting"
git push
```

→ Firebase 偵測到 push 自動 build & deploy。

### 4.5 步驟四：對應網址

完成後網址形式：

- `https://teachers-ai-assistant--<project-id>.web.app`
- 也可在 Firebase Hosting → Custom domain 接自己的域名

---

## 5. 路線 C：GitHub Pages + Firebase Cloud Functions（純靜態前端）

> ⚠️ **這條路線需要重構大量程式碼**，原本的 Server Action 要拆成 Cloud Function HTTP API，前端改用 `fetch` 呼叫。
> 推薦給：堅持「網頁本體一定要在 GitHub Pages、不要任何 vendor lock-in」的人。

### 5.1 重構方向總覽

| 原架構 | 新架構 |
|---|---|
| Next.js App Router + Server Action | Next.js `next export` 純靜態，或改寫成 Vite + React |
| `'use server'` 函式直接呼叫 Genkit | Firebase Cloud Function 包 Genkit |
| 前端表單 `useActionState` | 前端用 `fetch('/api/...')` 呼叫 Function |
| 環境變數 `process.env.GEMINI_API_KEY` | Firebase Secret Manager |

### 5.2 大致改動步驟

#### Step 1: 把 Genkit Flow 抽出為獨立 Cloud Function

新增 `functions/src/index.ts`：

```ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

const geminiKey = defineSecret("GEMINI_API_KEY");

export const generateParentReply = onCall(
  { secrets: [geminiKey], region: "asia-east1" },
  async (request) => {
    const ai = genkit({
      plugins: [googleAI({ apiKey: geminiKey.value() })],
      model: "googleai/gemini-2.0-flash",
    });

    const { parentMessage, scenario } = request.data;
    if (!parentMessage) throw new HttpsError("invalid-argument", "parentMessage required");

    const { text } = await ai.generate({
      prompt: `你是一位樂於助人且富有同理心的教師助理...
家長的訊息: ${parentMessage}
情境: ${scenario}
...`,
    });

    return { reply: text };
  }
);
```

#### Step 2: 部署 Function

```bash
cd functions
npm install
firebase deploy --only functions:generateParentReply \
  --project=teachers-ai-assistant \
  --account=ipad@mail2.smes.tyc.edu.tw
```

#### Step 3: 改寫前端

`src/lib/actions.ts` 整個刪掉，改在 `ReplyGeneratorForm.tsx` 用 Firebase callable：

```ts
import { initializeApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseApp = initializeApp({ /* config */ });
const functions = getFunctions(firebaseApp, "asia-east1");
const callGenerate = httpsCallable(functions, "generateParentReply");

const result = await callGenerate({ parentMessage, scenario });
const reply = (result.data as any).reply;
```

#### Step 4: 改 Next.js 為純靜態輸出

`next.config.ts`：

```ts
const nextConfig: NextConfig = {
  output: "export",  // ← 重點
  images: { unoptimized: true },
  // ...
};
```

執行：

```bash
npm run build
# 會產生 out/ 資料夾
```

#### Step 5: GitHub Pages 部署 Workflow

新增 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./out
      - uses: actions/deploy-pages@v4
```

啟用 GitHub Pages：

```bash
gh api -X POST repos/cagoooo/teachers-ai-assistant/pages \
  -f source[branch]=gh-pages -f source[path]=/
```

→ 網址：`https://cagoooo.github.io/teachers-ai-assistant/`

> 💡 詳細遷移流程，可參考你已有的 skill `firebase-studio-static-migration`。

### 5.3 路線 C 的代價

- ❌ 需要重寫前端表單邏輯（拋棄 `useActionState`）
- ❌ Cold start：第一次呼叫 Function 約 2–5 秒
- ❌ 安全性需自己加 Firebase App Check + Cloudflare Turnstile（API 公開暴露）
- ✅ 但程式碼 100% 在 GitHub、可完全 self-host

---

## 6. 部署前 checklist

不論選哪條路線，部署前都要確認：

### 6.1 程式碼層面

- [ ] `git status` 乾淨（沒有未提交檔案）
- [ ] `npm run typecheck` 無錯誤
- [ ] `npm run lint` 無錯誤
- [ ] `npm run build` 成功（本機可正常 build）
- [ ] `.env.local` **不在** git 追蹤中（執行 `git ls-files | grep .env` 應為空）
- [ ] `package.json` 的 `dependencies` 完整（沒有放在 devDependencies 應該的）

### 6.2 環境變數

- [ ] `GEMINI_API_KEY` 已準備（**未來會推送到部署平台**）
- [ ] `NEXT_PUBLIC_SITE_URL` 已準備（部署後的正式網址）
- [ ] 確認 API Key **沒有出現**在任何 commit 過的檔案（`git log -p | grep AIzaSy` 應為空）

### 6.3 文件

- [ ] [README.md](../README.md) 更新（加上線上 demo 連結）
- [ ] [USAGE.md](USAGE.md) 確認內容正確
- [ ] [IMPROVEMENTS.md](IMPROVEMENTS.md) 已閱讀（評估是否要先做某些改良再上線）

---

## 7. API Key 安全防護

### 7.1 限制 API Key 使用範圍（最重要）

到 Google Cloud Console → APIs & Services → Credentials：

1. 找到你的 API Key
2. **Application restrictions**：選 **HTTP referrers**
   - 加入：`https://your-vercel-url.vercel.app/*`
   - 加入：`https://your-custom-domain.com/*`
   - 加入：`http://localhost:9002/*`（開發用）
3. **API restrictions**：選 **Restrict key**
   - 只勾選 **Generative Language API**

→ 這樣 key 就算外流也只能在你的網站用。

### 7.2 加上 Rate Limit（防腳本攻擊）

免費 Gemini quota 是每天 1,500 次。假設有人寫腳本一直打：

- 平台層：Vercel 免費版 100GB/月 流量、Firebase Functions 免費 200 萬次調用
- 應用層：建議加 **Cloudflare Turnstile**（免費人機驗證）

→ 詳見你已有的 skill `cloudflare-turnstile-integration`

### 7.3 監控用量

Google AI Studio → Quota → 設定 alert：

- 達到 50% 時 email 你
- 達到 90% 時自動鎖

---

## 8. 部署後驗證

### 8.1 功能驗證 checklist

部署完線上版後，依序測試：

- [ ] 首頁能載入（無 500 錯誤）
- [ ] 樣式正常（Tailwind class 有套用）
- [ ] 字型正常（Geist Sans/Mono 載入）
- [ ] 選擇情境下拉選單可開啟
- [ ] 12 種情境都看得到
- [ ] 貼上家長訊息（少於 10 字）→ 顯示驗證錯誤
- [ ] 貼上家長訊息（≥10 字）+ 選情境 → 點產生 → 進度條跑
- [ ] AI 回覆 3–8 秒內出現
- [ ] Markdown 格式正常渲染（粗體、列表）
- [ ] 點「複製回覆」→ Toast 提示「已複製」
- [ ] 開另一個 tab，貼上回覆 → 內容正確
- [ ] 浮動按鈕（🦄、🐝）可點擊並開新分頁
- [ ] Footer 連結到石門國小網站
- [ ] 手機板畫面（Chrome DevTools 或實機）操作正常
- [ ] 深色模式（系統切換）顯示正確

### 8.2 效能驗證

- 開 Chrome DevTools → Lighthouse
- 跑 Performance / Accessibility / Best Practices / SEO
- **目標**：每項 ≥ 90 分

### 8.3 安全驗證

- 開瀏覽器 DevTools → Network → 隨便點一個產生回覆
- 檢查 Request Headers / Response Body
- **不應該**看到任何 `AIzaSy...` 字串
- F12 → Sources → 全文搜尋 `GEMINI_API_KEY` → 應無結果

---

## 9. 常見部署問題排除

### 9.1 Vercel build 失敗：`Cannot find module '@genkit-ai/googleai'`

→ 確認 `package.json` 把 `@genkit-ai/googleai` 放在 `dependencies` 而非 `devDependencies`。
→ 已正確：`"@genkit-ai/googleai": "^1.8.0"` 在 dependencies ✓

### 9.2 部署後 AI 永遠回 500

最常見：`GEMINI_API_KEY` 環境變數沒設，或值前後有空白。

修法：

- Vercel：Project Settings → Environment Variables → 重新設定，**重新部署**（環境變數改了要重 deploy 才生效）
- Firebase：`firebase apphosting:secrets:set GEMINI_API_KEY --project=...`

### 9.3 部署後字型亂碼

Geist 透過 `geist/font/sans` 套件載入，build 時會把字型一起包進去。
若亂碼通常是 CDN 快取，等 5 分鐘或強制重整 `Ctrl+Shift+R`。

### 9.4 GitHub Push 被擋：Secret Scanning

```
remote: error: GH013: Repository rule violations found...
remote: - Push cannot contain secrets
```

→ 表示你不小心 commit 了 `.env.local` 或 API Key 直接寫在程式碼。
→ 解法：

```bash
# 1. 把檔案從歷史移除
git rm --cached .env.local
git commit -m "chore: remove .env.local from tracking"

# 2. 如果是程式碼裡有寫死，先改掉再 commit
# 3. 強制換新的 API Key（舊的等同已洩漏）
# 4. 推
git push
```

> 嚴重的話用 `git filter-repo` 重寫歷史，或詳見 skill `firebase-ci-troubleshooter`。

### 9.5 Vercel Hobby 配額不足

Hobby Tier 限制：

- 100GB 流量/月
- 100GB-小時 Serverless Function 執行時間
- Build 6,000 分鐘/月

校內幾十位老師日常使用通常用不到 10%。
若超過：升級 Vercel Pro（$20/月）或遷移到路線 B/C。

---

## 🎯 最後建議：給阿凱老師的部署順序

```
今天（<10分鐘）
  ├── 1. 推上 GitHub repo（用 cagoooo 帳號）
  ├── 2. Vercel 一鍵部署（路線 A）
  ├── 3. 設環境變數
  └── 4. 拿到 *.vercel.app 網址

本週
  ├── 5. 加 Google Cloud HTTP referrer 限制
  ├── 6. 跑一次 Lighthouse 看分數
  └── 7. 改 NEXT_PUBLIC_SITE_URL 為實際網址

本月
  ├── 8. 開 IMPROVEMENTS.md，挑優先級高的功能補上
  ├── 9. 自訂網域（買 .tw 或用 .net 都行）
  └── 10. 評估是否要遷移到路線 B/C
```

---

**有問題？**
- 部署 troubleshoot：參考 skill `firebase-ci-troubleshooter`
- API Key 安全：參考 skill `gcp-api-key-secure-create`
- 純靜態遷移：參考 skill `firebase-studio-static-migration`

**Made with ❤️ by 阿凱老師** ｜ 桃園市石門國小資訊組
