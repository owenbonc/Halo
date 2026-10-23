import { GoogleGenAI } from '@google/genai';

export const ANALYSIS_MODEL = 'gemini-4-argon';
export const TRANSCRIBE_MODEL = 'gemini-3.8-flash';

let client: GoogleGenAI | undefined;

// Server-side only: the key must never reach the browser.
export function gemini(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set. See .env.example.');
  client ??= new GoogleGenAI({ apiKey, httpOptions: { timeout: 30_000 } });
  return client;
}
