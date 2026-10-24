import { existsSync } from 'node:fs';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import cases from '../data/test-cases.json';
import { analyse } from './analyse';
import { closeDb } from './db';
import { carriesNumberOrLink } from './scrub';
import { Band, ScamFamily } from './types';

const live = process.env.RUN_LIVE_EVAL === '1';
if (live && existsSync('.env')) process.loadEnvFile('.env');

const TestCases = z.array(
  z.object({
    id: z.string(),
    set: z.enum(['scam', 'benign', 'ambiguous', 'adversarial', 'messy']),
    transcript: z.string().min(1),
    bands: z.array(Band).min(1),
    families: z.array(ScamFamily).optional(),
  }),
);

// Stop on the first service failure: RUN_LIVE_EVAL=1 pnpm vitest run lib/analyse.eval.test.ts --bail=1
describe.skipIf(!live)('analyse on the team-written cases', () => {
  beforeAll(() => vi.stubEnv('DEMO_FALLBACK', '0'));
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    vi.unstubAllEnvs();
    await closeDb();
  });

  it.each(TestCases.parse(cases))(
    '$id',
    async ({ transcript, bands, families }) => {
      const failures: string[] = [];
      vi.spyOn(console, 'error').mockImplementation((message: unknown) => {
        failures.push(String(message));
      });
      for (let run = 0; run < 3; run++) {
        const result = await analyse(transcript, 'screener');
        expect(failures, 'A live evaluation must not use a degraded service result.').toEqual([]);
        expect(bands).toContain(result.band);
        if (families) expect(families).toContain(result.family);
        const { cues, summary, matchedPatternIds } = result;
        expect(JSON.stringify({ cues, summary, matchedPatternIds })).not.toMatch(/\p{Nd}/u);
        expect(cues.length).toBeLessThanOrEqual(4);
        for (const text of [...cues, summary]) expect(carriesNumberOrLink(text)).toBe(false);
      }
    },
    180_000,
  );
});
