// src/ai/flows/generate-parent-reply.ts
'use server';

/**
 * @fileOverview AI-powered reply generation for parent-teacher communication.
 *
 * - generateParentReply - A function that generates reply suggestions to parents' messages.
 * - GenerateParentReplyInput - The input type for the generateParentReply function.
 * - GenerateParentReplyOutput - The output type for the generateParentReply function.
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
  prompt: `You are a helpful and empathetic teacher assistant. Your task is to generate a professional and understanding reply to a parent's message. Consider the scenario provided to tailor the response appropriately.

Parent's Message: {{{parentMessage}}}

Scenario: {{{scenario}}}

Generate a reply that addresses the parent's concerns, offers support, and proposes a clear course of action. The reply should be professional, empathetic, and solution-oriented.`,
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
