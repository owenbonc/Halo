import type { Db } from 'mongodb';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { accessStatus, reserveCallBudget } from './guard';

afterEach(() => vi.unstubAllEnvs());
describe('demo access', () => {
  it('fails closed in production without a strong access code', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CALL_DEMO_ACCESS_CODE', '');
    expect(accessStatus(new Request('https://demo.test'))).toBe(503);
    vi.stubEnv('CALL_DEMO_ACCESS_CODE', '1234');
    expect(accessStatus(new Request('https://demo.test'))).toBe(503);
  });
  it('requires the configured code even when Origin is forged', () => {
    vi.stubEnv('CALL_DEMO_ACCESS_CODE', 'synthetic-demo-code-for-test');
    const make = (code: string) =>
      new Request('https://demo.test', {
        headers: { origin: 'https://demo.test', 'x-call-demo-code': code },
      });
    expect(accessStatus(make('wrong'))).toBe(401);
    expect(accessStatus(make('synthetic-demo-code-for-test'))).toBe(200);
  });
});
it('enforces an atomic shared budget and returns the actual retry window', async () => {
  const updates = vi.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 301 });
  const index = vi.fn();
  const db = {
    collection: () => ({ createIndex: index, findOneAndUpdate: updates }),
  } as unknown as Db;
  expect(await reserveCallBudget(db, 1000)).toBe(3599);
  expect(updates.mock.calls[0]).toEqual([
    { _id: '60000:0' },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(120000) } },
    { upsert: true, returnDocument: 'after' },
  ]);
  expect(index).toHaveBeenCalledWith({ expiresAt: 1 }, { expireAfterSeconds: 0 });
});
it('fails closed if the budget document is malformed', async () => {
  const db = {
    collection: () => ({ createIndex: vi.fn(), findOneAndUpdate: async () => ({ count: 'bad' }) }),
  } as unknown as Db;
  await expect(reserveCallBudget(db)).rejects.toThrow();
});
