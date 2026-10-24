import type { Db } from 'mongodb';

type NativeSession = { _id: string; next: 'followup' | 'closing' | 'done'; expiresAt: Date };
const sessions = (db: Db) => db.collection<NativeSession>('native_voice_sessions');

export async function createNativeSession(db: Db, id: string, now = Date.now()) {
  const store = sessions(db);
  await store.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await store.insertOne({ _id: id, next: 'followup', expiresAt: new Date(now + 120_000) });
}

export async function claimNativeReply(
  db: Db,
  id: string,
  stage: 'followup' | 'closing',
  now = Date.now(),
) {
  return !!(await sessions(db).findOneAndUpdate(
    { _id: id, next: stage, expiresAt: { $gt: new Date(now) } },
    { $set: { next: stage === 'followup' ? 'closing' : 'done' } },
  ));
}
