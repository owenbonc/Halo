import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

/** Twilio's request signature: HMAC-SHA1 over the full URL plus the sorted form fields. */
export function twilioSignature(authToken: string, url: string, params: Record<string, string>) {
  const data = Object.keys(params)
    .sort()
    .reduce((text, key) => text + key + params[key], url);
  return createHmac('sha1', authToken).update(data, 'utf8').digest('base64');
}

export function validTwilioRequest(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string | undefined,
) {
  if (!signature) return false;
  const expected = Buffer.from(twilioSignature(authToken, url, params));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

const xml = (text: string) => text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Hands the answered call to our media stream; the ticket proves the stream came from this answer. */
export function streamTwiml(streamUrl: string, ticket: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Connect><Stream url="${xml(streamUrl)}"><Parameter name="ticket" value="${xml(ticket)}"/></Stream></Connect></Response>`;
}

export const BUSY_TWIML = `<?xml version="1.0" encoding="UTF-8"?><Response><Say language="en-GB">The practice line is busy. Please try again in a minute.</Say><Hangup/></Response>`;

export const StreamEvent = z.discriminatedUnion('event', [
  z.object({ event: z.literal('connected') }),
  z.object({
    event: z.literal('start'),
    streamSid: z.string().min(1).max(64),
    start: z.object({
      customParameters: z.record(z.string(), z.string()).default({}),
      mediaFormat: z.object({
        encoding: z.literal('audio/x-mulaw'),
        sampleRate: z.literal(8000),
        channels: z.literal(1),
      }),
    }),
  }),
  z.object({
    event: z.literal('media'),
    media: z.object({ payload: z.string().max(8_000) }),
  }),
  z.object({ event: z.literal('mark'), mark: z.object({ name: z.string().max(64) }) }),
  z.object({ event: z.literal('stop') }),
  z.object({ event: z.literal('dtmf') }),
]);
export type StreamEvent = z.infer<typeof StreamEvent>;

const Numbers = z.object({
  incoming_phone_numbers: z.array(z.object({ sid: z.string().startsWith('PN') })),
});

/** Points the Twilio number's incoming-call webhook at this bridge. */
export async function pointNumberAt(
  account: { sid: string; token: string; number: string },
  voiceUrl: string,
) {
  const base = `https://api.twilio.com/2010-04-01/Accounts/${account.sid}`;
  const headers = {
    Authorization: `Basic ${Buffer.from(`${account.sid}:${account.token}`).toString('base64')}`,
  };
  const found = await fetch(
    `${base}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(account.number)}`,
    { headers, signal: AbortSignal.timeout(10_000) },
  );
  if (!found.ok) throw new Error(`Twilio rejected the account details (${found.status}).`);
  const number = Numbers.parse(await found.json()).incoming_phone_numbers[0];
  if (!number) throw new Error('That phone number is not on this Twilio account.');
  const updated = await fetch(`${base}/IncomingPhoneNumbers/${number.sid}.json`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ VoiceUrl: voiceUrl, VoiceMethod: 'POST' }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!updated.ok) throw new Error(`Twilio did not update the number (${updated.status}).`);
}
