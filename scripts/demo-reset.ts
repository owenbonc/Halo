// Restores the seeded household and clears calls and alerts before a demo run.
import { closeDb, collections, transaction } from '../lib/db';
import { SEED_SETTINGS } from '../lib/seed';
import { checkWriteTarget } from './write-target';

console.log(
  'Reset target:',
  checkWriteTarget(
    process.env.MONGODB_URI,
    process.env.MONGODB_DB ?? 'hangup',
    process.env.CONFIRM_DEMO_TARGET,
  ),
);
await transaction(async (session) => {
  const { calls, alerts, callSessions, settings, devices, invitations } = await collections();
  await calls.deleteMany({}, { session });
  await alerts.deleteMany({}, { session });
  await callSessions.deleteMany({}, { session });
  await devices.deleteMany({}, { session });
  await invitations.deleteMany({}, { session });
  await settings.replaceOne(
    { id: 'household' },
    {
      id: 'household',
      ...SEED_SETTINGS,
      contact: { ...SEED_SETTINGS.contact, verified: false },
      recipientId: crypto.randomUUID(),
      revision: 0,
      alertSequence: 0,
    },
    { upsert: true, session },
  );
});
console.log('Demo data reset.');
await closeDb();
