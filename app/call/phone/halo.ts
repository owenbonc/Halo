import { z } from 'zod';
import { CallRecord, PostCallBody } from '@/lib/types';
import type { NativeTurn } from '../native-speech';
import { LiveTokenResponse } from '../protocol';
import { callRequest } from '../request';

const Approved = z.object({ valid: z.literal(true) }).strict();

/**
 * The bridge goes through the Halo app's own routes, so phone calls get the same locked
 * Gemini setup, access code, budget, reply check and analysis as calls from /call.
 */
export function haloClient(baseUrl: string, accessCode: string) {
  // Server-side requests carry the app's origin explicitly; the routes refuse other origins.
  const headers = { Origin: new URL(baseUrl).origin, 'x-call-demo-code': accessCode };
  return {
    async startCall() {
      const response = await callRequest(
        `${baseUrl}/api/live-token?mode=live&voice=english`,
        { method: 'POST', headers },
        20_000,
      );
      if (response.status === 401) throw new Error('Halo rejected CALL_DEMO_ACCESS_CODE.');
      if (response.status === 429) throw new Error('Halo’s call limit is reached; wait a minute.');
      if (!response.ok) throw new Error(`Halo could not start a call (${response.status}).`);
      const session = LiveTokenResponse.parse(response.data);
      if (!session.token || !session.model) throw new Error('Halo is in recorded-only mode.');
      return { token: session.token, model: session.model, callSessionId: session.callSessionId };
    },

    async check(callSessionId: string, turn: NativeTurn, signal: AbortSignal) {
      try {
        const response = await callRequest(
          `${baseUrl}/api/live-token/validate`,
          {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: callSessionId, stage: turn.stage, text: turn.text }),
          },
          5_000,
          signal,
        );
        return response.ok && Approved.safeParse(response.data).success;
      } catch {
        return false;
      }
    },

    async deliver(callSessionId: string, transcript: string) {
      const body = PostCallBody.parse({
        callSessionId,
        transcript,
        callerLabel: 'Unknown caller (demo)',
      });
      const response = await callRequest(
        `${baseUrl}/api/calls`,
        {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
        30_000,
      );
      if (!response.ok) throw new Error(`Halo did not confirm delivery (${response.status}).`);
      return CallRecord.parse(response.data);
    },
  };
}
export type HaloClient = ReturnType<typeof haloClient>;
