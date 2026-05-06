"use client";

import { httpsCallable } from "firebase/functions";
import { z } from "zod";
import { getFn } from "@/lib/firebase";

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
});

export interface AdvancedSettings {
  schoolName?: string;
  teacherName?: string;
  studentGrade?: string;
  notes?: string;
}

export interface ActionResult {
  reply?: string;
  error?: string;
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
}): Promise<ActionResult> {
  const validated = ReplySchema.safeParse(input);
  if (!validated.success) {
    return {
      error: "輸入無效。請檢查欄位。",
      fieldErrors: validated.error.flatten().fieldErrors,
    };
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
      },
      { reply: string }
    >(getFn(), "generateParentReply");

    const result = await callable(validated.data);
    const reply = result.data?.reply;

    if (!reply) {
      return { error: "產生回覆失敗。小幫手未提供回應。" };
    }
    return { reply };
  } catch (e) {
    console.error("[generateReply] callable failed:", e);
    // FirebaseError.message 已是 server 端設好的友善文字（含中文），
    // 不要再加「小幫手錯誤：」前綴避免重複。
    const msg = e instanceof Error ? e.message : "回覆產生時發生未知錯誤，請稍後重試。";
    return { error: msg };
  }
}
