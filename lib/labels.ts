import type { Band, ScamFamily } from './types';

// short: the one or two words that fit inside the verdict circle on her card.
export const BAND_LABEL: Record<Band, { title: string; short: string }> = {
  strong: { title: 'Strong warning signs', short: 'Strong warning' },
  some: { title: 'Some warning signs', short: 'Some warning' },
  none: {
    title: 'No common warning signs found. This is not a guarantee.',
    short: 'Nothing found',
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
