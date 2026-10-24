import { z } from 'zod';
import { collections } from './db';
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

export const VECTOR_INDEX = 'patterns_semantic';
export const TEXT_INDEX = 'patterns_phrases';
export const EMBED_MODEL = 'voyage-4';

// Hybrid search: meaning (Vector Search, embedded by Atlas with Voyage) fused with the exact
// scam phrases (Atlas Search), so "safe account" ranks even when the story around it is new.
export async function findPatterns(transcript: string, k: number): Promise<Pattern[]> {
  const { patterns } = await collections();
  return patterns
    .aggregate<Pattern>([
      {
        $rankFusion: {
          input: {
            pipelines: {
              semantic: [
                {
                  $vectorSearch: {
                    index: VECTOR_INDEX,
                    path: 'text',
                    query: { text: transcript },
                    model: EMBED_MODEL,
                    numCandidates: 50,
                    limit: k * 2,
                  },
                },
              ],
              phrases: [
                {
                  $search: {
                    index: TEXT_INDEX,
                    text: { query: transcript, path: ['phrases', 'title', 'description'] },
                  },
                },
                { $limit: k * 2 },
              ],
            },
          },
          combination: { weights: { semantic: 0.6, phrases: 0.4 } },
        },
      },
      { $limit: k },
      { $project: { _id: 0, id: 1, family: 1, title: 1, description: 1, phrases: 1, source: 1 } },
    ])
    .toArray();
}
