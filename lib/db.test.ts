import { afterEach, expect, it, vi } from 'vitest';

const { connect, db, close } = vi.hoisted(() => ({
  connect: vi.fn(),
  db: vi.fn(),
  close: vi.fn(),
}));
vi.mock('mongodb', () => ({
  MongoClient: class {
    connect = connect;
  },
}));

import { closeDb, collections } from './db';

afterEach(async () => {
  await closeDb();
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

it('retries a failed MongoDB connection instead of caching its rejection', async () => {
  vi.stubEnv('MONGODB_URI', 'mongodb://synthetic.test');
  const collection = vi.fn();
  db.mockReturnValue({ collection });
  connect.mockRejectedValueOnce(new Error('synthetic outage')).mockResolvedValueOnce({ db, close });
  await expect(collections()).rejects.toThrow('synthetic outage');
  await collections();
  expect(connect).toHaveBeenCalledTimes(2);
  expect(collection).toHaveBeenCalledWith('calls');
});

it('can close cleanly after a rejected connection', async () => {
  vi.stubEnv('MONGODB_URI', 'mongodb://synthetic.test');
  connect.mockRejectedValueOnce(new Error('synthetic outage'));
  await expect(collections()).rejects.toThrow();
  await expect(closeDb()).resolves.toBeUndefined();
});
