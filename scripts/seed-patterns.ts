// Loads data/patterns into Atlas and builds the hybrid-search indexes (pnpm seed:patterns).
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { closeDb, collections } from '../lib/db';
import {
  EMBED_MODEL,
  findPatterns,
  PatternFile,
  patternText,
  TEXT_INDEX,
  VECTOR_INDEX,
} from '../lib/patterns';

const dir = path.join(import.meta.dirname, '..', 'data', 'patterns');
const files = (await readdir(dir)).filter((file) => file.endsWith('.json')).sort();
const docs = await Promise.all(
  files.map(async (file) => {
    const pattern = PatternFile.parse(JSON.parse(await readFile(path.join(dir, file), 'utf8')));
    return { ...pattern, text: patternText(pattern) };
  }),
);

const { patterns } = await collections();
await patterns.deleteMany({});
await patterns.insertMany(docs);
console.log(`Loaded ${docs.length} patterns.`);

const wanted = [
  {
    name: VECTOR_INDEX,
    type: 'vectorSearch',
    definition: {
      fields: [{ type: 'autoEmbed', modality: 'text', path: 'text', model: EMBED_MODEL }],
    },
  },
  {
    name: TEXT_INDEX,
    type: 'search',
    definition: {
      mappings: {
        dynamic: false,
        fields: {
          title: { type: 'string', analyzer: 'lucene.english' },
          description: { type: 'string', analyzer: 'lucene.english' },
          phrases: { type: 'string', analyzer: 'lucene.english' },
        },
      },
    },
  },
] as const;

const existing = new Set((await patterns.listSearchIndexes().toArray()).map((index) => index.name));
for (const index of wanted) {
  if (existing.has(index.name)) await patterns.updateSearchIndex(index.name, index.definition);
  else await patterns.createSearchIndex(index);
}

// Atlas builds indexes in the background; wait so the smoke query below means something.
for (let tries = 0; ; tries++) {
  // The driver types index rows as {name} only; Atlas also returns `queryable`.
  const states = (await patterns.listSearchIndexes().toArray()) as {
    name: string;
    queryable: boolean;
  }[];
  if (wanted.every((index) => states.find((state) => state.name === index.name)?.queryable)) break;
  if (tries === 60)
    throw new Error('Search indexes not queryable after 5 minutes; check the Atlas UI.');
  await new Promise((resolve) => setTimeout(resolve, 5_000));
}

const sample = await findPatterns(
  'A police officer said a courier will collect my cash and not to tell my family.',
  3,
);
console.log('Smoke query:', sample.map((p) => `${p.id} (${p.family})`).join(', '));
await closeDb();
