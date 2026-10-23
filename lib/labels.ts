import type { Band, ScamFamily } from './types';

export const BAND_LABEL: Record<Band, { icon: string; title: string; tone: string }> = {
  strong: { icon: '⛔', title: 'Strong warning signs', tone: 'border-red-700 bg-red-50' },
  some: { icon: '⚠️', title: 'Some warning signs', tone: 'border-amber-600 bg-amber-50' },
  none: {
    icon: '✅',
    title: 'No common warning signs found. This is not a guarantee.',
    tone: 'border-green-700 bg-green-50',
  },
};

export const FAMILY_LABEL: Record<ScamFamily, string> = {
  courier: 'Courier collecting cash or cards',
  bank_impersonation: 'Pretending to be your bank',
  police_impersonation: 'Pretending to be the police',
  remote_access: 'Asking to get onto your computer',
  investment: 'Investment offer',
  other: 'Other scam pattern',
  none: 'No scam pattern matched',
};
