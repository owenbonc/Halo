import { z } from 'zod';
import { decodePcm } from './protocol';
import { CallError, callRequest } from './request';

export const NativeStage = z.enum(['followup', 'closing']);
export type NativeStage = z.infer<typeof NativeStage>;
export const NativeText = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine(
    (text) => !/[\p{N}\p{Cc}\p{Cf}]|https?:|www\.|@|[\p{L}]\.[\p{L}]/iu.test(text),
    'Unexpected screening response.',
  );
export type NativeTurn = { stage: NativeStage; text: string; pcm: string };

type ReplyContent = {
  outputTranscription?: { text?: string };
  modelTurn?: { parts: { inlineData?: { data: string; mimeType: string } }[] };
  turnComplete?: boolean;
  interrupted?: boolean;
};

export class NativeReply {
  private text = '';
  private chunks: Uint8Array[] = [];
  private bytes = 0;
  private complete = false;
  private fault?: CallError;
  private turns = 0;

  // A bad reply is recorded rather than thrown, so the call decides at turnComplete whether to fall back.
  add(content: ReplyContent) {
    this.complete ||= content.turnComplete === true;
    if (this.fault) return;
    try {
      this.collect(content);
    } catch (error) {
      this.fault =
        error instanceof CallError ? error : new CallError('Unexpected screening response.');
      this.text = '';
      this.chunks = [];
    }
  }

  private collect(content: ReplyContent) {
    if (content.interrupted) throw new CallError('The screening reply was interrupted. Try again.');
    this.text += content.outputTranscription?.text ?? '';
    if (this.text.length > 500) throw new CallError('The screening reply was too long.');
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

  // Gemini Live sends no end-of-transcription marker; the call drains briefly after turnComplete.
  get ready() {
    return this.complete;
  }

  get stage(): NativeStage {
    return this.turns === 0 ? 'followup' : 'closing';
  }

  advance(): NativeTurn {
    const { text, bytes, complete, fault, stage } = this;
    const chunks = this.skip();
    if (fault) throw fault;
    if (!complete || !bytes) throw new CallError('The screening reply was incomplete. Try again.');
    const parsed = NativeText.safeParse(text);
    if (!parsed.success) throw new CallError('The screening reply could not be checked.');
    const pcm = btoa(
      chunks
        .map((chunk) => {
          let binary = '';
          for (const byte of chunk) binary += String.fromCharCode(byte);
          return binary;
        })
        .join(''),
    );
    return { stage, text: parsed.data, pcm };
  }

  skip() {
    if (this.turns >= 2) throw new CallError('The screening reply was incomplete. Try again.');
    const { chunks } = this;
    this.turns += 1;
    this.text = '';
    this.chunks = [];
    this.bytes = 0;
    this.complete = false;
    this.fault = undefined;
    return chunks;
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
    5_000,
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
