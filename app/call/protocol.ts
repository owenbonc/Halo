import { z } from 'zod';

export const LiveTokenResponse = z.union([
  z.object({
    token: z.string().startsWith('auth_tokens/'),
    model: z.string().min(1),
    callSessionId: z.uuid(),
    recordedFixture: z.boolean(),
  }),
  z.object({
    token: z.null(),
    model: z.null(),
    callSessionId: z.uuid(),
    recordedFixture: z.boolean(),
  }),
]);
export const TranscriptResponse = z.object({ transcript: z.string().trim().min(1).max(19_000) });
export const LiveMessage = z.object({
  setupComplete: z.object({}).optional(),
  goAway: z.object({}).optional(),
  usageMetadata: z
    .object({
      totalTokenCount: z.number().int().nonnegative().optional(),
      promptTokenCount: z.number().int().nonnegative().optional(),
      responseTokenCount: z.number().int().nonnegative().optional(),
    })
    .optional(),
  serverContent: z
    .object({
      inputTranscription: z.object({ text: z.string().optional() }).optional(),
      outputTranscription: z.object({ text: z.string().optional() }).optional(),
      interrupted: z.boolean().optional(),
      turnComplete: z.boolean().optional(),
      modelTurn: z
        .object({
          parts: z.array(
            z.object({
              inlineData: z
                .object({ data: z.string().max(1_000_000), mimeType: z.string().max(100) })
                .optional(),
            }),
          ),
        })
        .optional(),
    })
    .optional(),
});

export class Transcript {
  private turns: { role: 'Caller' | 'Assistant'; text: string }[] = [];
  add(role: 'Caller' | 'Assistant', text = '') {
    if (!text) return;
    const last = this.turns.at(-1);
    // The caller's words stream in as fragments of one turn; each assistant line is a turn of its own.
    if (role === 'Caller' && last?.role === 'Caller') last.text += text;
    else this.turns.push({ role, text });
    if (this.text().length > 20_000) throw new Error('The call transcript is too long.');
  }
  hasCaller() {
    return this.turns.some((t) => t.role === 'Caller' && t.text.trim());
  }
  text() {
    return this.turns.map((t) => `${t.role}: ${t.text.trim()}`).join('\n');
  }
}

export function pcm16(samples: Float32Array) {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  samples.forEach((sample, i) => {
    const n = Math.max(-1, Math.min(1, sample));
    view.setInt16(i * 2, n * (n < 0 ? 32768 : 32767), true);
  });
  return bytes;
}

export function decodePcm(data: string) {
  if (data.length > 1_000_000) throw new Error('Audio chunk too large');
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  if (!bytes.length || bytes.length % 2) throw new Error('Invalid audio');
  const view = new DataView(bytes.buffer);
  return Float32Array.from(
    { length: bytes.length / 2 },
    (_, i) => view.getInt16(i * 2, true) / 32768,
  );
}
