import { z } from 'zod';
import { SCREENER_LINES } from '@/lib/screener-prompt';
import { decodePcm } from './protocol';
import { CallError, callRequest } from './request';

const clip = (text: string) =>
  z.object({ text: z.literal(text), pcm: z.string().min(4).max(1_000_000) });
const Clips = z.object({
  opening: clip(SCREENER_LINES.opening),
  followup: clip(SCREENER_LINES.followup),
  closing: clip(SCREENER_LINES.closing),
});
export type VoiceClips = z.infer<typeof Clips>;

export async function loadVoice(signal: AbortSignal): Promise<VoiceClips> {
  const response = await callRequest('/call/voice', {}, 10_000, signal);
  if (!response.ok) throw new CallError('The voice could not load. Please try again.');
  const clips = Clips.parse(response.data);
  for (const { pcm } of Object.values(clips)) {
    if (decodePcm(pcm).length > 24_000 * 12) throw new CallError('Invalid screening audio.');
  }
  return clips;
}
