import { afterEach, expect, it, vi } from 'vitest';
import { pipeline } from './pipeline';

afterEach(() => vi.restoreAllMocks());

it('removes numbers from caller and model words, but keeps its own timings', () => {
  const lines: string[] = [];
  vi.spyOn(console, 'log').mockImplementation((line: string) => lines.push(line));
  const log = pipeline(1).log;
  log('caller', 'Ring 0808 157 0192 straight away.');
  log('drafted', 'Is oh eight hundred your number?');
  log('checked', 'approved in 1.8s');
  const printed = lines.join('\n');
  expect(printed).not.toMatch(/0808|0192|eight hundred/);
  expect(printed.match(/\[number removed\]/g)).toHaveLength(2);
  expect(printed).toContain('approved in 1.8s');
});
