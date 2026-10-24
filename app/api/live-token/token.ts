import { z } from 'zod';
import { MULTILINGUAL_INSTRUCTIONS, SCREENER_INSTRUCTIONS } from '@/lib/screener-prompt';

export const LIVE_MODEL = 'gemini-3.8-live';
const TokenResponse = z.object({ name: z.string().startsWith('auth_tokens/') });

export function tokenRequest(now = Date.now(), multilingual = false) {
  return {
    uses: 1,
    expireTime: new Date(now + 2 * 60_000).toISOString(),
    newSessionExpireTime: new Date(now + 60_000).toISOString(),
    // This is the wire shape emitted by Google's SDK; omitted fieldMask locks the setup.
    bidiGenerateContentSetup: {
      model: `models/${LIVE_MODEL}`,
      generationConfig: {
        responseModalities: ['AUDIO'],
        maxOutputTokens: 256,
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Sulafat' } } },
      },
      systemInstruction: {
        parts: [{ text: multilingual ? MULTILINGUAL_INSTRUCTIONS : SCREENER_INSTRUCTIONS }],
        role: 'user',
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      realtimeInputConfig: {
        activityHandling: 'NO_INTERRUPTION',
        automaticActivityDetection: {
          startOfSpeechSensitivity: 'START_SENSITIVITY_LOW',
          endOfSpeechSensitivity: 'END_SENSITIVITY_LOW',
          prefixPaddingMs: 300,
          silenceDurationMs: 700,
        },
      },
    },
  };
}

export async function mintLiveToken(multilingual = false) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Live service unavailable');
  const response = await fetch('https://generativelanguage.googleapis.com/v1alpha/auth_tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(tokenRequest(Date.now(), multilingual)),
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
  });
  if (!response.ok) {
    // Server log only: Google's body names the exhausted quota or billing problem behind a 429.
    console.error(
      `Live token request failed: ${response.status}`,
      await response.text().catch(() => ''),
    );
    throw new Error('Live service unavailable');
  }
  return TokenResponse.parse(await response.json()).name;
}
