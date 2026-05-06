# 教師回應訊息建議小幫手 — 使用說明書

> 為親師溝通提供 AI 輔助回覆建議的 Next.js 15 + Google Genkit Web App
> 設計：桃園市石門國小資訊組 阿凱老師

---

## 📑 目錄

1. [專案概覽](#1-專案概覽)
2. [技術棧一覽](#2-技術棧一覽)
3. [專案結構](#3-專案結構)
4. [本機開發環境設定](#4-本機開發環境設定)
5. [環境變數設定](#5-環境變數設定)
6. [常用指令](#6-常用指令)
7. [使用流程（前端使用者視角）](#7-使用流程前端使用者視角)
8. [核心架構說明](#8-核心架構說明)
9. [情境（Scenario）對照表](#9-情境scenario對照表)
10. [常見問題排除](#10-常見問題排除)

---

## 1. 專案概覽

### 用途

協助國小／國中教師快速產生「同理心 + 專業」的家長訊息回覆稿。教師只要：

1. 從下拉選單挑一個情境（孩童受傷、嚴重衝突…）
2. 把家長傳來的原始訊息貼進去
3. 按下「產生回覆建議」

→ AI 會用繁體中文（台灣慣用詞）產生一份結構化、可直接複製貼上 LINE / Email 的回覆草稿。

### 主要功能

| 功能 | 說明 |
|---|---|
| 🤖 AI 回覆產生 | 透過 Google Gemini 2.0 Flash 產生客製化回覆 |
| 📋 一鍵複製 | 按鈕點下立刻複製到剪貼簿（含 fallback 備援機制） |
| 🎨 12 種情境 | 從受傷、衝突到家長正面回饋一應俱全 |
| 📝 Markdown 渲染 | AI 回應支援標題、列表、粗體等格式 |
| 📱 RWD 響應式 | 手機、平板、桌機都能順暢使用 |
| 🌗 深色模式 | 自動跟隨系統設定 |
| 🎯 浮動廣告按鈕 | 連結到「創建專屬助手」與「點石成金（評語優化）」 |

---

## 2. 技術棧一覽

| 類別 | 套件 | 版本 |
|---|---|---|
| 前端框架 | Next.js | 15.2.3（App Router + Turbopack） |
| 程式語言 | TypeScript | ^5 |
| UI 函式庫 | React | ^18.3.1 |
| 樣式 | Tailwind CSS | ^3.4.1 |
| 元件庫 | shadcn/ui (Radix UI) | 多套 |
| 圖示 | lucide-react | ^0.475.0 |
| 表單 | react-hook-form + zod | ^7.54 / ^3.24 |
| AI SDK | Google Genkit | ^1.8.0 |
| AI 模型 | Gemini 2.0 Flash | googleai/gemini-2.0-flash |
| Markdown | react-markdown | ^9.0.1 |
| 字型 | Geist Sans / Geist Mono | ^1.3.0 |
| Node 版本 | Node.js 20 LTS | （`.idx/dev.nix` 指定） |

---

## 3. 專案結構

```
modest-bose-01d0c6/
├── .idx/                       # Firebase Studio (IDX) 工作區設定
│   └── dev.nix                 # Nix 環境定義（Node 20 + JDK）
├── .vscode/                    # VS Code 設定
├── docs/
│   ├── blueprint.md            # 原始 App 規劃藍圖
│   ├── USAGE.md                # ← 本文件
│   ├── DEPLOYMENT.md           # GitHub 部署指南
│   └── IMPROVEMENTS.md         # 後續優化建議
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # 根佈局（含 Metadata、Toaster、Footer）
│   │   ├── page.tsx            # 首頁
│   │   ├── globals.css         # Tailwind 全域樣式 + CSS 變數主題
│   │   └── favicon.ico
│   ├── ai/
│   │   ├── genkit.ts           # Genkit 初始化（Gemini 2.0 Flash）
│   │   ├── dev.ts              # Genkit 開發伺服器入口
│   │   └── flows/
│   │       └── generate-parent-reply.ts  # AI 流程定義 + Prompt
│   ├── components/
│   │   ├── ReplyGeneratorForm.tsx        # 主表單（含 useActionState）
│   │   ├── FloatingAdButton.tsx          # 右下角浮動按鈕
│   │   └── ui/                            # shadcn/ui 元件（30+ 個）
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   └── lib/
│       ├── actions.ts          # Server Action（呼叫 Genkit Flow）
│       └── utils.ts            # cn() 等工具函式
├── components.json             # shadcn/ui 設定
├── next.config.ts              # Next.js 設定（圖片白名單）
├── tailwind.config.ts          # Tailwind 主題色
├── tsconfig.json
├── package.json
└── README.md
```

---

## 4. 本機開發環境設定

### 4.1 系統需求

- **Node.js**：20 LTS（其他版本可能但 `.idx/dev.nix` 鎖定 20）
- **npm**：10.x 或更高
- **Git**
- **Google AI Studio API Key**（Gemini 用）→ 至 https://aistudio.google.com/apikey 申請（免費）

### 4.2 取得程式碼

```bash
git clone <你的-repo-url>
cd <repo>
```

### 4.3 安裝套件

```bash
npm install
```

> ⚠️ 第一次安裝大約需 2–4 分鐘（package-lock.json 約 400KB，依賴頗多）。

### 4.4 申請 Gemini API Key（免費）

1. 前往 https://aistudio.google.com/apikey
2. 用 Google 帳號登入
3. 點「Create API Key」→ 選一個 Google Cloud 專案（或建立新的）
4. 複製產生的 `AIzaSy...` 39 字元字串

> 💡 Gemini API **免費層**每分鐘 15 次、每天 1,500 次請求對校內使用通常綽綽有餘，不需綁信用卡。

### 4.5 建立 `.env.local`

在專案根目錄建立 `.env.local`：

```env
GEMINI_API_KEY=AIzaSy你剛剛複製的那串
NEXT_PUBLIC_SITE_URL=http://localhost:9002
```

> ⚠️ **永遠不要**把 `.env.local` 推到 Git。`.gitignore` 已經把 `.env*` 排除。

### 4.6 啟動開發伺服器

```bash
npm run dev
```

預設會在 **http://localhost:9002** 啟動（`package.json` 的 `dev` script 指定 `-p 9002`）。
Turbopack 開啟，熱重載飛快。

---

## 5. 環境變數設定

| 變數名 | 用途 | 是否必要 | 範例 |
|---|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API 金鑰，給 Genkit 用 | ✅ 必填 | `AIzaSy...` |
| `NEXT_PUBLIC_SITE_URL` | 網站對外網址，給 OpenGraph metadata 使用 | 建議填 | `https://your-domain.com` |

### 三種環境的 `.env` 檔分工

| 檔名 | 用途 | 是否進 git |
|---|---|---|
| `.env.local` | 本機開發 | ❌（已被 .gitignore） |
| `.env.production` | 正式環境 build 時用 | ❌ |
| Vercel / Firebase 環境變數面板 | 線上部署 | ❌ |

---

## 6. 常用指令

| 指令 | 用途 |
|---|---|
| `npm run dev` | 啟動 Next.js 開發伺服器（port 9002，Turbopack） |
| `npm run build` | 建置正式版（產生 `.next/`） |
| `npm run start` | 啟動正式版伺服器（需先 build） |
| `npm run lint` | 執行 ESLint |
| `npm run typecheck` | 執行 TypeScript 型別檢查（不產生 js） |
| `npm run genkit:dev` | 啟動 Genkit 開發 UI（http://localhost:4000，可單獨測試 AI flow） |
| `npm run genkit:watch` | 同上但檔案變更自動重啟 |

### Genkit Dev UI 怎麼用？

```bash
npm run genkit:watch
```

會開啟一個 **http://localhost:4000** 的網頁，裡面可以：

- 直接測試 `generateParentReplyFlow`（不用透過前端表單）
- 查看每次 AI 呼叫的 token 數、回應時間、錯誤訊息
- 調整 Prompt 即時測試效果

> 💡 Debug AI 行為時超好用，比從前端發請求省時 10 倍。

---

## 7. 使用流程（前端使用者視角）

### 7.1 操作三步驟

1. **選擇情境**
   - 點上方下拉選單「選擇一個常見情況」
   - 12 種情境彩色選項，選最接近的一個
   - 選好後選單按鈕會變成漸層彩色，提示已選定

2. **貼上家長訊息**
   - 在「家長訊息 or 陳述狀況」文字框內，貼上 LINE / Email 上家長的原話
   - **至少 10 個字元**（zod 驗證）
   - 也可以用自己的話描述狀況（例：「家長抱怨小孩說午餐被同學搶走」）

3. **按「產生回覆建議」**
   - 進度條會顯示 AI 思考進度（10% → 95% 漸進）
   - 約 3–8 秒（依網路與 Gemini 排隊狀況而定）
   - 完成後下方出現「建議回覆」卡片
   - 自動 smooth scroll 到回覆位置
   - 右下角 toast 提示「回覆已產生！」

### 7.2 複製與使用

- 「建議回覆」卡片右下角有「**複製回覆**」按鈕
- 點下後會：
  1. 先試 `navigator.clipboard.writeText`（現代瀏覽器）
  2. 失敗則 fallback 到 `document.execCommand('copy')`（舊瀏覽器 / iframe 內）
  3. 兩者都失敗才提示手動複製
- Toast 會顯示「回覆已複製！」

### 7.3 浮動按鈕

右下角永遠掛著兩個按鈕：

| 按鈕 | 連結 |
|---|---|
| 🦄 創建專屬助手 | https://document-ai-companion-ipad4.replit.app |
| 🐝 點『石』成金（評語優化） | LINE 官方帳號 `@733oiboa` |

---

## 8. 核心架構說明

### 8.1 資料流

```
[使用者填表]
    │
    ▼
[ReplyGeneratorForm.tsx]
   - react-hook-form 驗證
   - useActionState + startTransition
    │
    ▼
[/src/lib/actions.ts]
   - Server Action: handleGenerateReplyAction
   - zod 二次驗證
    │
    ▼
[/src/ai/flows/generate-parent-reply.ts]
   - Genkit Flow: generateParentReplyFlow
   - 呼叫 Gemini 2.0 Flash
    │
    ▼
[Google Gemini API]
   - 處理 Prompt + 情境
   - 回傳 Markdown 格式回覆
    │
    ▼
[前端渲染 react-markdown]
```

### 8.2 為什麼用 Server Action？

`src/lib/actions.ts` 第一行 `"use server"` 表示這個函式**只在伺服器端執行**。
這個設計很重要：

- ✅ `GEMINI_API_KEY` 永遠不會洩漏到瀏覽器
- ✅ 前端只看到表單送出 → 伺服器回傳結果
- ✅ 不需要額外寫 `/api/route.ts`，Next.js 15 直接整合

> ⚠️ **這也是為什麼這個 App 不能直接部署到 GitHub Pages**（純靜態託管）的原因。詳見 [DEPLOYMENT.md](DEPLOYMENT.md)。

### 8.3 Genkit Flow 結構

```ts
// src/ai/flows/generate-parent-reply.ts
const InputSchema = z.object({
  parentMessage: z.string(),
  scenario: z.string().optional(),
});

const OutputSchema = z.object({
  reply: z.string(),  // Markdown 格式
});

const generateParentReplyPrompt = ai.definePrompt({
  name: 'generateParentReplyPrompt',
  input: { schema: InputSchema },
  output: { schema: OutputSchema },
  prompt: `你是一位樂於助人且富有同理心的教師助理...`,
});
```

→ Genkit 自動處理：型別安全、輸出 JSON 解析、retry、tracing。

### 8.4 主題色系統

CSS 變數定義在 `src/app/globals.css`，遵循 shadcn/ui 慣例：

- **主色**：`--primary` 淡紫色（HSL 250 50% 65%）
- **強調色**：`--accent` 溫和藍（HSL 195 50% 70%）
- **特殊按鈕**：`--warm-orange-red`（送出按鈕）、`--special-button-gold`（評語優化按鈕）
- 深色模式自動切換（`.dark` class）

要改主題色？改 `globals.css` 裡的 HSL 值就好，**不要動 Tailwind config**。

---

## 9. 情境（Scenario）對照表

| value（傳給 AI） | label（畫面顯示） | 適用情境 |
|---|---|---|
| `Child Injury` | 孩童受傷 | 在校跌倒、運動受傷、家長詢問細節 |
| `Serious Conflict` | 嚴重衝突 | 學生霸凌、家長間糾紛、需冷靜處理 |
| `Irrational Message` | 回應不理性訊息 | 家長情緒激動、出言不遜、需軟化氣氛 |
| `Academic Concern` | 學業問題 | 成績下降、學習狀況、補救教學 |
| `Behavioral Issue` | 行為問題 | 上課不專心、作業不交、品行 |
| `Positive Feedback` | 家長正面回饋 | 家長感謝、稱讚老師，需謙虛回應 |
| `Request for Meeting` | 家長要求會面 | 家長要約時間到校面談 |
| `Missed Homework/Assignment` | 缺交作業 | 作業未交的溝通 |
| `Upcoming Event Inquiry` | 活動詢問 | 家長詢問運動會、戶外教學等 |
| `Health Concern` | 健康問題 | 過敏、慢性病、用藥提醒 |
| `General Inquiry` | 一般詢問 | 沒上述特定類別的詢問 |
| `Other` | 其他 | 上述都不符合的特殊情況 |

→ 想新增情境？只需編輯 [ReplyGeneratorForm.tsx:53](src/components/ReplyGeneratorForm.tsx) 的 `scenarios` 陣列，AI Prompt 會自動接收新值。

---

## 10. 常見問題排除

### 10.1 啟動就報錯：`Cannot find module 'genkit'`

```bash
rm -rf node_modules package-lock.json
npm install
```

### 10.2 AI 回應 `Error fetching from https://generativelanguage.googleapis.com/...`

**原因 1**：`GEMINI_API_KEY` 沒設或拼錯
→ 檢查 `.env.local`，重啟 `npm run dev`

**原因 2**：模型名稱被 Google 棄用
→ 開啟 [src/ai/genkit.ts](src/ai/genkit.ts)，把 `gemini-2.0-flash` 改成最新版（如 `gemini-2.5-flash`）。Google 約每 6 個月會棄用舊模型。

**原因 3**：超過免費層 quota（每天 1,500 次 / 每分鐘 15 次）
→ 等到隔天或申請新 key

### 10.3 部署到 Vercel / Firebase 後 AI 不工作

最常見：環境變數沒在線上平台設定。

- **Vercel**：Project Settings → Environment Variables → 加 `GEMINI_API_KEY`
- **Firebase Hosting + Functions**：用 `firebase functions:config:set gemini.key="..."` 或 Secret Manager

### 10.4 Port 9002 被占用

改 `package.json` 的 `dev` script，把 `-p 9002` 改成其他 port，或：

```bash
npx kill-port 9002
npm run dev
```

### 10.5 改了 Prompt 但回覆沒變

- Server Action 會被 Next.js 快取，**改完要重啟 dev server**
- 或在瀏覽器強制重整（`Ctrl+Shift+R` / `Cmd+Shift+R`）

### 10.6 想看 AI 實際吃了什麼 Prompt？

```bash
npm run genkit:watch
```

→ 開啟 http://localhost:4000，每次呼叫 flow 都看得到完整 trace。

---

## 📚 延伸閱讀

- [DEPLOYMENT.md](DEPLOYMENT.md) — 把這個 App 部署到 GitHub / Vercel / Firebase 的完整指南
- [IMPROVEMENTS.md](IMPROVEMENTS.md) — 後續優化改良建議（功能、效能、安全、UX）
- [blueprint.md](blueprint.md) — 原始 App 設計藍圖

---

**Made with ❤️ by 阿凱老師** ｜ 桃園市石門國小資訊組
有問題可至 https://www.smes.tyc.edu.tw/ 聯繫
