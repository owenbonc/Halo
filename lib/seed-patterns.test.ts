import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { patterns, findPatterns, closeDb } = vi.hoisted(() => ({
  patterns: {
    deleteMany: vi.fn(),
    insertMany: vi.fn(),
    countDocuments: vi.fn(),
    listSearchIndexes: vi.fn(),
    updateSearchIndex: vi.fn(),
    createSearchIndex: vi.fn(),
  },
  findPatterns: vi.fn(),
  closeDb: vi.fn(),
}));
vi.mock('./db', () => ({ collections: async () => ({ patterns }), closeDb }));
vi.mock('./patterns', async (original) => ({
  ...(await original<typeof import('./patterns')>()),
  findPatterns,
}));

beforeEach(() => {
  vi.stubEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017');
  vi.resetModules();
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  patterns.countDocuments.mockResolvedValue(30);
  patterns.listSearchIndexes.mockReturnValue({
    toArray: async () => [
      { name: 'patterns_semantic', queryable: true, status: 'READY' },
      { name: 'patterns_phrases', queryable: true, status: 'READY' },
    ],
  });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('pattern seed acceptance', () => {
  it('waits for newly written documents even when both indexes report READY', async () => {
    findPatterns
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'courier-police-cash-collection', family: 'courier' }]);
    const run = import('../scripts/seed-patterns');
    await vi.waitFor(() => expect(findPatterns).toHaveBeenCalledTimes(1));
    expect(closeDb).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(5_000);
    await run;
    expect(findPatterns).toHaveBeenCalledTimes(2);
    expect(patterns.insertMany.mock.calls[0]?.[0]).toHaveLength(30);
    expect(closeDb).toHaveBeenCalledOnce();
  });

  it('fails after the deadline if a queryable index never returns a relevant pattern', async () => {
    findPatterns.mockResolvedValue([{ id: 'investment-friend-tip', family: 'investment' }]);
    const run = import('../scripts/seed-patterns').catch((error: unknown) => error);
    await vi.waitFor(() => expect(findPatterns).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(300_000);
    expect(await run).toEqual(
      new Error('Search indexes did not serve a relevant result after 5 minutes; check Atlas.'),
    );
  });
});
