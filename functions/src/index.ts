import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { setGlobalOptions } from "firebase-functions/v2";
import { logger } from "firebase-functions";
import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

setGlobalOptions({ region: "asia-east1", maxInstances: 10 });

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

const InputSchema = z.object({
  parentMessage: z.string().min(1, "parentMessage is required"),
  scenario: z.string().min(1, "scenario is required"),
});

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
    secrets: [GEMINI_API_KEY],
    cors: [
      /^https:\/\/cagoooo\.github\.io$/,
      /^http:\/\/localhost(:\d+)?$/,
    ],
  },
  async (request) => {
    const parsed = InputSchema.safeParse(request.data);
    if (!parsed.success) {
      throw new HttpsError(
        "invalid-argument",
        parsed.error.errors.map((e) => e.message).join("; "),
      );
    }
    const { parentMessage, scenario } = parsed.data;

    try {
      const ai = getAi();
      const prompt = PROMPT.replace("{{{parentMessage}}}", parentMessage).replace(
        "{{{scenario}}}",
        scenario,
      );

      const { text } = await ai.generate({ prompt });

      if (!text) {
        throw new HttpsError("internal", "AI returned empty response");
      }

      return { reply: text };
    } catch (err) {
      logger.error("generateParentReply failed", err);
      if (err instanceof HttpsError) throw err;
      const msg = err instanceof Error ? err.message : "unknown error";
      throw new HttpsError("internal", `小幫手錯誤： ${msg}`);
    }
  },
);
