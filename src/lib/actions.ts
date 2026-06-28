// src/lib/actions.ts
"use server";

import { generateParentReply, type GenerateParentReplyInput, type GenerateParentReplyOutput } from "@/ai/flows/generate-parent-reply";
import { notifyGoogleChat } from "@/lib/google-chat-notify";
import { z } from "zod";

const ReplySchema = z.object({
  scenario: z.string().min(1, "必須填寫情境。"),
  parentMessage: z.string().min(1, "家長訊息不能為空。"),
});

interface ActionResult {
  reply?: string;
  error?: string;
  fieldErrors?: {
    scenario?: string[];
    parentMessage?: string[];
  };
}

export async function handleGenerateReplyAction(
  prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const requestId = crypto.randomUUID().slice(0, 8);
  const startedAt = Date.now();
  const rawFormData = {
    scenario: formData.get("scenario") as string,
    parentMessage: formData.get("parentMessage") as string,
  };

  const validatedFields = ReplySchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    await notifyGoogleChat({
      requestId,
      status: "failure",
      title: "家長訊息回覆服務",
      scenario: rawFormData.scenario,
      progress: "輸入驗證失敗，未進入 AI 產生流程",
      message: rawFormData.parentMessage,
      error: "輸入無效。請檢查欄位。",
      durationMs: Date.now() - startedAt,
    });

    return {
      error: "輸入無效。請檢查欄位。",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { scenario, parentMessage } = validatedFields.data;

  try {
    await notifyGoogleChat({
      requestId,
      status: "started",
      title: "家長訊息回覆服務",
      scenario,
      progress: "已收到使用者請求，正在產生回覆",
      message: parentMessage,
    });

    const input: GenerateParentReplyInput = { parentMessage, scenario };
    const result: GenerateParentReplyOutput = await generateParentReply(input);
    
    if (result.reply) {
      await notifyGoogleChat({
        requestId,
        status: "success",
        title: "家長訊息回覆服務",
        scenario,
        progress: "AI 回覆產生完成，已回傳給使用者",
        message: parentMessage,
        durationMs: Date.now() - startedAt,
      });

      return { reply: result.reply };
    } else {
      await notifyGoogleChat({
        requestId,
        status: "failure",
        title: "家長訊息回覆服務",
        scenario,
        progress: "AI 流程完成但沒有產生回覆",
        message: parentMessage,
        error: "小幫手未提供回應。",
        durationMs: Date.now() - startedAt,
      });

      return { error: "產生回覆失敗。小幫手未提供回應。" };
    }
  } catch (e) {
    console.error("小幫手 reply generation failed:", e);
    const errorMessage = e instanceof Error ? e.message : "小幫手回覆產生過程中發生未知錯誤。";
    await notifyGoogleChat({
      requestId,
      status: "failure",
      title: "家長訊息回覆服務",
      scenario,
      progress: "服務執行時發生錯誤，已回傳錯誤訊息給使用者",
      message: parentMessage,
      error: errorMessage,
      durationMs: Date.now() - startedAt,
    });

    return { error: `小幫手錯誤： ${errorMessage}` };
  }
}
