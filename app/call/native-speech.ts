import { z } from 'zod';
import { decodePcm } from './protocol';
import { CallError, callRequest } from './request';

export const NativeStage = z.enum(['followup', 'closing']);
export const NativeText = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine(
    (text) => !/[\p{N}\p{Cc}\p{Cf}]|https?:|www\.|@|[\p{L}]\.[\p{L}]/iu.test(text),
    'Unexpected screening response.',
  );
export type NativeTurn = { stage: z.infer<typeof NativeStage>; text: string; pcm: string };

export class NativeReply {
  private text = '';
  private chunks: Uint8Array[] = [];
  private bytes = 0;
  private finished = false;
  private complete = false;
  private turns = 0;

  add(content: {
    outputTranscription?: { text?: string; finished?: boolean };
    modelTurn?: { parts: { inlineData?: { data: string; mimeType: string } }[] };
    turnComplete?: boolean;
    interrupted?: boolean;
  }) {
    if (content.interrupted) throw new CallError('The screening reply was interrupted. Try again.');
    this.text += content.outputTranscription?.text ?? '';
    if (this.text.length > 500) throw new CallError('The screening reply was too long.');
    this.finished ||= content.outputTranscription?.finished === true;
    this.complete ||= content.turnComplete === true;
    for (const part of content.modelTurn?.parts ?? []) {
      if (!part.inlineData) continue;
      if (!/^audio\/pcm;rate=24000$/i.test(part.inlineData.mimeType))
        throw new CallError('Unexpected screening audio format.');
      decodePcm(part.inlineData.data);
      const bytes = Uint8Array.from(atob(part.inlineData.data), (c) => c.charCodeAt(0));
      this.bytes += bytes.length;
      if (this.bytes > 24_000 * 2 * 10) throw new CallError('The screening reply was too long.');
      this.chunks.push(bytes);
    }
  }

  get ready() {
    return this.complete && this.finished;
  }

  take(): NativeTurn {
    if (!this.ready || !this.bytes || this.turns >= 2)
      throw new CallError('The screening reply was incomplete. Try again.');
    const parsed = NativeText.safeParse(this.text);
    if (!parsed.success) throw new CallError('The screening reply could not be checked.');
    const pcm = btoa(
      this.chunks
        .map((chunk) => {
          let text = '';
          for (const byte of chunk) text += String.fromCharCode(byte);
          return text;
        })
        .join(''),
    );
    const turn = {
      stage: this.turns === 0 ? ('followup' as const) : ('closing' as const),
      text: parsed.data,
      pcm,
    };
    this.turns += 1;
    this.text = '';
    this.chunks = [];
    this.bytes = 0;
    this.finished = false;
    this.complete = false;
    return turn;
  }
}

export async function validateNativeReply(
  sessionId: string,
  code: string,
  turn: NativeTurn,
  signal: AbortSignal,
) {
  const response = await callRequest(
    '/api/live-token/validate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-call-demo-code': code },
      body: JSON.stringify({ sessionId, stage: turn.stage, text: turn.text }),
    },
    10_000,
    signal,
  );
  if (
    !response.ok ||
    !z
      .object({ valid: z.literal(true) })
      .strict()
      .safeParse(response.data).success
  )
    throw new CallError(
      'The assistant’s reply could not be checked. Nothing was sent. Try the English voice.',
    );
}
