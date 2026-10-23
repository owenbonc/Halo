import { gemini, TRANSCRIBE_MODEL } from './gemini';

const PROMPT =
  'Transcribe this recording word for word in English. Write only what was said, with no notes. If nobody speaks, reply with nothing.';

// The text that comes back is untrusted caller speech; analyse() treats it as data.
export async function transcribe(audio: Blob): Promise<string> {
  // Browsers send e.g. "audio/webm;codecs=opus"; Gemini wants the bare type.
  const mimeType = audio.type.split(';')[0] || 'audio/webm';
  const data = Buffer.from(await audio.arrayBuffer()).toString('base64');
  const response = await gemini().models.generateContent({
    model: TRANSCRIBE_MODEL,
    contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data } }, { text: PROMPT }] }],
    config: { temperature: 0 },
  });
  return (response.text ?? '').trim().slice(0, 20_000);
}
