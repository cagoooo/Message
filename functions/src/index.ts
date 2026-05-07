import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { setGlobalOptions } from "firebase-functions/v2";
import { logger } from "firebase-functions";
import { getApps, initializeApp } from "firebase-admin/app";
import {
  getFirestore,
  FieldValue,
  Timestamp,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import { notifyLine } from "./line-notify";

setGlobalOptions({ region: "asia-east1", maxInstances: 10 });

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const TURNSTILE_SECRET_KEY = defineSecret("TURNSTILE_SECRET_KEY");
const ADMIN_PASSWORD = defineSecret("ADMIN_PASSWORD");
// LINE 推播 secrets — 共用阿凱老師既有 Channel (2008810864)
// 沒設或設為 "DISABLED" 時整個通知會 silent skip，主功能不受影響
const LINE_CHANNEL_ACCESS_TOKEN = defineSecret("LINE_CHANNEL_ACCESS_TOKEN");
const LINE_ADMIN_USER_ID = defineSecret("LINE_ADMIN_USER_ID");

// Initialize firebase-admin once（Functions 內 cold start 時跑一次）
if (getApps().length === 0) initializeApp();
const db = getFirestore();

// 用今日（UTC+8 / Asia/Taipei 約近台灣日期）作為 doc id
function getTaipeiDateKey(d: Date = new Date()): string {
  // 用 ISO + offset 8 hours 換成台北日期
  const taipei = new Date(d.getTime() + 8 * 3600 * 1000);
  return taipei.toISOString().slice(0, 10); // YYYY-MM-DD
}

interface LogStatsInput {
  scenario: string;
  mode: "generate" | "refine";
  replyLength: number;
  hasImage: boolean;
  hasAdvanced: boolean;
}

async function logStats(opts: LogStatsInput): Promise<void> {
  const dateKey = getTaipeiDateKey();
  const ref = db.collection("stats_daily").doc(dateKey);
  // 步驟 1: top-level 欄位 set merge（首次自動建 doc）
  await ref.set(
    {
      date: dateKey,
      count: FieldValue.increment(1),
      totalReplyChars: FieldValue.increment(opts.replyLength),
      withImageCount: FieldValue.increment(opts.hasImage ? 1 : 0),
      withAdvancedCount: FieldValue.increment(opts.hasAdvanced ? 1 : 0),
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );
  // 步驟 2: dot-notation 對巢狀欄位增量
  await ref.update({
    [`byScenario.${opts.scenario}`]: FieldValue.increment(1),
    [`byMode.${opts.mode}`]: FieldValue.increment(1),
  });
}

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Firebase callable client SDK 在 wire 上會把 undefined 序列化成 null（JSON 不支援 undefined）。
// 所有 .optional() 欄位收到 null 時必須先轉回 undefined，否則 zod 會 reject。
const NullToUndefinedObject = z.preprocess((data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    out[k] = v === null ? undefined : v;
  }
  return out;
}, z.object({
  parentMessage: z.string().min(1, "parentMessage is required"),
  scenario: z.string().min(1, "scenario is required"),
  turnstileToken: z.string().min(1, "turnstileToken is required"),
  // refine 模式：把先前的回覆 + 修改指令一起送來，AI 會在原稿上微調
  refineInstruction: z.string().optional(),
  previousReply: z.string().optional(),
  // 進階情境（皆 optional，前端摺疊區塊填寫）
  schoolName: z.string().max(100).optional(),
  teacherName: z.string().max(50).optional(),
  studentGrade: z.string().max(30).optional(),
  notes: z.string().max(500).optional(),
  // 對話截圖（base64 data URL，前端已壓縮 < 1MB）
  imageDataUrl: z
    .string()
    .regex(
      /^data:image\/(jpeg|png|webp);base64,/i,
      "imageDataUrl 必須是 image/(jpeg|png|webp) 的 base64 data URL",
    )
    .max(10 * 1024 * 1024, "圖片過大")
    .optional(),
}));

const InputSchema = NullToUndefinedObject;

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

async function verifyTurnstile(token: string, remoteIp?: string): Promise<void> {
  const body = new URLSearchParams({
    secret: TURNSTILE_SECRET_KEY.value(),
    response: token,
  });
  if (remoteIp) body.append("remoteip", remoteIp);

  let resp: Response;
  try {
    resp = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch (err) {
    logger.error("Turnstile verify network error", err);
    throw new HttpsError(
      "unavailable",
      "驗證服務暫時無回應，請稍後重試。",
    );
  }

  if (!resp.ok) {
    logger.error("Turnstile verify HTTP error", { status: resp.status });
    throw new HttpsError("unavailable", "驗證服務異常，請稍後重試。");
  }

  const data = (await resp.json()) as TurnstileVerifyResponse;
  if (!data.success) {
    logger.warn("Turnstile verification failed", {
      errors: data["error-codes"],
    });
    throw new HttpsError(
      "permission-denied",
      "驗證失敗，請重新整理頁面後再試一次。",
    );
  }
}

const OutputSchema = z.object({
  reply: z.string(),
});

type Input = z.infer<typeof InputSchema>;
type Output = z.infer<typeof OutputSchema>;

const PROMPT = `你是一位樂於助人且富有同理心的教師助理。你的任務是針對家長的訊息，產生專業且易於理解的回覆。
請使用繁體中文（台灣慣用詞彙與表達方式）來撰寫回覆。
請考量提供的情境，以便適當地調整回覆內容。
你可以使用 Markdown 格式來組織你的回覆，例如使用標題、列表、粗體、斜體等，使其更清晰易讀。

家長的訊息: {{{parentMessage}}}

情境: {{{scenario}}}

請產生一則回覆，該回覆需能回應家長的關切、提供支持，並提出明確的行動方針。回覆應具備專業性、同理心，並以解決問題為導向。`;

const REFINE_PROMPT = `你是一位樂於助人且富有同理心的教師助理。
以下有一份你先前針對家長訊息產生的回覆，老師希望你依指定方向**修改原稿**。
請使用繁體中文（台灣慣用詞彙與表達方式）。
保留 Markdown 格式（標題、列表、粗體等）。
**只回傳修改後的完整回覆內容，不要加任何前言、解釋或「以下是修改版」之類的開場白。**

【家長的原訊息】
{{{parentMessage}}}

【情境】{{{scenario}}}

【先前的回覆】
{{{previousReply}}}

【修改方向】
{{{refineInstruction}}}

請產出依此方向修改後的完整新回覆：`;

function buildContextBlock(input: {
  schoolName?: string;
  teacherName?: string;
  studentGrade?: string;
  notes?: string;
}): string {
  const lines: string[] = [];
  if (input.schoolName) lines.push(`學校：${input.schoolName}`);
  if (input.teacherName) lines.push(`老師：${input.teacherName}`);
  if (input.studentGrade) lines.push(`學生年級：${input.studentGrade}`);
  if (input.notes) lines.push(`其他備註：${input.notes}`);
  if (lines.length === 0) return "";
  return `\n【教學情境補充資訊（請適度納入回覆語氣與用詞）】\n${lines.join("\n")}\n`;
}

type PromptPart = { text: string } | { media: { url: string } };

function buildPromptText(input: {
  parentMessage: string;
  scenario: string;
  refineInstruction?: string;
  previousReply?: string;
  schoolName?: string;
  teacherName?: string;
  studentGrade?: string;
  notes?: string;
  hasImage: boolean;
}): string {
  const context = buildContextBlock(input);
  // 有圖時在原訊息前加引導，讓 AI 把圖納入辨識
  const imageHint = input.hasImage
    ? "\n【附帶截圖】使用者上傳了一張對話截圖（如下）。請辨識截圖中的對話內容後，連同下方家長訊息一併參考，產生回覆。\n"
    : "";

  if (input.refineInstruction && input.previousReply) {
    return (
      REFINE_PROMPT
        .replace("{{{parentMessage}}}", input.parentMessage)
        .replace("{{{scenario}}}", input.scenario)
        .replace("{{{previousReply}}}", input.previousReply)
        .replace("{{{refineInstruction}}}", input.refineInstruction) +
      context +
      imageHint
    );
  }
  return (
    PROMPT
      .replace("{{{parentMessage}}}", input.parentMessage)
      .replace("{{{scenario}}}", input.scenario) +
    context +
    imageHint
  );
}

function buildPromptParts(input: {
  parentMessage: string;
  scenario: string;
  refineInstruction?: string;
  previousReply?: string;
  schoolName?: string;
  teacherName?: string;
  studentGrade?: string;
  notes?: string;
  imageDataUrl?: string;
}): PromptPart[] {
  const parts: PromptPart[] = [];
  parts.push({
    text: buildPromptText({
      parentMessage: input.parentMessage,
      scenario: input.scenario,
      refineInstruction: input.refineInstruction,
      previousReply: input.previousReply,
      schoolName: input.schoolName,
      teacherName: input.teacherName,
      studentGrade: input.studentGrade,
      notes: input.notes,
      hasImage: !!input.imageDataUrl,
    }),
  });
  if (input.imageDataUrl) {
    parts.push({ media: { url: input.imageDataUrl } });
  }
  return parts;
}

function isRetryableError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  // Google AI 過載 / 限流 / 暫時不可用
  return /\b(503|429|overload|unavailable|temporary|temporarily)\b/i.test(msg);
}

async function generateWithRetry(
  ai: ReturnType<typeof genkit>,
  prompt: string | PromptPart[],
  maxRetries = 2,
): Promise<string> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { text } = await ai.generate({ prompt });
      if (!text) throw new Error("AI 回覆為空");
      return text;
    } catch (err) {
      lastErr = err;
      if (!isRetryableError(err) || attempt === maxRetries) throw err;
      const delayMs = 1000 * Math.pow(2, attempt); // 1s → 2s
      logger.warn(
        `Gemini call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms`,
        { error: err instanceof Error ? err.message : String(err) },
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

let cachedAi: ReturnType<typeof genkit> | null = null;
function getAi() {
  if (!cachedAi) {
    cachedAi = genkit({
      plugins: [googleAI({ apiKey: GEMINI_API_KEY.value() })],
      model: process.env.GEMINI_MODEL || "googleai/gemini-2.5-flash",
    });
  }
  return cachedAi;
}

export const generateParentReply = onCall<Input, Promise<Output>>(
  {
    secrets: [
      GEMINI_API_KEY,
      TURNSTILE_SECRET_KEY,
      LINE_CHANNEL_ACCESS_TOKEN,
      LINE_ADMIN_USER_ID,
    ],
    cors: [
      /^https:\/\/cagoooo\.github\.io$/,
      /^http:\/\/localhost(:\d+)?$/,
    ],
  },
  async (request) => {
    // LINE 通知用 — 在 callable 內部讀，secret 才注入完成
    const lineToken = LINE_CHANNEL_ACCESS_TOKEN.value();
    const lineUserId = LINE_ADMIN_USER_ID.value();
    const fireNotify = (event: Parameters<typeof notifyLine>[0]) => {
      notifyLine(event, lineToken, lineUserId).catch((err) =>
        logger.warn("[LINE Notify] unhandled", err),
      );
    };

    const parsed = InputSchema.safeParse(request.data);
    if (!parsed.success) {
      const errMsg = parsed.error.errors.map((e) => e.message).join("; ");
      fireNotify({ kind: "validation_error", errorMessage: errMsg });
      throw new HttpsError("invalid-argument", errMsg);
    }
    const {
      parentMessage,
      scenario,
      turnstileToken,
      refineInstruction,
      previousReply,
      schoolName,
      teacherName,
      studentGrade,
      notes,
      imageDataUrl,
    } = parsed.data;

    // 1. 先驗 Turnstile token —— 失敗就直接 throw，不浪費 Gemini quota
    await verifyTurnstile(turnstileToken, request.rawRequest?.ip);

    try {
      const ai = getAi();
      const promptParts = buildPromptParts({
        parentMessage,
        scenario,
        refineInstruction,
        previousReply,
        schoolName,
        teacherName,
        studentGrade,
        notes,
        imageDataUrl,
      });

      // 沒圖片時用純文字（節省 SDK 處理開銷），有圖片才用 multimodal array
      const prompt: string | PromptPart[] = imageDataUrl
        ? promptParts
        : (promptParts[0] as { text: string }).text;

      const text = await generateWithRetry(ai, prompt, 2);

      const mode: "generate" | "refine" = refineInstruction ? "refine" : "generate";
      const hasAdvanced = !!(schoolName || teacherName || studentGrade || notes);

      // Fire-and-forget 寫統計（不 await 避免拖慢回覆，失敗不影響主流程）
      logStats({
        scenario,
        mode,
        replyLength: text.length,
        hasImage: !!imageDataUrl,
        hasAdvanced,
      }).catch((err) => {
        logger.warn("stats log failed (non-fatal)", err);
      });

      // Fire-and-forget LINE 通知
      fireNotify({
        kind: "success",
        scenario,
        parentMessage,
        reply: text,
        mode,
        hasImage: !!imageDataUrl,
        hasAdvanced,
      });

      return { reply: text };
    } catch (err) {
      logger.error("generateParentReply failed", err);
      const msg = err instanceof Error ? err.message : "unknown error";

      fireNotify({
        kind: "ai_error",
        scenario,
        parentMessage,
        errorMessage: msg,
      });

      if (err instanceof HttpsError) throw err;

      // 對 Gemini 過載 / 限流給友善訊息
      if (isRetryableError(err)) {
        throw new HttpsError(
          "resource-exhausted",
          "AI 服務暫時繁忙（Google 端過載），請稍候 30 秒再試一次。如持續發生，可能是模型升級或維護中。",
        );
      }

      throw new HttpsError("internal", `小幫手回覆失敗：${msg}`);
    }
  },
);

// ============================================================
// getStats — 統計儀表板用，需密碼驗證
// ============================================================

const StatsRequestSchema = z.object({
  password: z.string().min(1),
});

interface DailyStats {
  date: string;
  count: number;
  totalReplyChars?: number;
  withImageCount?: number;
  withAdvancedCount?: number;
  byScenario?: Record<string, number>;
  byMode?: Record<string, number>;
}

interface StatsResponse {
  daily: DailyStats[];
  summary: {
    totalCount: number;
    activeDays: number;
    avgReplyChars: number;
    withImagePercent: number;
    withAdvancedPercent: number;
    topScenario: { name: string; count: number } | null;
  };
  generatedAt: string;
}

export const getStats = onCall<{ password: string }, Promise<StatsResponse>>(
  {
    secrets: [ADMIN_PASSWORD],
    cors: [
      /^https:\/\/cagoooo\.github\.io$/,
      /^http:\/\/localhost(:\d+)?$/,
    ],
  },
  async (request) => {
    const parsed = StatsRequestSchema.safeParse(request.data);
    if (!parsed.success) {
      throw new HttpsError("invalid-argument", "缺少密碼欄位。");
    }
    const expected = ADMIN_PASSWORD.value();
    if (!expected || expected === "PLACEHOLDER_CHANGE_ME") {
      throw new HttpsError(
        "failed-precondition",
        "ADMIN_PASSWORD 尚未在 Secret Manager 設定。請管理員執行 `echo \"<your-password>\" | gcloud secrets versions add ADMIN_PASSWORD --data-file=-`。",
      );
    }
    if (parsed.data.password !== expected) {
      throw new HttpsError("permission-denied", "密碼錯誤。");
    }

    // 撈最近 30 天 daily stats
    const snapshot = await db
      .collection("stats_daily")
      .orderBy("date", "desc")
      .limit(30)
      .get();

    const daily: DailyStats[] = snapshot.docs.map(
      (d: QueryDocumentSnapshot) => {
        const data = d.data();
      return {
        date: data.date,
        count: data.count ?? 0,
        totalReplyChars: data.totalReplyChars ?? 0,
        withImageCount: data.withImageCount ?? 0,
        withAdvancedCount: data.withAdvancedCount ?? 0,
        byScenario: data.byScenario ?? {},
        byMode: data.byMode ?? {},
      };
    });

    // Aggregate summary
    let totalCount = 0;
    let totalReplyChars = 0;
    let totalImage = 0;
    let totalAdvanced = 0;
    const scenarioTotals: Record<string, number> = {};
    for (const d of daily) {
      totalCount += d.count;
      totalReplyChars += d.totalReplyChars ?? 0;
      totalImage += d.withImageCount ?? 0;
      totalAdvanced += d.withAdvancedCount ?? 0;
      for (const [k, v] of Object.entries(d.byScenario ?? {})) {
        scenarioTotals[k] = (scenarioTotals[k] ?? 0) + v;
      }
    }
    let topScenario: { name: string; count: number } | null = null;
    for (const [name, count] of Object.entries(scenarioTotals)) {
      if (!topScenario || count > topScenario.count) {
        topScenario = { name, count };
      }
    }

    return {
      daily,
      summary: {
        totalCount,
        activeDays: daily.length,
        avgReplyChars:
          totalCount > 0 ? Math.round(totalReplyChars / totalCount) : 0,
        withImagePercent:
          totalCount > 0 ? Math.round((totalImage / totalCount) * 100) : 0,
        withAdvancedPercent:
          totalCount > 0 ? Math.round((totalAdvanced / totalCount) * 100) : 0,
        topScenario,
      },
      generatedAt: new Date().toISOString(),
    };
  },
);
