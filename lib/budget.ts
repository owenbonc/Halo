import { z } from 'zod';
import { collections } from './db';
import { HttpError } from './http';

const Counter = z.object({ count: z.number().int().positive() });

export async function reserveBudget(
  operation: 'auth' | 'token' | 'transcribe' | 'analyse',
  now = Date.now(),
) {
  const { calls } = await collections();
  const budgets = calls.db.collection<{ _id: string; count: number; expiresAt: Date }>(
    'call_token_budgets',
  );
  await budgets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  for (const [window, maximum] of [
    [60_000, operation === 'auth' ? 10 : 6],
    [3_600_000, operation === 'auth' ? 100 : 60],
  ] as const) {
    const bucket = Math.floor(now / window);
    const counter = await budgets.findOneAndUpdate(
      { _id: `${operation}:${window}:${bucket}` },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 2) * window) } },
      { upsert: true, returnDocument: 'after' },
    );
    if (Counter.parse(counter).count > maximum)
      throw new HttpError(
        429,
        'Demo limit reached. Please try again later.',
        Math.ceil(((bucket + 1) * window - now) / 1000),
      );
  }
}
