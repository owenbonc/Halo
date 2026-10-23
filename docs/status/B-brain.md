# B. The brain

Owner: Josh Lim
Owns: `lib/analyse.ts`, `lib/patterns.ts`, `lib/transcribe.ts`, `lib/rules.ts` (new), `lib/gemini.ts` (new), `data/**`, `scripts/seed-patterns.ts`, `lib/*.test.ts`

## Done
- Added `@google/genai` to package.json (A needs it too).
- Branch `slice/b-brain` created.
- Scam pattern library: 30 synthetic UK patterns in `data/patterns/` (courier, police, bank, remote access, investment), schema-checked by `lib/patterns.test.ts`.
- Rules (`lib/rules.ts`): fixed band rules, a word-rule floor the model can't lower, number/URL scrubbing, verbatim-cue check; behaviour tests in `lib/rules.test.ts`.
- `findPatterns`: one `$rankFusion` query fusing Atlas Vector Search (Automated Embedding, `voyage-4`) and Atlas Search; `pnpm seed:patterns` loads the patterns, builds both indexes and runs a smoke query. Not yet run against Atlas (no cluster yet).

## Doing
- Argon analysis (`lib/analyse.ts`).

## Next
- Argon/audio/Atlas probes: waiting on GEMINI_API_KEY and an Atlas cluster (M10, MongoDB 8.x).
- Rules, Atlas hybrid search, Argon analysis, transcribe, DEMO_FALLBACK.

## Needs from others
- **A:** please prefix each turn in the posted transcript with `Caller:` or `Assistant:` on its own line. The brain only treats the caller's words as evidence, so the screener's own questions never turn into "quoted phrases".
- **D:** keep the stage dialogue in line with the `demo-*` cases in `data/test-cases.json`, or send me changes, so the rehearsed results match.
- **Owen:** `package.json` now has `@google/genai`. `lib/rules.ts` and `lib/gemini.ts` are new B-owned files.
- **Owen:** on Windows, Git's default `core.autocrlf=true` checks files out with CRLF and `pnpm lint` (Biome) then fails on every file. Please add a `.gitattributes` with `* text=auto eol=lf`.
- **Owen:** Biome formats YAML, but `pnpm install` rewrites `pnpm-lock.yaml` in its own style, so lint fails after every dependency change. Please add `"!**/pnpm-lock.yaml"` to `files.includes` in biome.json. Until then I format the lockfile with Biome after installs.

## Contract change requests
- None.
