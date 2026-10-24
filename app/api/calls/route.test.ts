import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { POST } from './route';

const { claim, recordCall } = vi.hoisted(() => ({ claim: vi.fn(), recordCall: vi.fn() }));
vi.mock('@/lib/db', () => ({
  collections: async () => ({ callSessions: { findOneAndUpdate: claim } }),
}));
vi.mock('@/lib/calls', () => ({ recordCall, listCallViews: vi.fn() }));
const now = new Date('2026-10-24T15:00:00.000Z');
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(now);
});
afterEach(() => vi.useRealTimers());
const request = (
  body: unknown = {
    callSessionId: 'synthetic-session',
    transcript: 'Caller: A courier will collect your cash.',
    callerLabel: 'Call 08001234567 or visit scam.example',
  },
) =>
  new Request('https://demo.test/api/calls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

it('validates the body before consuming a session', async () => {
  expect((await POST(request({ transcript: '' }))).status).toBe(400);
  expect(claim).not.toHaveBeenCalled();
});

it('atomically requires a fresh unused session and uses a trusted caller label', async () => {
  claim.mockResolvedValue({ id: 'synthetic-session' });
  recordCall.mockResolvedValue({ id: 'synthetic-call' });
  expect((await POST(request())).status).toBe(201);
  expect(claim).toHaveBeenCalledWith(
    {
      id: 'synthetic-session',
      used: false,
      createdAt: { $gt: '2026-10-24T14:55:00.000Z', $lte: now.toISOString() },
    },
    { $set: { used: true } },
  );
  expect(recordCall).toHaveBeenCalledWith(
    'screener',
    'Caller: A courier will collect your cash.',
    'Unknown caller (demo)',
  );
});

it('rejects unknown, expired or used sessions before analysis', async () => {
  claim.mockResolvedValue(null);
  expect((await POST(request())).status).toBe(403);
  expect(recordCall).not.toHaveBeenCalled();
});

it('keeps delivery uncertain after a persistence failure and never reopens the session', async () => {
  claim.mockResolvedValue({ id: 'synthetic-session' });
  recordCall.mockRejectedValue(new Error('Synthetic database detail'));
  const response = await POST(request());
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({
    error: 'Delivery could not be confirmed. Check the Alerts page before another call.',
  });
  expect(claim).toHaveBeenCalledTimes(1);
});
