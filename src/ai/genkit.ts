import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const DEFAULT_MODEL = 'googleai/gemini-2.5-flash';

export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
  model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
});
