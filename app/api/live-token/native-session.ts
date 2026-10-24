import type { Db } from 'mongodb';

export type NativeVoice = 'english' | 'automatic';
type NativeSession = {
  _id: string;
  voice: NativeVoice;
  next: 'followup' | 'closing' | 'done';
  expiresAt: Date;
};
const sessions = (db: Db) => db.collection<NativeSession>('native_voice_sessions');

export async function createNativeSession(
  db: Db,
  id: string,
  voice: NativeVoice,
  now = Date.now(),
) {
  const store = sessions(db);
  await store.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await store.insertOne({ _id: id, voice, next: 'followup', expiresAt: new Date(now + 120_000) });
}

export async function claimNativeReply(
  db: Db,
  id: string,
  stage: 'followup' | 'closing',
  now = Date.now(),
) {
  // English closes with the prerecorded line, so only automatic sessions ever check a closing.
  const claimed = await sessions(db).findOneAndUpdate(
    {
      _id: id,
      next: stage,
      expiresAt: { $gt: new Date(now) },
      ...(stage === 'closing' ? { voice: 'automatic' as const } : {}),
    },
    { $set: { next: stage === 'followup' ? 'closing' : 'done' } },
  );
  return claimed?.voice ?? null;
}
