// Restores the seeded household and clears calls and alerts before a demo run.
import { closeDb, collections } from '../lib/db';
import { SEED_SETTINGS } from '../lib/seed';

const { calls, alerts, callSessions, settings } = await collections();
await Promise.all([calls.deleteMany({}), alerts.deleteMany({}), callSessions.deleteMany({})]);
await settings.replaceOne(
  { id: 'household' },
  { id: 'household', ...SEED_SETTINGS },
  { upsert: true },
);
console.log('Demo data reset.');
await closeDb();
