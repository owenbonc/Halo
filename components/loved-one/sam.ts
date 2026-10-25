import { Check, Phone, TriangleAlert } from '@/components/ui/icons';
import type { CallView } from '@/lib/types';

export type SamState = 'unsent' | 'paused' | 'sent' | 'acknowledged' | 'escalated';

export const samState = (call: CallView, paused: boolean): SamState =>
  call.alert?.status ?? (paused ? 'paused' : 'unsent');

export const SAM_LINE: Record<SamState, (c: string) => string> = {
  unsent: (c) => `${c} hasn't been told yet.`,
  paused: (c) => `Messages to ${c} are paused.`,
  sent: (c) => `${c} has been told and asked to call you.`,
  acknowledged: (c) => `${c} is calling you.`,
  escalated: (c) => `${c} hasn't replied. Call 159.`,
};

// Solid navy while Sam is on it; white with a red edge when Sam hasn't replied (red text fails on navy).
export const SAM_STYLE: Record<SamState, { box: string; Icon: typeof Check }> = {
  unsent: { box: 'border-line bg-surface text-ink', Icon: Phone },
  paused: { box: 'border-line bg-surface text-ink-2', Icon: Phone },
  sent: { box: 'border-accent-strong bg-accent text-on-accent', Icon: Check },
  acknowledged: { box: 'border-accent-strong bg-accent text-on-accent', Icon: Phone },
  escalated: { box: 'border-danger bg-surface text-danger', Icon: TriangleAlert },
};
