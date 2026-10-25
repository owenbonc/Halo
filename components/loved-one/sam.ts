import { Check, Phone, TriangleAlert } from '@/components/ui/icons';
import type { CallView } from '@/lib/types';

export type SamState = 'unsent' | 'paused' | 'sent' | 'acknowledged' | 'promised' | 'escalated';

const HOUR = 60 * 60_000;

// "Is calling you" holds for an hour after Sam taps "I'm calling", as on Sam's phone; after that it's history.
export function samState(call: CallView, paused: boolean, now = Date.now()): SamState {
  const { alert } = call;
  if (!alert) return paused ? 'paused' : 'unsent';
  const at = Date.parse(alert.acknowledgedAt ?? alert.createdAt);
  return alert.status === 'acknowledged' && now - at >= HOUR ? 'promised' : alert.status;
}

export const SAM_LINE: Record<SamState, (c: string) => string> = {
  unsent: (c) => `${c} hasn't been told yet.`,
  paused: (c) => `Messages to ${c} are paused.`,
  sent: (c) => `${c} has been told and asked to call you.`,
  acknowledged: (c) => `${c} is calling you.`,
  promised: (c) => `${c} said they'd call you about this.`,
  escalated: (c) => `${c} hasn't replied. Call 159.`,
};

// Lavender while Sam is on it; white with a red edge when Sam hasn't replied (red text fails on lavender).
export const SAM_STYLE: Record<SamState, { box: string; Icon: typeof Check }> = {
  unsent: { box: 'border-line bg-surface text-ink', Icon: Phone },
  paused: { box: 'border-line bg-surface text-ink-2', Icon: Phone },
  sent: { box: 'border-accent-strong bg-accent text-on-accent', Icon: Check },
  acknowledged: { box: 'border-accent-strong bg-accent text-on-accent', Icon: Phone },
  escalated: { box: 'border-danger bg-surface text-danger', Icon: TriangleAlert },
  promised: { box: 'border-line bg-surface text-ink', Icon: Check },
};
