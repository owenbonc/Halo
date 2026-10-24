import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PatternFile, patternText } from './patterns';

const dir = path.join(import.meta.dirname, '..', 'data', 'patterns');
const library = readdirSync(dir)
  .filter((file) => file.endsWith('.json'))
  .map((file) => ({
    file,
    pattern: PatternFile.parse(JSON.parse(readFileSync(path.join(dir, file), 'utf8'))),
  }));

describe('scam pattern library', () => {
  it('has at least thirty patterns, each file named after its id', () => {
    expect(library.length).toBeGreaterThanOrEqual(30);
    for (const { file, pattern } of library) expect(file).toBe(`${pattern.id}.json`);
  });

  it('covers every scam family with at least four patterns', () => {
    for (const family of [
      'courier',
      'police_impersonation',
      'bank_impersonation',
      'remote_access',
      'investment',
    ]) {
      expect(
        library.filter(({ pattern }) => pattern.family === family).length,
      ).toBeGreaterThanOrEqual(4);
    }
  });

  it('carries no phone numbers, so nothing it feeds can leak one', () => {
    for (const { pattern } of library) expect(patternText(pattern)).not.toMatch(/\d{3,}/);
  });
});
