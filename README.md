# 🎓 教師回應訊息建議小幫手

> 為親師溝通提供 AI 輔助回覆建議的 Web App
> **設計：桃園市石門國小資訊組 [阿凱老師](https://www.smes.tyc.edu.tw/)**

[![Deploy Status](https://github.com/cagoooo/Message/actions/workflows/deploy.yml/badge.svg)](https://github.com/cagoooo/Message/actions/workflows/deploy.yml)
![Next.js](https://img.shields.io/badge/Next.js-15.2-black?logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-Functions-orange?logo=firebase)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-blue?logo=google)

> 📌 **目前版本：v1.0.0**（版本管理自 2026-09-06 起，依據 `package.json`）

---

## 🌐 線上 Demo

👉 **https://cagoooo.github.io/Message/**

---

## 🎯 功能簡介

老師三步驟取得家長訊息的同理心 AI 回覆稿：

1. **選擇情境**（孩童受傷、嚴重衝突、家長正面回饋等 12 種）
2. **貼上家長訊息**
3. **點「產生回覆建議」** → AI 用繁中產生 Markdown 格式回覆 → 一鍵複製

---

## 🏗️ 架構（Serverless + 全部跑在 GitHub）

```
┌────────────────────────────────────┐
│  GitHub Pages (純靜態前端，免費)   │
│  Next.js 15 static export          │
└──────────────┬─────────────────────┘
               │ httpsCallable
               ▼
┌────────────────────────────────────┐
│  Firebase Cloud Functions v2       │
│  (asia-east1, Node 20, callable)   │
│  + Genkit + Gemini 2.5 Flash       │
└──────────────┬─────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌───────────┐   ┌───────────────┐
│ Firestore │   │ Secret Manager│
│ (資料儲存)│   │ GEMINI_API_KEY│
└───────────┘   └───────────────┘
```

### 為什麼這樣設計？

- **GitHub Pages**：免費、Code 與部署都在 GitHub 一條鞭管理
- **Firebase Functions**：保護 `GEMINI_API_KEY`，不會洩漏到瀏覽器
- **靜態前端**：CDN 加速、無 SSR 成本、不會被 vendor lock-in

---

## 🚀 快速開始（本機開發）

### 1. 取得程式碼

```bash
git clone https://github.com/cagoooo/Message.git
cd Message
npm install
cd functions && npm install && cd ..
```

### 2. 設定環境變數

```bash
cp .env.local.example .env.local
# 編輯 .env.local，填入 Firebase Web SDK 設定
# (取得方式：firebase apps:sdkconfig WEB <appId>)
```

### 3. 啟動

```bash
# 前端 (Next.js dev server)
npm run dev
# 開 http://localhost:9002

# 改 functions 後本地測試（emulator）
firebase emulators:start --only functions
```

> 完整使用說明請看 [docs/USAGE.md](docs/USAGE.md)

---

## 📦 部署流程

### 前端（自動）
推到 `main` branch → GitHub Actions 自動 build → GitHub Pages 自動上線。
**Secret 已設好**，零手動操作。

### Functions（手動）
```bash
cd functions
firebase deploy --only functions \
  --project=teachers-ai-assistant-g4iph \
  --account=ipad@mail2.smes.tyc.edu.tw
```

> 完整部署指南請看 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## 📚 文件

| 文件 | 內容 |
|---|---|
| [docs/USAGE.md](docs/USAGE.md) | 完整使用說明、技術棧、常見問題 |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | 三條部署路線比較與步驟 |
| [docs/IMPROVEMENTS.md](docs/IMPROVEMENTS.md) | 後續優化改良建議（25 項，分 P0-P3 優先級） |
| [docs/blueprint.md](docs/blueprint.md) | 原始 App 設計藍圖 |

---

## 🧱 技術棧

| 層級 | 技術 |
|---|---|
| **前端** | Next.js 15.2 (App Router, static export) ・ React 18 ・ TypeScript ・ Tailwind ・ shadcn/ui |
| **AI** | Google Genkit ・ Gemini 2.5 Flash |
| **後端** | Firebase Cloud Functions v2 (Node 20, asia-east1) |
| **資料庫** | Firestore (Native mode, asia-east1) |
| **密鑰管理** | GCP Secret Manager |
| **部署** | GitHub Pages (前端) ・ Firebase (Functions) |
| **CI/CD** | GitHub Actions |

---

## 🔐 安全要點

- ✅ `GEMINI_API_KEY` 透過 Secret Manager 注入 Function，**不寫在程式碼或前端**
- ✅ Firebase Web API Key 設定 HTTP referrer 限制（只允許 `cagoooo.github.io/Message/*` 與 localhost）
- ✅ Cloud Function CORS 限制只接受 `cagoooo.github.io` 與 localhost 來源
- ✅ Firestore 預設 deny-all rules（目前 app 不直接寫 Firestore）
- ✅ Functions Artifact Registry 1 天清理政策，避免容器映像費用累積
- 🔜 待加：Cloudflare Turnstile 防腳本攻擊（見 [IMPROVEMENTS.md P1-3](docs/IMPROVEMENTS.md)）

---

## 💰 預期費用

| 服務 | 免費額度 | 學校用量 | 月費 |
|---|---|---|---|
| GitHub Pages | 100GB 流量 | < 1GB | $0 |
| Firebase Functions v2 | 200 萬次/月 | < 1 萬次 | $0 |
| Firestore | 1GB 儲存 + 5 萬讀/天 | 個人用量 | $0 |
| Gemini API | 1,500 次/天 | 教師日常 | $0 |
| Cloud Storage (容器) | 5GB + 1 天清理政策 | 幾 MB | $0 |

**Blaze 預算 alert 設 $1 USD**，幾乎不可能觸發。

---

## 📜 授權與致謝

© 2025 桃園市石門國小資訊組

**Made with ❤️ by [阿凱老師](https://www.smes.tyc.edu.tw/)**

---

<!-- BEGIN:PROJECT_GUIDE -->
## 專案導覽

教師回應訊息建議小幫手Pro版

- 專案定位：教育科技／教學支援專案
- Repository：`cagoooo/Message`
- 可見性：公開
- 主要技術：TypeScript、React、Next.js、Firebase、Tailwind CSS
- 線上入口：<https://cagoooo.github.io/Message/>

### 可以怎麼應用

- 教師備課、課堂示範與學生自主練習
- 依年級、領域或校本課程替換內容，建立可重複使用的教學版本
- 作為教育科技活動、學習成效觀察或 AI 輔助教學的原型

這些是依目前專案定位整理的延伸方向，不代表所有情境都已內建完成；實作前請先確認現有功能與資料格式。

### 技術與專案結構

- `README.md`
- `docs`
- `firebase.json`
- `functions`
- `package.json`
- `public`
- `scripts`
- `src`

檔案結構會隨版本演進；若本節與程式碼不一致，以目前預設分支的原始碼為準。

### 本機執行

```bash
npm install
# dev
npm run dev
# start
npm run start
# build
npm run build
# test
npm run test
# lint
npm run lint
```
請以 `package.json` 的 `scripts` 為準；若專案需要雲端服務，請先建立自己的環境變數與測試專案。

### 給 AI Agent 的接手指南

1. 先閱讀本 README、`AGENTS.md`（若有）、套件腳本與部署設定。
2. 先辨識教材、題庫、提示詞或設定資料的單一來源，避免只改畫面上的副本。
3. 調整內容時維持適齡、可讀性、無障礙與個資保護。
4. 修改後驗證教師操作流程、學生操作流程，以及桌機、平板、手機的可用性。
5. 不要捏造尚未存在的功能；README 與實作有落差時，應同時更新文件。
6. 提交前只納入本次任務檔案，並記錄實際執行過的驗證。

### 安全與資料注意事項

- 不要提交 `.env`、服務帳號、API 金鑰、token、學生個資或正式環境匯出資料。
- 使用 Firebase、Supabase、Google API 或其他雲端服務時，請建立自己的測試專案並套用最小權限。
- 若要公開衍生作品，請先確認程式碼、圖片、音訊、字型與教材內容的授權。

### 貢獻與客製化

歡迎依教學現場、活動或工作流程需求進行 fork／客製化。建議在變更說明中交代使用情境、主要修改、測試方式，以及是否影響資料格式或部署設定。
<!-- END:PROJECT_GUIDE -->
