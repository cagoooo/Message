// src/lib/actions.ts
"use server";

import { generateParentReply, type GenerateParentReplyInput, type GenerateParentReplyOutput } from "@/ai/flows/generate-parent-reply";
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
  const rawFormData = {
    scenario: formData.get("scenario") as string,
    parentMessage: formData.get("parentMessage") as string,
  };

  const validatedFields = ReplySchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      error: "輸入無效。請檢查欄位。",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { scenario, parentMessage } = validatedFields.data;

  try {
    const input: GenerateParentReplyInput = { parentMessage, scenario };
    const result: GenerateParentReplyOutput = await generateParentReply(input);
    
    if (result.reply) {
      return { reply: result.reply };
    } else {
      return { error: "產生回覆失敗。AI未提供回應。" };
    }
  } catch (e) {
    console.error("AI reply generation failed:", e);
    const errorMessage = e instanceof Error ? e.message : "AI回覆產生過程中發生未知錯誤。";
    return { error: `AI 錯誤： ${errorMessage}` };
  }
}
