import { type Db, MongoClient } from 'mongodb';
import type { AlertRecord, CallRecord, Pattern, Settings } from './types';

type CallSession = { id: string; used: boolean; createdAt: string };
type SettingsDoc = Settings & { id: 'household' };

// Survives Next.js hot reloads, which would otherwise open a new pool per edit.
const cache = globalThis as unknown as { mongo?: Promise<MongoClient> };

async function database(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set. See .env.example.');
  cache.mongo ??= new MongoClient(uri).connect();
  return (await cache.mongo).db(process.env.MONGODB_DB ?? 'hangup');
}

export async function collections() {
  const db = await database();
  return {
    calls: db.collection<CallRecord>('calls'),
    alerts: db.collection<AlertRecord>('alerts'),
    settings: db.collection<SettingsDoc>('settings'),
    callSessions: db.collection<CallSession>('call_sessions'),
    patterns: db.collection<Pattern>('patterns'),
  };
}

export async function closeDb() {
  if (cache.mongo) await (await cache.mongo).close();
  cache.mongo = undefined;
}

// Our ids live in `id`; Mongo's `_id` never leaves the server.
export const noMongoId = { projection: { _id: 0 } } as const;
