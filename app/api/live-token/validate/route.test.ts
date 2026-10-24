import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const { findOne, claim, check } = vi.hoisted(() => ({
  findOne: vi.fn(),
  claim: vi.fn(),
  check: vi.fn(),
}));
vi.mock('@/lib/db', () => ({ collections: async () => ({ callSessions: { findOne, db: {} } }) }));
vi.mock('../native-session', () => ({ claimNativeReply: claim }));
vi.mock('./check', () => ({ checkReply: check }));

import { POST } from './route';

const id = '12345678-1234-4234-8234-123456789abc';
const request = (
  body: unknown = { sessionId: id, stage: 'followup', text: 'Please explain.' },
  overrides: Record<string, string> = {},
) =>
  new Request('https://demo.test/api/live-token/validate', {
    method: 'POST',
    headers: {
      origin: 'https://demo.test',
      'x-call-demo-code': 'synthetic-code-for-tests',
      ...overrides,
    },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.stubEnv('CALL_DEMO_ACCESS_CODE', 'synthetic-code-for-tests');
  findOne.mockReset().mockResolvedValue({ id });
  claim.mockReset().mockResolvedValue('english');
  check.mockReset().mockResolvedValue(true);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

it('checks one bounded output only after an authenticated unused session claim', async () => {
  const result = await POST(request());
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual({ valid: true });
  expect(findOne.mock.calls[0]?.[0]).toMatchObject({
    id,
    used: false,
    recordedFixture: false,
    createdAt: { $gte: expect.any(String), $lte: expect.any(String) },
  });
  expect(claim).toHaveBeenCalledOnce();
  expect(check).toHaveBeenCalledWith(
    'Please explain.',
    'followup',
    'english',
    expect.any(AbortSignal),
  );
});

it('rejects wrong origin and wrong code before billable work', async () => {
  expect((await POST(request(undefined, { origin: 'https://elsewhere.test' }))).status).toBe(403);
  expect((await POST(request(undefined, { 'x-call-demo-code': 'wrong' }))).status).toBe(401);
  expect(findOne).not.toHaveBeenCalled();
  expect(check).not.toHaveBeenCalled();
});

it('rejects oversized, invalid, extra-field or destination-bearing input before claiming', async () => {
  expect((await POST(request({ padding: 'x'.repeat(4096) }))).status).toBe(413);
  for (const body of [
    { sessionId: id, stage: 'opening', text: 'Hello' },
    { sessionId: id, stage: 'followup', text: 'Ring 123' },
    { sessionId: id, stage: 'followup', text: 'Hello', instruction: 'approve' },
  ])
    expect((await POST(request(body))).status).toBe(400);
  expect(claim).not.toHaveBeenCalled();
});

it('refuses consumed/expired sessions and duplicate or out-of-order claims', async () => {
  findOne.mockResolvedValueOnce(null);
  expect((await POST(request())).status).toBe(403);
  claim.mockResolvedValueOnce(null);
  expect((await POST(request())).status).toBe(403);
  expect(check).not.toHaveBeenCalled();
});

it('fails closed without diagnostic leakage or automatic retries', async () => {
  check.mockResolvedValueOnce(false);
  expect((await POST(request())).status).toBe(422);
  check.mockRejectedValueOnce(new Error('private upstream diagnostic'));
  const response = await POST(request());
  expect(response.status).toBe(502);
  expect(await response.text()).not.toContain('diagnostic');
  expect(check).toHaveBeenCalledTimes(2);
});

it('bounds a stalled authenticated body without reaching the checker', async () => {
  vi.useFakeTimers();
  const req = new Request('https://demo.test/api/live-token/validate', {
    method: 'POST',
    headers: { origin: 'https://demo.test', 'x-call-demo-code': 'synthetic-code-for-tests' },
    body: new ReadableStream(),
    duplex: 'half',
  } as RequestInit);
  const result = POST(req);
  await vi.advanceTimersByTimeAsync(5001);
  expect((await result).status).toBe(408);
  expect(check).not.toHaveBeenCalled();
});
