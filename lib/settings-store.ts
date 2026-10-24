import type { ClientSession } from 'mongodb';
import { collections } from './db';
import { SEED_SETTINGS } from './seed';
import { StoredSettings } from './server-schemas';

export async function household(session?: ClientSession, lock = false): Promise<StoredSettings> {
  const { settings } = await collections();
  await settings.updateOne(
    { id: 'household' },
    {
      $setOnInsert: {
        ...SEED_SETTINGS,
        contact: { ...SEED_SETTINGS.contact, verified: false },
        id: 'household',
        recipientId: crypto.randomUUID(),
        revision: 0,
        alertSequence: 0,
      },
    },
    { upsert: true, session },
  );
  // Legacy synthetic settings retain their choices but gain a private recipient identity.
  await settings.updateOne(
    { id: 'household', recipientId: { $exists: false } },
    { $set: { recipientId: crypto.randomUUID(), revision: 0, alertSequence: 0 } },
    { session },
  );
  if (lock)
    await settings.updateOne({ id: 'household' }, { $inc: { alertSequence: 1 } }, { session });
  return StoredSettings.parse(await settings.findOne({ id: 'household' }, { session }));
}

export const settingsTag = (settings: StoredSettings) => `"settings-${settings.revision}"`;
