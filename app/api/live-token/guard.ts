import { createHash, timingSafeEqual } from 'node:crypto';
import type { Db } from 'mongodb';
import { z } from 'zod';

export function accessStatus(request: Request): 200 | 401 | 503 {
  const configured = process.env.CALL_DEMO_ACCESS_CODE;
  if (!configured) return process.env.NODE_ENV === 'production' ? 503 : 200;
  if (configured.length < 16) return 503;
  const supplied = request.headers.get('x-call-demo-code') ?? '';
  if (supplied.length > 256) return 401;
  const hash = (text: string) => createHash('sha256').update(text).digest();
  return timingSafeEqual(hash(configured), hash(supplied)) ? 200 : 401;
}

const Counter = z.object({ count: z.number().int().positive() });
type Budget = { _id: string; count: number; expiresAt: Date };

export async function reserveCallBudget(db: Db, now = Date.now()) {
  const budgets = db.collection<Budget>('call_token_budgets');
  await budgets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  // Global atomic budgets also hold across serverless instances and forged client IPs.
  for (const [window, maximum] of [
    [60_000, 20],
    [3_600_000, 300],
  ] as const) {
    const bucket = Math.floor(now / window);
    const counter = await budgets.findOneAndUpdate(
      { _id: `${window}:${bucket}` },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 2) * window) } },
      { upsert: true, returnDocument: 'after' },
    );
    if (Counter.parse(counter).count > maximum)
      return Math.ceil(((bucket + 1) * window - now) / 1000);
  }
  return null;
}
