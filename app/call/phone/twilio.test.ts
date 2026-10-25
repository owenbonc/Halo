import { createHmac } from 'node:crypto';
import { expect, it } from 'vitest';
import { StreamEvent, streamTwiml, twilioSignature, validTwilioRequest } from './twilio';

const token = '0123456789abcdef0123456789abcdef';
const url = 'https://line.example.com/twilio/voice';
const form = { CallSid: 'CA123', AccountSid: 'AC456', From: '+15550000000', To: '+15551111111' };

it('signs the URL followed by the form fields sorted by name, as Twilio documents', () => {
  const data = `${url}AccountSidAC456CallSidCA123From+15550000000To+15551111111`;
  expect(twilioSignature(token, url, form)).toBe(
    createHmac('sha1', token).update(data).digest('base64'),
  );
});

it('accepts only an exact signature for this URL, token and form', () => {
  const signature = twilioSignature(token, url, form);
  expect(validTwilioRequest(token, url, form, signature)).toBe(true);
  expect(validTwilioRequest(token, url, form, undefined)).toBe(false);
  expect(validTwilioRequest(token, url, { ...form, CallSid: 'CA999' }, signature)).toBe(false);
  expect(validTwilioRequest(token, `${url}?x=1`, form, signature)).toBe(false);
  expect(validTwilioRequest('f'.repeat(32), url, form, signature)).toBe(false);
  expect(validTwilioRequest(token, url, form, `${signature}=`)).toBe(false);
});

it('escapes the stream URL and ticket into the TwiML', () => {
  const twiml = streamTwiml('wss://line.example.com/twilio/media', 'a"b<c');
  expect(twiml).toContain('<Stream url="wss://line.example.com/twilio/media">');
  expect(twiml).toContain('value="a&#34;b&#60;c"');
});

it('reads only µ-law 8 kHz mono stream starts', () => {
  const start = (encoding: string) => ({
    event: 'start',
    streamSid: 'MZ1',
    start: {
      customParameters: { ticket: 't' },
      mediaFormat: { encoding, sampleRate: 8000, channels: 1 },
    },
  });
  expect(StreamEvent.safeParse(start('audio/x-mulaw')).success).toBe(true);
  expect(StreamEvent.safeParse(start('audio/x-alaw')).success).toBe(false);
  expect(
    StreamEvent.safeParse({ event: 'media', media: { payload: 'x'.repeat(9000) } }).success,
  ).toBe(false);
});
