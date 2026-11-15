"use client";

import { httpsCallable } from "firebase/functions";
import { z } from "zod";
import { getFirebaseAuth, getFn } from "@/lib/firebase";
import { isGoogleUser, LOGIN_REQUIRED_MESSAGE } from "@/lib/auth-utils";

const ReplySchema = z.object({
  scenario: z.string().min(1, "必須填寫情境。"),
  parentMessage: z.string().min(1, "家長訊息不能為空。"),
  turnstileToken: z.string().min(1, "請先完成人機驗證。"),
  refineInstruction: z.string().optional(),
  previousReply: z.string().optional(),
  schoolName: z.string().max(100).optional(),
  teacherName: z.string().max(50).optional(),
  studentGrade: z.string().max(30).optional(),
  notes: z.string().max(500).optional(),
  imageDataUrl: z
    .string()
    .regex(/^data:image\/(jpeg|png|webp);base64,/i, "圖片格式不正確")
    .max(10 * 1024 * 1024, "圖片過大")
    .optional(),
});

export interface AdvancedSettings {
  schoolName?: string;
  teacherName?: string;
  studentGrade?: string;
  notes?: string;
}

/** 每人每天可用次數（與後端 functions/src/index.ts 的 DAILY_LIMIT 一致） */
export const DAILY_LIMIT = 5;
export const QUOTA_EXCEEDED_MESSAGE = `今天的 ${DAILY_LIMIT} 次已用完，明天（台北時間午夜後）再來`;

export interface ActionResult {
  reply?: string;
  error?: string;
  /** 今日剩餘次數（後端回傳；超過上限時為 0） */
  remaining?: number;
  /** true = 今天的次數已用完 */
  quotaExceeded?: boolean;
  /** true = 沒登入或登入已失效，需要先用 Google 帳號登入 */
  needsLogin?: boolean;
  fieldErrors?: {
    scenario?: string[];
    parentMessage?: string[];
    turnstileToken?: string[];
  };
}

export async function generateReply(input: {
  scenario: string;
  parentMessage: string;
  turnstileToken: string;
  refineInstruction?: string;
  previousReply?: string;
  schoolName?: string;
  teacherName?: string;
  studentGrade?: string;
  notes?: string;
  imageDataUrl?: string;
}): Promise<ActionResult> {
  const validated = ReplySchema.safeParse(input);
  if (!validated.success) {
    return {
      error: "輸入無效。請檢查欄位。",
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  // 沒用 Google 帳號登入就不送出（後端也會再擋一次）
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  if (!isGoogleUser(auth.currentUser)) {
    return { error: LOGIN_REQUIRED_MESSAGE, needsLogin: true };
  }

  try {
    const callable = httpsCallable<
      {
        scenario: string;
        parentMessage: string;
        turnstileToken: string;
        refineInstruction?: string;
        previousReply?: string;
        schoolName?: string;
        teacherName?: string;
        studentGrade?: string;
        notes?: string;
        imageDataUrl?: string;
      },
      { reply: string; remaining?: number; dailyLimit?: number }
    >(getFn(), "generateParentReply");

    const result = await callable(validated.data);
    const reply = result.data?.reply;
    const remaining =
      typeof result.data?.remaining === "number" ? result.data.remaining : undefined;

    if (!reply) {
      return { error: "產生回覆失敗。小幫手未提供回應。", remaining };
    }
    return { reply, remaining };
  } catch (e) {
    console.error("[generateReply] callable failed:", e);
    // 後端回 401（沒登入、登入過期或 token 無效）
    const code =
      e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : "";
    if (code === "functions/unauthenticated") {
      const serverMsg = e instanceof Error ? e.message : "";
      return {
        error: /[一-鿿]/.test(serverMsg)
          ? serverMsg
          : "登入狀態已失效，請重新用 Google 帳號登入後再試一次。",
        needsLogin: true,
      };
    }
    // 今天的 5 次已用完（後端在呼叫 AI 前就擋下）
    const details =
      e && typeof e === "object" && "details" in e
        ? ((e as { details?: { reason?: string } }).details ?? undefined)
        : undefined;
    if (code === "functions/resource-exhausted" && details?.reason === "daily-limit") {
      return { error: QUOTA_EXCEEDED_MESSAGE, quotaExceeded: true, remaining: 0 };
    }
    // FirebaseError.message 已是 server 端設好的友善文字（含中文），
    // 不要再加「小幫手錯誤：」前綴避免重複。
    const msg = e instanceof Error ? e.message : "回覆產生時發生未知錯誤，請稍後重試。";
    return { error: msg };
  }
}
