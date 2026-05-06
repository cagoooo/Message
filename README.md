# 🎓 教師回應訊息建議小幫手

> 為親師溝通提供 AI 輔助回覆建議的 Web App
> **設計：桃園市石門國小資訊組 [阿凱老師](https://www.smes.tyc.edu.tw/)**

[![Deploy Status](https://github.com/cagoooo/Message/actions/workflows/deploy.yml/badge.svg)](https://github.com/cagoooo/Message/actions/workflows/deploy.yml)
![Next.js](https://img.shields.io/badge/Next.js-15.2-black?logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-Functions-orange?logo=firebase)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-blue?logo=google)

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
