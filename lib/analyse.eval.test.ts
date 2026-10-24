import { existsSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import cases from '../data/test-cases.json';
import { analyse } from './analyse';
import { closeDb } from './db';
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

// Live against Argon and Atlas, three runs per case: RUN_LIVE_EVAL=1 pnpm vitest run lib/analyse.eval.test.ts
describe.skipIf(!live)('analyse on the team-written cases', () => {
  afterAll(closeDb);

  it.each(TestCases.parse(cases))(
    '$id',
    async ({ transcript, bands, families }) => {
      for (let run = 0; run < 3; run++) {
        const result = await analyse(transcript, 'screener');
        expect(bands).toContain(result.band);
        if (families) expect(families).toContain(result.family);
        const { cues, summary, matchedPatternIds } = result;
        expect(JSON.stringify({ cues, summary, matchedPatternIds })).not.toMatch(/\p{Nd}/u);
      }
    },
    180_000,
  );
});
