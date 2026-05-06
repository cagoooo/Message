"use client";

import { httpsCallable } from "firebase/functions";
import { z } from "zod";
import { getFn } from "@/lib/firebase";

const ReplySchema = z.object({
  scenario: z.string().min(1, "必須填寫情境。"),
  parentMessage: z.string().min(1, "家長訊息不能為空。"),
});

export interface ActionResult {
  reply?: string;
  error?: string;
  fieldErrors?: {
    scenario?: string[];
    parentMessage?: string[];
  };
}

export async function generateReply(input: {
  scenario: string;
  parentMessage: string;
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
      { scenario: string; parentMessage: string },
      { reply: string }
    >(getFn(), "generateParentReply");

    const result = await callable(validated.data);
    const reply = result.data?.reply;

    if (!reply) {
      return { error: "產生回覆失敗。小幫手未提供回應。" };
    }
    return { reply };
  } catch (e) {
    console.error("小幫手 reply generation failed:", e);
    const msg = e instanceof Error ? e.message : "小幫手回覆產生過程中發生未知錯誤。";
    return { error: `小幫手錯誤： ${msg}` };
  }
}
