
// src/ai/flows/generate-parent-reply.ts
'use server';

/**
 * @fileOverview 小幫手支援的回覆產生，用於親師溝通。
 *
 * - generateParentReply - 一個產生家長訊息回覆建議的函式。
 * - GenerateParentReplyInput - generateParentReply 函式的輸入型別。
 * - GenerateParentReplyOutput - generateParentReply 函式的輸出型別。
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateParentReplyInputSchema = z.object({
  parentMessage: z.string().describe('The message from the parent.'),
  scenario: z.string().optional().describe('The scenario or context of the message (e.g., child injury, conflict).'),
});

export type GenerateParentReplyInput = z.infer<typeof GenerateParentReplyInputSchema>;

const GenerateParentReplyOutputSchema = z.object({
  reply: z.string().describe('The AI-generated reply to the parent.'),
});

export type GenerateParentReplyOutput = z.infer<typeof GenerateParentReplyOutputSchema>;

export async function generateParentReply(input: GenerateParentReplyInput): Promise<GenerateParentReplyOutput> {
  return generateParentReplyFlow(input);
}

const generateParentReplyPrompt = ai.definePrompt({
  name: 'generateParentReplyPrompt',
  input: {schema: GenerateParentReplyInputSchema},
  output: {schema: GenerateParentReplyOutputSchema},
  prompt: `你是一位樂於助人且富有同理心的教師助理。你的任務是針對家長的訊息，產生專業且易於理解的回覆。
請使用繁體中文（台灣慣用詞彙與表達方式）來撰寫回覆。
請考量提供的情境，以便適當地調整回覆內容。

家長的訊息: {{{parentMessage}}}

情境: {{{scenario}}}

請產生一則回覆，該回覆需能回應家長的關切、提供支持，並提出明確的行動方針。回覆應具備專業性、同理心，並以解決問題為導向。`,
});

const generateParentReplyFlow = ai.defineFlow(
  {
    name: 'generateParentReplyFlow',
    inputSchema: GenerateParentReplyInputSchema,
    outputSchema: GenerateParentReplyOutputSchema,
  },
  async input => {
    const {output} = await generateParentReplyPrompt(input);
    return output!;
  }
);
