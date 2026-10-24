import { afterEach, expect, it, vi } from 'vitest';

const { connect, close, collection, construct } = vi.hoisted(() => ({
  connect: vi.fn(),
  close: vi.fn().mockResolvedValue(undefined),
  collection: vi.fn(),
  construct: vi.fn(),
}));
vi.mock('mongodb', () => ({
  MongoClient: class {
    constructor() {
      construct();
    }
    connect = connect;
    close = close;
  },
}));
const cache = globalThis as unknown as { mongo?: Promise<unknown> };
afterEach(() => {
  cache.mongo = undefined;
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it('shares one connection attempt and recovers on the next request after an outage', async () => {
  cache.mongo = undefined;
  vi.stubEnv('MONGODB_URI', 'mongodb://synthetic.invalid');
  connect.mockRejectedValueOnce(new Error('Synthetic network outage'));
  connect.mockResolvedValueOnce({ db: () => ({ collection }) });
  const { collections } = await import('./db');
  const failed = await Promise.allSettled([collections(), collections()]);
  expect(failed.map((result) => result.status)).toEqual(['rejected', 'rejected']);
  expect(construct).toHaveBeenCalledTimes(1);
  expect(close).toHaveBeenCalledTimes(1);
  await collections();
  await collections();
  expect(construct).toHaveBeenCalledTimes(2);
  expect(connect).toHaveBeenCalledTimes(2);
});
