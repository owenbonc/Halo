import { z } from 'zod';

const Transcript = z.object({ transcript: z.string().max(20_000) }).strict();
const MAX_RESPONSE_BYTES = 100_000;

export async function transcribeLocally(audio: Blob, signal?: AbortSignal): Promise<string> {
  const token = process.env.HALO_LOCAL_MODEL_TOKEN;
  if (!token || token.length < 32 || !/^[\x21-\x7e]+$/.test(token))
    throw new Error('Local transcription is not configured.');
  if (!audio.size || audio.size > 10 * 1024 * 1024) throw new Error('Invalid recording size.');
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 25_000);
  try {
    const response = await fetch('http://127.0.0.1:8767/transcribe', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': audio.type || 'audio/webm' },
      body: audio,
      redirect: 'error',
      signal: signal ? AbortSignal.any([abort.signal, signal]) : abort.signal,
    });
    if (!response.ok || !response.body) throw new Error('Local transcription is unavailable.');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let bytes = 0;
    let text = '';
    try {
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > MAX_RESPONSE_BYTES) throw new Error('Invalid transcription response.');
        text += decoder.decode(chunk.value, { stream: true });
      }
      text += decoder.decode();
    } finally {
      reader.releaseLock();
    }
    return Transcript.parse(JSON.parse(text)).transcript.trim();
  } finally {
    clearTimeout(timer);
    abort.abort();
  }
}
