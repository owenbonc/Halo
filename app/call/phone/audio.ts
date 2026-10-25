// Phone audio is 8 kHz G.711 µ-law; Gemini hears 16-bit PCM and speaks 24 kHz PCM.

const BIAS = 0x84;
const CLIP = 32635;

export function decodeMulaw(byte: number) {
  const u = ~byte & 0xff;
  const exponent = (u >> 4) & 0x07;
  const sample = ((((u & 0x0f) << 3) + BIAS) << exponent) - BIAS;
  return u & 0x80 ? -sample : sample;
}

export function encodeMulaw(sample: number) {
  const sign = sample < 0 ? 0x80 : 0;
  let s = Math.min(Math.abs(sample), CLIP) + BIAS;
  let exponent = 7;
  for (let mask = 0x4000; (s & mask) === 0 && exponent > 0; mask >>= 1) exponent -= 1;
  s = (s >> (exponent + 3)) & 0x0f;
  return ~(sign | (exponent << 4) | s) & 0xff;
}

/** A Twilio media payload (base64 µ-law, 8 kHz) as the base64 PCM Gemini accepts at rate=8000. */
export function phoneToGemini(payload: string) {
  const mulaw = Buffer.from(payload, 'base64');
  const pcm = Buffer.alloc(mulaw.length * 2);
  for (let i = 0; i < mulaw.length; i += 1) pcm.writeInt16LE(decodeMulaw(mulaw[i] ?? 0xff), i * 2);
  return pcm.toString('base64');
}

/** Gemini's 24 kHz PCM as 20 ms µ-law frames for the phone. */
export function geminiToPhone(pcm24: string) {
  const pcm = Buffer.from(pcm24, 'base64');
  const samples = Math.floor(pcm.length / 2);
  const mulaw = Buffer.alloc(Math.floor(samples / 3));
  for (let i = 0; i < mulaw.length; i += 1) {
    // Averaging each group of three filters out most of what 8 kHz cannot carry.
    const at = i * 6;
    const sum = pcm.readInt16LE(at) + pcm.readInt16LE(at + 2) + pcm.readInt16LE(at + 4);
    mulaw[i] = encodeMulaw(Math.round(sum / 3));
  }
  const frames: string[] = [];
  for (let at = 0; at < mulaw.length; at += 160)
    frames.push(mulaw.subarray(at, at + 160).toString('base64'));
  return frames;
}
