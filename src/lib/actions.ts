// src/lib/actions.ts
"use server";

import { generateParentReply, type GenerateParentReplyInput, type GenerateParentReplyOutput } from "@/ai/flows/generate-parent-reply";
import { z } from "zod";

const ReplySchema = z.object({
  scenario: z.string().min(1, "Scenario is required."),
  parentMessage: z.string().min(1, "Parent message cannot be empty."),
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
      error: "Invalid input. Please check the fields.",
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
      return { error: "Failed to generate reply. The AI did not provide a response." };
    }
  } catch (e) {
    console.error("AI reply generation failed:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during AI reply generation.";
    return { error: `AI Error: ${errorMessage}` };
  }
}
