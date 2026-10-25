// Regenerates clips.json in the live call's Gemini voice; see README.md.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { GoogleGenAI, Modality } from '@google/genai';
import { TRANSCRIBE_MODEL } from '@/lib/gemini';
import { SCREENER_LINES } from '@/lib/screener-prompt';
import { LIVE_VOICE } from '../../api/live-token/token';

const TTS_MODEL = 'gemini-3.8-flash-tts';
const RATE = 24_000;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const preview = process.argv[2];

const words = (text: string) =>
  text
    .toLowerCase()
    .replaceAll('’', "'")
    .replace(/[^a-z' ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function pcmFrom(data: string, mimeType: string) {
  const bytes = Buffer.from(data, 'base64');
  if (/^audio\/(l16|pcm)/i.test(mimeType)) return bytes;
  // A WAV header is variable length, so find its data chunk.
  for (let at = 12; at + 8 <= bytes.length; at += 8 + bytes.readUInt32LE(at + 4))
    if (bytes.toString('ascii', at, at + 4) === 'data')
      return bytes.subarray(at + 8, at + 8 + bytes.readUInt32LE(at + 4));
  throw new Error(`No audio data in ${mimeType}`);
}

const file = new URL('./clips.json', import.meta.url);
const clips: Record<string, { text: string; pcmHex: string }> = JSON.parse(
  readFileSync(file, 'utf8'),
);
for (const [id, text] of Object.entries(SCREENER_LINES)) {
  // Synthesis varies between runs, so a clip already made for this exact line is kept; delete it to remake it.
  if (clips[id]?.text === text) continue;
  const speech = await ai.models.generateContent({
    model: TTS_MODEL,
    // The model reads any style words aloud and refuses a system instruction, so it gets the line alone.
    contents: text,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: LIVE_VOICE } } },
    },
  });
  const inline = speech.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
  if (!inline?.data || !inline.mimeType) throw new Error(`No audio for ${id}`);
  const rate = Number(/rate=(\d+)/.exec(inline.mimeType)?.[1] ?? RATE);
  if (rate !== RATE) throw new Error(`${id} is ${rate} Hz, expected ${RATE}`);
  const pcm = pcmFrom(inline.data, inline.mimeType);
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length / 2);
  // Leave headroom without boosting quiet portions.
  const peak = samples.reduce((max, s) => Math.max(max, Math.abs(s)), 1);
  const scale = Math.min(1, (0.9 * 32767) / peak);
  const out = Buffer.alloc(pcm.length);
  samples.forEach((s, i) => {
    out.writeInt16LE(Math.round(s * scale), i * 2);
  });
  const heard = await ai.models.generateContent({
    model: TRANSCRIBE_MODEL,
    contents: [
      { inlineData: { mimeType: `audio/l16;rate=${RATE}`, data: out.toString('base64') } },
      { text: 'Transcribe this audio exactly. Output only the words spoken.' },
    ],
  });
  if (words(heard.text ?? '') !== words(text))
    throw new Error(`${id} says ${JSON.stringify(heard.text)}, not ${JSON.stringify(text)}`);
  clips[id] = { text, pcmHex: out.toString('hex') };
  console.log(`${id}: ${(samples.length / RATE).toFixed(2)} s`);
  if (preview) {
    mkdirSync(preview, { recursive: true });
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + out.length, 4);
    header.write('WAVEfmt ', 8);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(1, 22);
    header.writeUInt32LE(RATE, 24);
    header.writeUInt32LE(RATE * 2, 28);
    header.writeUInt16LE(2, 32);
    header.writeUInt16LE(16, 34);
    header.write('data', 36);
    header.writeUInt32LE(out.length, 40);
    writeFileSync(`${preview}/${id}.wav`, Buffer.concat([header, out]));
  }
}
writeFileSync(file, `${JSON.stringify(clips, null, 2)}\n`);
