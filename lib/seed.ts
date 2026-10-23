import type { Settings } from './types';

// The one seeded household the demo runs on.
export const SEED_SETTINGS: Settings = {
  elderName: 'Grandma',
  contact: { name: 'Sam', verified: true },
  backupContact: { name: 'Alex' },
  alertMode: 'auto_strong',
  paused: false,
};
