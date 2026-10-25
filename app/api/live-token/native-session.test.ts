import type { Db } from 'mongodb';
import { expect, it, vi } from 'vitest';
import { claimNativeReply } from './native-session';

const db = (findOneAndUpdate: ReturnType<typeof vi.fn>) =>
  ({ collection: () => ({ findOneAndUpdate }) }) as unknown as Db;

it('only lets automatic sessions claim a closing check', async () => {
  const findOneAndUpdate = vi.fn().mockResolvedValue({ voice: 'automatic' });
  expect(await claimNativeReply(db(findOneAndUpdate), 's', 'closing', 0)).toBe('automatic');
  expect(findOneAndUpdate.mock.calls[0]?.[0]).toMatchObject({
    next: 'closing',
    voice: 'automatic',
  });
  await claimNativeReply(db(findOneAndUpdate), 's', 'followup', 0);
  expect(findOneAndUpdate.mock.calls[1]?.[0]).not.toHaveProperty('voice');
});

it('returns null when the stage was already claimed or the session expired', async () => {
  expect(await claimNativeReply(db(vi.fn().mockResolvedValue(null)), 's', 'followup')).toBeNull();
});
