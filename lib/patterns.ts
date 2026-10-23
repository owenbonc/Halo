import { z } from 'zod';
import { type Pattern, ScamFamily } from './types';

// One file in data/patterns. Ids carry no digits, so a matched id can never look like a number.
export const PatternFile = z
  .object({
    id: z.string().regex(/^[a-z]+(-[a-z]+)*$/),
    family: ScamFamily.exclude(['none']),
    title: z.string().min(3).max(80),
    description: z.string().min(40).max(600),
    phrases: z.array(z.string().min(3)).min(3).max(10),
    source: z.url(),
  })
  .strict();

// The text Atlas embeds and searches: what the script is and how it sounds.
export function patternText(pattern: Pattern): string {
  return `${pattern.title}. ${pattern.description} Typical phrases: ${pattern.phrases.join('; ')}.`;
}

// shortcut: returns nothing until Task 3 adds Atlas hybrid search.
export async function findPatterns(_transcript: string, _k: number): Promise<Pattern[]> {
  return [];
}
