# public/ 資料夾說明

此資料夾的內容會被 Next.js 直接複製到網站根目錄。

## 待補上的檔案

### `og-image.png`（1200×630 像素，社群分享預覽圖）

LINE / Facebook / Twitter 分享連結時會抓取這張圖。**強烈建議補上**，否則分享只會顯示文字。

#### 製作建議

- **尺寸**：1200×630 px（PNG，避免使用 JPG 會變糊）
- **內容**：
  - 主標題：「教師小幫手」
  - 副標題：「親師溝通的 AI 回覆建議」
  - logo / 學校名稱
  - 主色：淡紫 `#E6E6FA` + 溫和藍 `#ADD8E6`
- **中文字型**：必須使用內嵌字型（Noto Sans TC、思源黑體等），避免在 Facebook/LINE 顯示成方框

#### 三種快速做法

**A. 用 Canva（最簡單）**
1. 上 https://www.canva.com/zh_tw/
2. 選「自訂尺寸」→ 1200×630
3. 用「社群媒體封面」範本套用
4. 下載 PNG，命名 `og-image.png`，丟進這個資料夾

**B. 用 Figma**
- 模板搜尋「OG image template」

**C. 用 Claude Code skill `og-social-preview-zh`**
- 已安裝在阿凱老師的 skill 庫中
- 自動用 `@napi-rs/canvas` 程式產生帶內嵌中文字型的 PNG，徹底解決方框問題
- 觸發指令：「用 og-social-preview-zh 幫我做一張 og 圖」

## 如何驗證

放好圖檔後：

1. `npm run build`
2. 看 `out/og-image.png` 是否存在
3. 部署完成後用 https://www.opengraph.xyz/ 驗證
4. 或直接在 LINE 貼網址測試（**注意**：FB/LINE 會快取，第一次貼錯要等 24 小時或用 [Sharing Debugger](https://developers.facebook.com/tools/debug/) 重抓）
