import type { GuidanceId } from './types';

// The only phone numbers and links the app may ever show. Never render one from a model or a caller.
export const GUIDANCE: Record<GuidanceId, { title: string; body: string }> = {
  hang_up: {
    title: 'Hang up',
    body: "You don't have to stay on the line. It's fine to hang up on anyone.",
  },
  dont_call_back: {
    title: "Don't call them back",
    body: "Don't use any number the caller gave you, even if it looks real.",
  },
  different_phone: {
    title: 'Use a different phone',
    body: 'Scammers can keep a landline connected after you hang up. Use another phone if you can.',
  },
  call_159: {
    title: 'Call 159',
    body: "159 puts you through to your own bank's fraud team. It works for most UK banks.",
  },
  call_back_known_number: {
    title: 'Call back on a number you know',
    body: 'If it might be genuine, call them back on the number from your letter, bank card or their official website.',
  },
  report_fraud: {
    title: 'Report it',
    body: 'Call Report Fraud on 0300 123 2040 or visit reportfraud.police.uk. In Scotland, call Police Scotland on 101. Forward scam texts to 7726.',
  },
};
