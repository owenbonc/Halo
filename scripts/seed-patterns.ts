// Loads data/patterns into Atlas and builds the hybrid-search indexes (pnpm seed:patterns).
import assert from 'node:assert/strict';
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
import { checkWriteTarget } from './write-target';

const dir = path.join(import.meta.dirname, '..', 'data', 'patterns');
const files = (await readdir(dir)).filter((file) => file.endsWith('.json')).sort();
const docs = await Promise.all(
  files.map(async (file) => {
    const pattern = PatternFile.parse(JSON.parse(await readFile(path.join(dir, file), 'utf8')));
    return { ...pattern, text: patternText(pattern) };
  }),
);
assert.equal(docs.length, 30, 'Expected the complete library of 30 synthetic patterns.');
assert.equal(new Set(docs.map((doc) => doc.id)).size, docs.length, 'Pattern ids must be unique.');
assert.ok(
  docs.every((doc) => doc.text.trim()),
  'Every pattern must have searchable text.',
);

console.log(
  'Pattern target:',
  checkWriteTarget(
    process.env.MONGODB_URI,
    process.env.MONGODB_DB ?? 'hangup',
    process.env.CONFIRM_DEMO_TARGET,
  ),
);
const { patterns } = await collections();
await patterns.deleteMany({});
await patterns.insertMany(docs);
assert.equal(await patterns.countDocuments({}), docs.length, 'Stored pattern count is wrong.');
assert.equal(
  await patterns.countDocuments({ text: { $type: 'string', $regex: '\\S' } }),
  docs.length,
  'Stored patterns must all have searchable text.',
);
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

// Queryable indexes can still lag newly seeded documents, so require a relevant search result too.
for (let tries = 0; ; tries++) {
  // The driver types index rows as {name} only; Atlas also returns `queryable`.
  const states = (await patterns.listSearchIndexes().toArray()) as {
    name: string;
    queryable: boolean;
    status: string;
  }[];
  if (
    wanted.every((index) =>
      states.some(
        (state) => state.name === index.name && state.queryable && state.status === 'READY',
      ),
    )
  ) {
    const sample = await findPatterns(
      'A police officer said a courier will collect my cash and not to tell my family.',
      3,
    );
    if (
      sample.some(
        (pattern) => pattern.family === 'courier' || pattern.family === 'police_impersonation',
      )
    ) {
      console.log('Smoke query:', sample.map((p) => `${p.id} (${p.family})`).join(', '));
      break;
    }
  }
  if (tries === 60)
    throw new Error('Search indexes did not serve a relevant result after 5 minutes; check Atlas.');
  await new Promise((resolve) => setTimeout(resolve, 5_000));
}

await closeDb();
