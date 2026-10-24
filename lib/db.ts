import { type ClientSession, type Db, MongoClient } from 'mongodb';
import type { z } from 'zod';
import type {
  CallSession,
  Device,
  Invitation,
  StoredAlert,
  StoredSettings,
} from './server-schemas';
import type { CallRecord, Pattern } from './types';

// Survives Next.js hot reloads, which would otherwise open a new pool per edit.
const cache = globalThis as unknown as { mongo?: Promise<MongoClient>; indexes?: Promise<void> };

async function database(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set. See .env.example.');
  const connection =
    cache.mongo ?? new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 }).connect();
  cache.mongo = connection;
  try {
    return (await connection).db(process.env.MONGODB_DB ?? 'hangup');
  } catch (error) {
    if (cache.mongo === connection) cache.mongo = undefined;
    throw error;
  }
}

export async function collections() {
  const db = await database();
  return {
    calls: db.collection<CallRecord>('calls'),
    alerts: db.collection<StoredAlert>('alerts'),
    settings: db.collection<StoredSettings>('settings'),
    callSessions: db.collection<CallSession>('call_sessions'),
    patterns: db.collection<Pattern>('patterns'),
    devices: db.collection<Device>('devices'),
    invitations: db.collection<z.infer<typeof Invitation>>('invitations'),
  };
}

export async function ensureIndexes() {
  cache.indexes ??= (async () => {
    const c = await collections();
    await Promise.all([
      c.calls.createIndex({ id: 1 }, { unique: true }),
      c.alerts.createIndex({ callId: 1 }, { unique: true }),
      c.alerts.createIndex({ id: 1 }, { unique: true }),
      c.settings.createIndex({ id: 1 }, { unique: true }),
      c.callSessions.createIndex({ id: 1 }, { unique: true }),
      c.callSessions.createIndex({ cleanupAt: 1 }, { expireAfterSeconds: 0 }),
      c.devices.createIndex({ tokenHash: 1 }, { unique: true }),
      c.devices.createIndex({ id: 1 }, { unique: true }),
      c.devices.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      c.invitations.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ]);
  })().catch((error) => {
    cache.indexes = undefined;
    throw error;
  });
  await cache.indexes;
}

export async function transaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
  await ensureIndexes();
  const client = await cache.mongo;
  if (!client) throw new Error('Database unavailable.');
  return client.withSession((session) => session.withTransaction(() => work(session)));
}

export async function closeDb() {
  const connection = cache.mongo;
  cache.mongo = undefined;
  cache.indexes = undefined;
  if (connection)
    await connection.then(
      (client) => client.close(),
      () => {},
    );
}

// Our ids live in `id`; Mongo's `_id` never leaves the server.
export const noMongoId = { projection: { _id: 0 } } as const;
