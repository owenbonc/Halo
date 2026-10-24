import { afterEach, expect, it, vi } from 'vitest';
import { CallError } from './request';
import { submitCall } from './submit-call';

const signal = () => new AbortController().signal;
const call = () => ({ finish: vi.fn().mockResolvedValue('Caller: Synthetic caller.') });
const record = {
  id: 'synthetic-call',
  source: 'screener',
  createdAt: '2026-10-24T12:00:00Z',
  callerLabel: 'Unknown caller (demo)',
  transcript: 'Caller: Synthetic caller.',
  analysis: {
    band: 'some',
    family: 'other',
    cues: [],
    summary: 'Check with your person.',
    nextSteps: ['dont_call_back'],
    matchedPatternIds: [],
  },
};
afterEach(() => vi.unstubAllGlobals());

it('submits a finished call once and returns only a validated receipt', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json(record, { status: 201 }));
  vi.stubGlobal('fetch', fetcher);
  expect(await submitCall(call(), 'synthetic-session', signal())).toEqual(record);
  expect(fetcher).toHaveBeenCalledOnce();
  expect(JSON.parse(fetcher.mock.calls[0]?.[1].body)).toEqual({
    callSessionId: 'synthetic-session',
    transcript: record.transcript,
    callerLabel: record.callerLabel,
  });
});

it('does not send an incomplete or invalid call', async () => {
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  await expect(
    submitCall(
      {
        finish: async () => {
          throw new CallError('Interrupted');
        },
      },
      'test',
      signal(),
    ),
  ).rejects.toThrow('Interrupted');
  await expect(submitCall({ finish: async () => '' }, 'test', signal())).rejects.toThrow(
    'Nothing was sent',
  );
  expect(fetcher).not.toHaveBeenCalled();
});

it('does not submit if cancellation arrives during finalisation', async () => {
  const controller = new AbortController();
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  await expect(
    submitCall(
      {
        finish: async () => {
          controller.abort();
          return record.transcript;
        },
      },
      'test',
      controller.signal,
    ),
  ).rejects.toThrow('Aborted');
  expect(fetcher).not.toHaveBeenCalled();
});

it.each(['http', 'network', 'invalidReceipt'])(
  'treats %s delivery failure as uncertain and never automatically retries',
  async (kind) => {
    const fetcher = vi.fn();
    if (kind === 'network') fetcher.mockRejectedValue(new Error('upstream secret details'));
    else
      fetcher.mockResolvedValue(
        kind === 'http' ? new Response('', { status: 502 }) : Response.json({}),
      );
    vi.stubGlobal('fetch', fetcher);
    await expect(submitCall(call(), 'test', signal())).rejects.toThrow(
      'Check the recipient’s Alerts',
    );
    expect(fetcher).toHaveBeenCalledOnce();
  },
);

it('distinguishes preparation failure from an attempted delivery', async () => {
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  await expect(
    submitCall(
      {
        finish: async () => {
          throw new Error('private details');
        },
      },
      'test',
      signal(),
    ),
  ).rejects.toThrow('No summary was sent');
  expect(fetcher).not.toHaveBeenCalled();
});
