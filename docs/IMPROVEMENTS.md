# 後續優化改良建議

> 這份清單是**從程式碼實際檢查**得出的改良點，每項都標示**優先級**、**難度**、**預估工時**、**修改檔案**。
> 已完成的項目精簡標記 ✅，**未完成的保留完整實作說明**方便你未來自選實作。
>
> 圖例：✅ 已完成 ｜ ⏭ 已決定跳過 ｜ 🟡 部分完成 ｜ ⏳ 未做

**最近更新**：2026-05-06

---

## 📊 進度總覽

| 優先級 | 完成 / 總數 | 完成率 | 說明 |
|---|---|---|---|
| 🔴 P0（部署前必修） | **5 / 5** | **100%** ✅ | 全部完工 |
| 🟠 P1（兩週內修） | **7 / 8** | **87.5%** ✅ | 只有 Streaming 跳過 |
| 🟡 P2（一個月內修） | **5 / 7** | **71%** ✅ | 又完成 4 項 |
| 🟢 P3（有空再修） | 0 / 5 | 0% | **還可做 5 項** |

### 還可選擇做的項目摘要（共 ~23 小時可選工時）

| Pri | 項目 | 工時 | 難度 |
|---|---|---|---|
| ⏭ P1-7 | Streaming 回應 | 5h | ⭐⭐⭐⭐ |
| ⏳ P2-2 | 自訂 Prompt 進階模式 | 2h | ⭐⭐ |
| ⏳ P2-4 | OCR 上傳對話截圖 | 4h | ⭐⭐⭐ |
| ⏳ P2-5 | 多語系 (i18n) | 5h | ⭐⭐⭐ |
| ⏳ P3-1 | 動畫優化 (Framer Motion) | 3h | ⭐⭐ |
| ⏳ P3-2 | 統計儀表板（管理員用） | 4h | ⭐⭐⭐ |
| ⏳ P3-3 | 模型切換（Flash / Pro） | 30m | ⭐ |
| ⏳ P3-4 | 範本（Template）庫 | 2h | ⭐⭐ |
| ⏳ P3-5 | 老師專屬「家長性格筆記」（雲端） | 6h | ⭐⭐⭐⭐ |

---

## 📑 目錄

- [🔴 P0 — 部署前必修（已全數完成）](#-p0--部署前必修已全數完成)
- [🟠 P1 — 兩週內處理（7/8 完成）](#-p1--兩週內處理78-完成)
- [🟡 P2 — 一個月內處理（剩 5.5 項可選）](#-p2--一個月內處理剩-55-項可選)
- [🟢 P3 — 有空再做（5 項可選）](#-p3--有空再做5-項可選)
- [🚀 進階功能藍圖](#-進階功能藍圖)

---

## 🔴 P0 — 部署前必修（已全數完成）

### ✅ P0-1. TypeScript / ESLint 嚴格檢查 — 完成

**Commit**：[migrate to GitHub Pages + Firebase Functions](https://github.com/cagoooo/Message/commit/4766e46)
**實際做法**：[next.config.ts](../next.config.ts) 改 `ignoreBuildErrors: false` + `ignoreDuringBuilds: false`，所有型別錯誤已修復。CI 在每次 push 跑 `npm run typecheck` 確保不退化。

---

### ✅ P0-2. Gemini 模型升級 — 完成

**Commit**：[migrate to GitHub Pages](https://github.com/cagoooo/Message/commit/4766e46)
**實際做法**：[src/ai/genkit.ts](../src/ai/genkit.ts) + [functions/src/index.ts](../functions/src/index.ts) 用 `gemini-2.5-flash` + `process.env.GEMINI_MODEL` 環境變數覆寫，未來換模型不用 redeploy。

---

### ✅ P0-3. API Key 在 Secret Manager — 完成

**做法**：`GEMINI_API_KEY` 與 `TURNSTILE_SECRET_KEY` 都透過 `firebase-functions/params.defineSecret` 從 GCP Secret Manager 注入 Cloud Function，不寫進程式碼或 repo。Functions 服務帳號（`442886149275-compute@developer.gserviceaccount.com`）有 `secretAccessor` 權限。

---

### ✅ P0-4. OG 分享圖 — 完成（含中文內嵌字型）

**Commit**：[客製化 favicon 與 OG 圖](https://github.com/cagoooo/Message/commit/e67a83b)
**實際做法**：
- `public/og-image.png` (1200×630, 96 KB) 用 `@napi-rs/canvas` + `subset-font` 精簡 Noto Sans TC（12MB → 148KB）跨平台一致渲染中文
- og:image URL 加 `?v=<buildId>` cache-bust，每次部署社群平台會重抓
- 同步做了完整 favicon 多尺寸（16/32/48 ICO + 192/512 PNG + apple-touch-icon）

---

### ✅ P0-5. README 重寫 — 完成

**Commit**：[migrate to GitHub Pages](https://github.com/cagoooo/Message/commit/4766e46)
**實際做法**：[README.md](../README.md) 含架構圖、技術棧、快速開始、部署流程、安全要點、預期費用表。

---

## 🟠 P1 — 兩週內處理（7/8 完成）

### ✅ P1-1. 重設表單按鈕 — 完成

**Commit**：[Batch 1](https://github.com/cagoooo/Message/commit/9f3ab52)
**實際做法**：CardFooter 加「重設表單」outline 按鈕，點下後清空 scenario / parentMessage / generatedReply / state / Turnstile 並 toast 提示。

---

### ✅ P1-2. 歷史紀錄（localStorage）— 完成

**Commit**：[Batch 2](https://github.com/cagoooo/Message/commit/15c1ec7)
**實際做法**：
- `src/hooks/use-history.ts` — localStorage CRUD（含跨 tab 同步、損壞 JSON 防護、schema 過濾）
- `src/components/HistoryPanel.tsx` — Sheet 抽屜，每筆可複製、套回表單、刪除單筆、清空全部
- 主畫面右上角觸發按鈕帶筆數 badge
- 最多 20 筆，純本機儲存不上雲端
- **單元測試**：10 tests 覆蓋

---

### ✅ P1-3. Cloudflare Turnstile — 完成

**Commit**：[Batch 4](https://github.com/cagoooo/Message/commit/1b1017c)
**實際做法**：
- `src/components/reply-generator/TurnstileWidget.tsx` — 動態載入 challenges.cloudflare.com/turnstile/v0/api.js，explicit rendering，forwardRef 暴露 reset/getToken
- 表單送出前必須通過驗證，token 用過即 reset（單次有效）
- Function 端 `verifyTurnstile()` 在每次 generate 之前 POST siteverify，失敗 throw `permission-denied`
- Site Key 在 GitHub Secret，Secret Key 在 GCP Secret Manager

---

### ✅ P1-4. 字數統計動態提示 — 完成

**Commit**：[Batch 1](https://github.com/cagoooo/Message/commit/9f3ab52) + [字數調整](https://github.com/cagoooo/Message/commit/19a6d7c)
**實際做法**：parentMessage Textarea 下方依長度顯示色彩提示：
- 0 字 → 引導文字（灰）
- 1-4 字 → 「至少需要 5 個字元」（琥珀 warn）
- 5-1500 字 → 「N 字元 — 可送出 ✓」（綠色 good）
- > 1500 字 → 「訊息較長，AI 處理時間可能延長」（琥珀）

> 門檻從原規劃的 10 字降到 5 字（依使用者實測回饋調整）。

---

### ✅ P1-5. 元件拆分 — 完成

**Commit**：[Batch 3](https://github.com/cagoooo/Message/commit/9cdd1a1)
**實際做法**：[ReplyGeneratorForm.tsx](../src/components/ReplyGeneratorForm.tsx) 從 524 行 → 368 行，職責分離到：
- `src/components/reply-generator/constants.ts`（SCENARIOS / OPTION_COLORS / getScenarioLabel）
- `src/components/reply-generator/GeneratedReplyCard.tsx`（forwardRef）
- `src/components/reply-generator/LoadingCard.tsx`
- `src/components/reply-generator/TurnstileWidget.tsx`
- `src/hooks/use-copy-to-clipboard.ts`
- `src/hooks/use-fake-progress.ts`

---

### ✅ P1-6. 單元測試 — 完成

**Commit**：[Batch 6](https://github.com/cagoooo/Message/commit/9b3049a) + [CI fix](https://github.com/cagoooo/Message/commit/5a0b4a9)
**實際做法**：Vitest 4.x + @testing-library/react + jsdom，**38 個 unit test** 覆蓋 5 個關鍵檔案：

| 檔案 | tests |
|---|---|
| constants | 7 |
| use-history | 10 |
| use-copy-to-clipboard | 6 |
| use-fake-progress | 5 |
| actions.ts | 10 |

CI workflow `.github/workflows/ci.yml` 雙 job：test (typecheck + vitest) + test-functions (functions tsc)，每次 push/PR 自動跑。

---

### ⏭ P1-7. Streaming 回應 — 已決定跳過

**狀態**：使用者於 2026-05-06 明確選擇「穩定優先（B 方案）」，跳過此項。
**為何跳過**：
- callable function 不支援 streaming，需把 `onCall` 改成 `onRequest` HTTP function
- 前端改 `fetch` + `ReadableStream` 接收
- CORS 與 Turnstile 整合需重設
- 工程量大且當前 3-8 秒回應 + retry 機制已可接受

**未來想做時的做法概要**：

```ts
// functions/src/index.ts — 改用 onRequest + Genkit streaming
import { onRequest } from "firebase-functions/v2/https";

export const generateParentReplyStream = onRequest({
  cors: ["https://cagoooo.github.io"],
  secrets: [GEMINI_API_KEY, TURNSTILE_SECRET_KEY],
}, async (req, res) => {
  // 1. verify turnstile
  // 2. ai.generateStream()
  // 3. res.setHeader("Content-Type", "text/event-stream")
  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify({ delta: chunk.text })}\n\n`);
  }
  res.end();
});
```

```ts
// 前端用 EventSource 或 fetch + ReadableStream 接收 chunks
```

**預估工時**：5 小時 ｜ **難度**：⭐⭐⭐⭐

---

### ✅ P1-8. SEO / Metadata 強化 — 完成

**Commit**：[Batch 1](https://github.com/cagoooo/Message/commit/9f3ab52)
**實際做法**：[layout.tsx](../src/app/layout.tsx) 加上：
- `metadataBase` URL（拿掉 `your-website-url.com` 佔位符）
- `keywords` 8 個關鍵字
- `authors` / `creator` / `publisher`
- `<script type="application/ld+json">` WebApplication 結構化資料（含 EducationalApplication / EducationalAudience / 免費 offer）
- `viewport.themeColor: #7B61C4`
- 完整 OpenGraph + Twitter card

---

## 🟡 P2 — 一個月內處理（剩 2 項可選）

### ✅ P2-1. 「一鍵分享 LINE」功能 — 完成

**Commit**：[Batch 7](https://github.com/cagoooo/Message/commit/a44cf8c)
**實際做法**：[GeneratedReplyCard.tsx](../src/components/reply-generator/GeneratedReplyCard.tsx) 加「分享到 LINE」按鈕，LINE 品牌綠 #06C755 配色，點下開新分頁帶 reply 文字到 LINE 「選擇對象」介面。

---

### ⏳ P2-2. 自訂 Prompt 進階模式

**情境**：老師想加上「我們學校特殊背景」「家長的個性」等資訊。

**做法**：表單下加「進階設定」摺疊區：
- 學校名稱
- 教師姓名
- 學生年級
- 額外備註（例：「這位家長特別重視書面紀錄」）

把這些塞進 prompt：

```ts
prompt: `你是一位老師（${teacherName}）的教師助理...
學生年級：${grade}
特殊備註：${notes}
家長的訊息: ${parentMessage}
情境: ${scenario}
...`,
```

**預估工時**：2 小時 ｜ **難度**：⭐⭐

---

### ✅ P2-3. 多輪對話（refine 回覆）— 完成

**Commit**：[Batch 8](https://github.com/cagoooo/Message/commit/79b07c6)
**實際做法**：
- Function 端新增 `REFINE_PROMPT` template，輸入加 `refineInstruction` / `previousReply` 兩個 optional 欄位，`buildPrompt()` 自動切換初次 / refine 模式
- GeneratedReplyCard 加 4 個 refine 按鈕：再溫和（粉）/ 再正式（藍）/ 縮短（琥珀）/ 加更多細節（綠），各帶情境配色與 lucide icon
- ReplyGeneratorForm `handleRefine()` 把當下 form values + token + 舊 reply 送回 callable，refine 也走 Turnstile verify（防腳本濫用）
- refine 進行中：reply 半透明 + button spinning loader，不顯示新 LoadingCard 避免 stack 兩張卡片

---

### ⏳ P2-4. 支援上傳對話截圖（OCR）

**情境**：老師收到 LINE 截圖懶得打字。

**做法**：
- 用 Gemini 2.5 Flash 的 vision 能力（直接吃圖片）
- 在表單加「📷 上傳截圖」按鈕
- File API → base64 → 傳給 Gemini

```ts
const imagePart = { inlineData: { data: base64, mimeType: "image/png" } };
const result = await ai.generate({ prompt: [..., imagePart] });
```

**預估工時**：4 小時 ｜ **難度**：⭐⭐⭐

---

### ⏳ P2-5. 多語系支援（i18n）

**情境**：學校有外籍家長。

**做法**：
- 介面：`next-intl` 加上中/英/日
- AI 輸出：表單加「回覆語言」選項，傳給 prompt

**預估工時**：5 小時 ｜ **難度**：⭐⭐⭐

---

### ✅ P2-6. PWA 離線可用 — 完成

**Commits**：[SW + manifest](https://github.com/cagoooo/Message/commit/80aea1c) + [install prompt Batch 7](https://github.com/cagoooo/Message/commit/a44cf8c)
**實際做法**：
- `public/manifest.json` — 完整 PWA manifest
- `public/sw.template.js` + `scripts/write-version.mjs` 自動產 sw.js + version.json
- `src/components/ServiceWorkerRegister.tsx` — 註冊 SW + 5 分鐘輪詢 + 新版 toast
- **新增** `src/components/InstallPrompt.tsx` — 監聽 `beforeinstallprompt` event，5 秒延遲後浮現「安裝到主畫面」小卡片
- 已安裝（standalone）/ 「稍後」snooze 7 天 / iOS Safari → 自動隱藏

---

### ✅ P2-7. 個資警示 — 完成

**Commit**：[Batch 7](https://github.com/cagoooo/Message/commit/a44cf8c)
**實際做法**：
- `src/lib/pii-detector.ts` — regex 偵測 4 類台灣常見 PII：身分證字號、手機、信用卡、Email；含 `maskPII()` 工具
- ReplyGeneratorForm 整合 AlertDialog：偵測到 → 跳對話框列出每類 PII（遮罩顯示）+ 「我已確認，繼續送出」/「取消，回去修改」二選一
- 不阻擋（老師有判斷權），只警示
- **單元測試**：[tests/lib/pii-detector.test.ts](../tests/lib/pii-detector.test.ts) 11 tests 覆蓋

---

## 🟢 P3 — 有空再做（5 項可選）

### ⏳ P3-1. 動畫優化

- 表單 progressive disclosure 動畫
- Markdown 渲染 typewriter 效果
- 滑入轉場 (Framer Motion)

**預估工時**：3 小時 ｜ **難度**：⭐⭐

---

### ⏳ P3-2. 統計儀表板（管理員用）

- 每日呼叫次數
- 各情境使用比例
- 平均生成時間
- API 用量警示

**做法**：用 Firebase Analytics（免費）或自建 Firestore stats collection + Cloud Function aggregator。

**預估工時**：4 小時 ｜ **難度**：⭐⭐⭐

---

### ⏳ P3-3. 模型切換

讓使用者選 `Gemini 2.5 Flash`（快） / `Gemini 2.5 Pro`（精準）。

**做法**：表單上方加 Select，把選擇傳到 callable function input，function 用該值 override `genkit({ model })`。

**預估工時**：30 分鐘 ｜ **難度**：⭐

---

### ⏳ P3-4. 範本（Template）庫

預存幾個常見回覆範本，使用者可一鍵載入再修改。可結合 P2-2 的「自訂 Prompt」做成系統範本 + 使用者自訂範本兩層。

**預估工時**：2 小時 ｜ **難度**：⭐⭐

---

### ⏳ P3-5. 老師專屬「家長性格筆記」（雲端）

接 Firebase Auth：
- Google 登入
- 每位家長存「性格筆記」到 Firestore
- 之後每次帶進 prompt 個性化

**做法**：參考 skill `supabase-google-oauth-integration`（也適用 Firebase Auth）。

**注意**：需要重新設計 Firestore rules（從目前 deny-all 改為 user-scoped read/write），並修改 callable function 接 Auth context。

**預估工時**：6 小時 ｜ **難度**：⭐⭐⭐⭐

---

## 🚀 進階功能藍圖

### 階段一：個人版 ✅ **已達成**
- ✅ 完成 P0、P1（除 Streaming）
- ✅ GitHub Pages + Firebase Functions 部署
- ⏳ 校內 50 位老師試用 → 等你推廣

### 階段二：協作版（3–6 個月）
- ⏳ Google 登入 (P3-5 起點)
- ⏳ 雲端歷史記錄 (Firestore，配合 P3-5)
- ⏳ 教師團隊分享範本 (P3-4 延伸)
- ⏳ 多語系 (P2-5)

### 階段三：平台化（6–12 個月）
- 模組化擴展（評語產生、家長會講稿、IEP 撰寫）
- API 開放（讓其他學校的 LINE Bot 接入）
- 可訓練自訂 prompt（學校文化客製）
- 付費版（無限用量、團隊管理）

---

## 🎯 結語

🎉 **P0 100%、P1 87.5%、P2 71% 完成，整個 App 已是高完成度的生產級 PWA。**

剩下的全是「**錦上添花**」，可以慢慢按需求挑選做：
- 想先試最小投入：**P3-3 模型切換（30 分）** ＋ **P3-4 範本庫（2h）** ＝ 2.5 小時就能再加兩個小亮點
- 想擴展功能性：**P2-2 自訂 Prompt（2h）+ P2-4 OCR 截圖（4h）** 體驗會大幅升級
- 想擴展為協作平台：**P3-5 雲端家長筆記（6h）** 是基石（接 Firebase Auth）
- 想加趣味度：**P3-1 動畫（3h）+ P3-2 儀表板（4h）**

---

**推薦下一步**：
- 找校內幾位老師實際試用 → 收集回饋 → 依使用者真實痛點選做
- 或讓使用者自然「累積歷史紀錄」一段時間 → 看哪些情境真的常用 → 補強對應的 prompt 模板

**Made with ❤️ by 阿凱老師** ｜ 桃園市石門國小資訊組
