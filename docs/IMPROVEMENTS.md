# 後續優化改良建議

> 這份清單是**從程式碼實際檢查**得出的改良點，不是泛泛建議。
> 每項都標示了**優先級**、**難度**、**預估工時**、**修改檔案**，方便你按表操課。

---

## 📊 改良點總覽（按優先級）

| 優先級 | 數量 | 說明 |
|---|---|---|
| 🔴 P0（建議部署前修） | 5 項 | 安全、明顯 bug |
| 🟠 P1（兩週內修） | 8 項 | 影響使用體驗 |
| 🟡 P2（一個月內修） | 7 項 | 強化功能 |
| 🟢 P3（有空再修） | 5 項 | nice-to-have |

---

## 📑 目錄

- [🔴 P0 — 部署前必修](#-p0--部署前必修)
- [🟠 P1 — 兩週內處理](#-p1--兩週內處理)
- [🟡 P2 — 一個月內處理](#-p2--一個月內處理)
- [🟢 P3 — 有空再做](#-p3--有空再做)
- [🚀 進階功能藍圖](#-進階功能藍圖)
- [📋 實施順序建議](#-實施順序建議)

---

## 🔴 P0 — 部署前必修

### P0-1. 把 TypeScript / ESLint 錯誤改設為阻擋 build

**檔案**：[next.config.ts:5-9](../next.config.ts)

**現況**：

```ts
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true },
```

**問題**：型別錯誤、lint 錯誤都會被吞掉，將來 PR review 看不到 bug。

**改成**：

```ts
typescript: { ignoreBuildErrors: false },
eslint: { ignoreDuringBuilds: false },
```

→ 然後跑 `npm run typecheck && npm run lint`，把所有錯誤修掉再上線。

**預估工時**：30 分鐘 ｜ **難度**：⭐

---

### P0-2. 升級 Gemini 模型版本

**檔案**：[src/ai/genkit.ts:6](../src/ai/genkit.ts)

**現況**：`model: 'googleai/gemini-2.0-flash'`

**問題**：Google 約每 6 個月棄用舊模型。從 commit 訊息看到「[GoogleGenerativeAI Error]: Error fetching from https://genera...」這類錯誤已經出現過。

**改成**（按 2026-05 時點）：

```ts
model: 'googleai/gemini-2.5-flash'  // 新版較穩定，速度差不多
```

→ 之後在 Google AI Studio 公告頁訂閱模型棄用通知。
→ 建議寫成環境變數：

```ts
model: process.env.GEMINI_MODEL || 'googleai/gemini-2.5-flash',
```

這樣未來換模型不用 redeploy。

**預估工時**：10 分鐘 ｜ **難度**：⭐

---

### P0-3. 把 API Key 從程式碼層硬編改為 Secret Manager / Vercel Secret

**檔案**：[src/ai/genkit.ts:5](../src/ai/genkit.ts)

**現況**：`googleAI({apiKey: process.env.GEMINI_API_KEY})` ✓ 這部分是對的

**確認重點**：
- 部署平台環境變數設定為 **Encrypted/Secret** 而非 Plain Text
- Vercel：Environment Variables → 加完後右側勾選 **Sensitive**
- Firebase：用 `firebase apphosting:secrets:set` 而非 `apphosting.yaml` 直接寫值

**預估工時**：5 分鐘 ｜ **難度**：⭐

---

### P0-4. 移除「your-website-url.com」這類佔位符

**檔案**：[src/app/layout.tsx:10](../src/app/layout.tsx)

**現況**：

```ts
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-website-url.com";
```

**問題**：環境變數沒設時，OG 分享圖會指向 `https://your-website-url.com/placeholder-social-image.jpg`，分享到 LINE / FB 顯示 404。

**改成**：

```ts
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://teachers-ai-assistant.vercel.app";
```

**搭配**：在 `public/` 放一張 1200×630 的 OG 預覽圖（命名 `og-image.png`），改：

```ts
const siteImage = `${siteUrl}/og-image.png`;
```

→ 詳細做法看 skill `og-social-preview-zh`（你已有）。

**預估工時**：1 小時（含設計圖） ｜ **難度**：⭐⭐

---

### P0-5. README.md 完全沒有專案說明

**檔案**：[README.md](../README.md)

**現況**：

```md
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
```

**問題**：別人 clone 下來不知道這是什麼、怎麼跑。

**改成**（建議內容）：

```md
# 教師回應訊息建議小幫手 🎓

> 為親師溝通提供 AI 輔助回覆建議的 Web App
> 設計：桃園市石門國小資訊組 阿凱老師

## 🎯 線上 Demo

👉 https://teachers-ai-assistant.vercel.app

## 🚀 快速開始

詳見 [docs/USAGE.md](docs/USAGE.md)

```bash
npm install
echo "GEMINI_API_KEY=AIzaSy..." > .env.local
npm run dev
```

## 📚 文件

- [使用說明](docs/USAGE.md)
- [部署指南](docs/DEPLOYMENT.md)
- [優化建議](docs/IMPROVEMENTS.md)
- [原始藍圖](docs/blueprint.md)

## 📜 授權

© 2025 桃園市石門國小資訊組 阿凱老師
```

**預估工時**：15 分鐘 ｜ **難度**：⭐

---

## 🟠 P1 — 兩週內處理

### P1-1. 加入「重設表單」按鈕

**檔案**：[src/components/ReplyGeneratorForm.tsx](../src/components/ReplyGeneratorForm.tsx)

**情境**：老師要連續回覆多位家長時，需手動清空欄位很煩。

**做法**：在「產生回覆建議」旁加 **重設** 按鈕：

```tsx
<Button type="button" variant="outline" onClick={() => {
  form.reset({ scenario: "", parentMessage: "" });
  setGeneratedReply(undefined);
}}>
  <RefreshCw className="mr-2 h-4 w-4" /> 重設
</Button>
```

**預估工時**：30 分鐘 ｜ **難度**：⭐

---

### P1-2. 歷史記錄（localStorage）

**情境**：老師回覆完發現要改、想找前幾次的內容、跑掉了。

**做法**：每次成功產生後存 localStorage：

```ts
const HISTORY_KEY = "teachers-ai-history";
const MAX_HISTORY = 20;

function saveToHistory(item: { scenario; parentMessage; reply; ts }) {
  const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  h.unshift(item);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, MAX_HISTORY)));
}
```

UI：在表單右上方加一個「📜 歷史紀錄」按鈕，開抽屜顯示最近 20 筆。

**預估工時**：3 小時 ｜ **難度**：⭐⭐

---

### P1-3. 加上 Cloudflare Turnstile 防腳本攻擊

**情境**：API Key 即使限制 referrer，網站本身還是可被人從瀏覽器自動化呼叫，把你免費 quota 打爆。

**做法**：照 skill `cloudflare-turnstile-integration` 走一次。

**重點**：
1. 註冊 Cloudflare → Turnstile → 加 site
2. 前端表單嵌入 widget
3. Server Action 收到 token 後驗證
4. 驗證失敗回 401

**預估工時**：2 小時 ｜ **難度**：⭐⭐⭐

---

### P1-4. 加入「字數統計 / token 估算」提示

**情境**：家長訊息太長 AI 會慢、太短 AI 沒上下文。

**做法**：在 Textarea 下方顯示：

```tsx
<div className="text-sm text-muted-foreground">
  {parentMessageWatch.length} 字元
  {parentMessageWatch.length < 50 && " ⚠️ 建議至少 50 字以獲得更佳結果"}
  {parentMessageWatch.length > 1000 && " ⚠️ 訊息較長，AI 處理時間可能延長"}
</div>
```

**預估工時**：30 分鐘 ｜ **難度**：⭐

---

### P1-5. 拆分 ReplyGeneratorForm.tsx（單檔 467 行太大）

**檔案**：[src/components/ReplyGeneratorForm.tsx](../src/components/ReplyGeneratorForm.tsx)

**問題**：單檔 467 行、混合表單、進度條、複製邏輯、UI、scenarios constants。

**重構建議**：

```
src/components/reply-generator/
├── ReplyGeneratorForm.tsx          # 主元件（< 100 行）
├── ScenarioSelect.tsx              # 情境下拉
├── ParentMessageInput.tsx          # 訊息輸入
├── GeneratedReply.tsx              # 結果卡片 + 複製
├── ProgressIndicator.tsx           # 進度條 + skeleton
├── constants.ts                    # scenarios, optionColors
└── hooks/
    ├── useCopyToClipboard.ts       # 複製邏輯（含 fallback）
    └── useFakeProgress.ts          # 進度條動畫
```

**預估工時**：3 小時 ｜ **難度**：⭐⭐⭐

---

### P1-6. 補上單元測試

**檔案**：目前**完全沒有測試**

**做法**：用 Vitest（Next.js 15 推薦）

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

優先測試：

| 對象 | 測什麼 |
|---|---|
| `actions.ts` | 驗證 schema 邊界、error 路徑 |
| `useCopyToClipboard` hook | clipboard API + fallback |
| `ReplyGeneratorForm` | 表單驗證、提交流程 |

**預估工時**：6 小時（從零建立） ｜ **難度**：⭐⭐⭐

---

### P1-7. 改善 Loading 體驗

**檔案**：[src/components/ReplyGeneratorForm.tsx:150-181](../src/components/ReplyGeneratorForm.tsx)

**現況**：假進度條（10% → 95% 隨機跳）

**問題**：使用者不知道「快好了」還是「卡住了」。

**改善方向**：
- 用 **Streaming Response**：Genkit 支援 `ai.generateStream`，可邊生成邊顯示
- 改 Server Action 用 React Server Components Streaming

**做法概要**：

```ts
// flow
const { stream } = await ai.generateStream({ prompt: ... });
for await (const chunk of stream) {
  yield chunk.text;
}
```

前端用 `useChat`-like hook 接收。

**預估工時**：5 小時 ｜ **難度**：⭐⭐⭐⭐

---

### P1-8. SEO / Metadata 強化

**檔案**：[src/app/layout.tsx](../src/app/layout.tsx)

**缺少**：
- `keywords`（教師、家長溝通、AI、回覆產生器）
- `authors`、`creator`
- 結構化資料（JSON-LD `WebApplication`）

**加上**：

```tsx
export const metadata: Metadata = {
  // ...
  keywords: ["教師", "家長溝通", "AI 回覆", "親師溝通", "教育"],
  authors: [{ name: "阿凱老師", url: "https://www.smes.tyc.edu.tw/" }],
  creator: "阿凱老師",
  // ...
};

// 加 JSON-LD
<script type="application/ld+json" dangerouslySetInnerHTML={{
  __html: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "教師小幫手",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "TWD" }
  })
}} />
```

**預估工時**：1 小時 ｜ **難度**：⭐⭐

---

## 🟡 P2 — 一個月內處理

### P2-1. 「一鍵分享 LINE」功能

**情境**：老師看到結果想直接分享給其他老師參考。

**做法**：在「複製回覆」旁加：

```tsx
<Button onClick={() => {
  const url = `https://line.me/R/msg/text/?${encodeURIComponent(generatedReply)}`;
  window.open(url, '_blank');
}}>
  <ShareIcon /> 分享到 LINE
</Button>
```

**預估工時**：20 分鐘 ｜ **難度**：⭐

---

### P2-2. 自訂 Prompt 進階模式

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

### P2-3. 多輪對話（refine 回覆）

**情境**：AI 生成的初稿想說「再溫和一點」「再短一點」「換個開頭」。

**做法**：回覆卡片加幾個快速按鈕：

```
[📝 再正式一點] [💝 再溫暖一點] [✂️ 縮短] [📋 加更多細節]
```

點下後重新呼叫 AI，附上原訊息 + 修改指令。

**預估工時**：3 小時 ｜ **難度**：⭐⭐⭐

---

### P2-4. 支援上傳對話截圖（OCR）

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

### P2-5. 多語系支援（i18n）

**情境**：學校有外籍家長。

**做法**：
- 介面：`next-intl` 加上中/英/日
- AI 輸出：表單加「回覆語言」選項，傳給 prompt

**預估工時**：5 小時 ｜ **難度**：⭐⭐⭐

---

### P2-6. PWA 離線可用

**情境**：手機離線時打開 App 至少能看到歷史紀錄。

**做法**：
- 加 `manifest.json` + Service Worker
- 用 `next-pwa` 套件
- 歷史紀錄已經在 localStorage，自動就 offline-ready

**預估工時**：2 小時 ｜ **難度**：⭐⭐

> ⚠️ 配合 skill `pwa-cache-bust` 避免使用者一直看到舊版。

---

### P2-7. 個資警示

**情境**：老師可能不小心把學生姓名、身分證字號貼進去 → 資料給 Google。

**做法**：表單送出前用 regex 簡單檢查：

```ts
function detectPII(text: string): string[] {
  const warnings = [];
  if (/[A-Z][12]\d{8}/.test(text)) warnings.push("身分證字號");
  if (/09\d{2}-?\d{6}/.test(text)) warnings.push("手機號碼");
  if (/\d{3}-?\d{4}-?\d{4}-?\d{4}/.test(text)) warnings.push("信用卡號");
  return warnings;
}
```

→ 偵測到顯示確認對話框：「您的訊息包含 [身分證字號]，建議移除後再送出。是否繼續？」

**預估工時**：1.5 小時 ｜ **難度**：⭐⭐

---

## 🟢 P3 — 有空再做

### P3-1. 動畫優化

- 表單 progressive disclosure 動畫
- Markdown 渲染 typewriter 效果
- 滑入轉場 (Framer Motion)

**預估工時**：3 小時 ｜ **難度**：⭐⭐

---

### P3-2. 統計儀表板（管理員用）

- 每日呼叫次數
- 各情境使用比例
- 平均生成時間
- API 用量警示

**做法**：用 Vercel Analytics（免費）+ 自己埋一支 `/api/stats`。

**預估工時**：4 小時 ｜ **難度**：⭐⭐⭐

---

### P3-3. 模型切換

讓使用者選 `Gemini 2.5 Flash`（快） / `Gemini 2.5 Pro`（精準）。

**預估工時**：30 分鐘 ｜ **難度**：⭐

---

### P3-4. 範本（Template）庫

預存幾個常見回覆範本，使用者可一鍵載入再修改。

**預估工時**：2 小時 ｜ **難度**：⭐⭐

---

### P3-5. 老師專屬「家長性格筆記」（雲端）

接 Supabase / Firebase Auth：
- Google 登入
- 每位家長存「性格筆記」
- 之後每次帶進 prompt 個性化

**做法**：參考 skill `supabase-google-oauth-integration`

**預估工時**：6 小時 ｜ **難度**：⭐⭐⭐⭐

---

## 🚀 進階功能藍圖

如果這個工具廣受老師喜愛，未來可考慮：

### 階段一：個人版（0–3 個月）
- 完成 P0、P1
- Vercel 部署 + 自訂網域
- 校內 50 位老師試用

### 階段二：協作版（3–6 個月）
- Google 登入
- 雲端歷史記錄
- 教師團隊分享範本
- 多語系

### 階段三：平台化（6–12 個月）
- 模組化擴展（評語產生、家長會講稿、IEP 撰寫）
- API 開放（讓其他學校的 LINE Bot 接入）
- 可訓練自訂 prompt（學校文化客製）
- 付費版（無限用量、團隊管理）

---

## 📋 實施順序建議

### 第 1 週：上線前修整（共 ~2.5 小時）

1. ✅ P0-2 升級 Gemini 模型版本（10 分）
2. ✅ P0-1 開啟 TS / ESLint 嚴格檢查（30 分）
3. ✅ P0-5 寫好 README（15 分）
4. ✅ P0-4 處理 OG 分享圖（1 小時）
5. ✅ P0-3 確認 API Key 在 Secret Manager（5 分）

→ 完成後直接走 [DEPLOYMENT.md 路線 A](DEPLOYMENT.md#3-路線-agithub--vercel最推薦最快上線) 上線

### 第 2 週：基本品質（共 ~5 小時）

6. ✅ P1-1 重設按鈕（30 分）
7. ✅ P1-4 字數統計（30 分）
8. ✅ P1-8 SEO metadata（1 小時）
9. ✅ P1-3 Cloudflare Turnstile（2 小時）

### 第 3–4 週：進階功能（共 ~10 小時）

10. ✅ P1-2 歷史記錄（3 小時）
11. ✅ P2-1 LINE 分享（20 分）
12. ✅ P2-2 進階自訂 Prompt（2 小時）
13. ✅ P1-5 元件拆分（3 小時）
14. ✅ P2-7 個資警示（1.5 小時）

### 第 2 個月：突破型功能（共 ~12 小時）

15. ✅ P2-3 多輪 refine 回覆（3 小時）
16. ✅ P2-4 OCR 截圖（4 小時）
17. ✅ P1-7 Streaming（5 小時）

### 第 3 個月：穩定化

18. ✅ P1-6 補測試（6 小時）
19. ✅ P2-6 PWA（2 小時）

---

## 🎯 結語

這個 App 已經是一個**完成度很高**的產品，核心功能（AI 回覆 + 12 種情境 + 複製分享）都運作良好。
上面所有改良點都是「**錦上添花**」而非「**修補破口**」，可以從容按優先級處理。

如果只想動最小範圍 ship 給老師用，做完 **P0** 五項就夠了，總共約 2.5 小時工程量。

---

**有問題？**
- 程式碼層面卡關 → 用 `superpowers-systematic-debug` skill 系統化排查
- 不確定優先級 → 重新跑 `superpowers-brainstorm` 與我討論
- 想規劃實作 → 用 `superpowers-write-plan` 把上面選項拆成可執行步驟

**Made with ❤️ by 阿凱老師** ｜ 桃園市石門國小資訊組
