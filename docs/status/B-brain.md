# B. The brain

Owner: Josh Lim
Owns: `lib/analyse.ts`, `lib/patterns.ts`, `lib/transcribe.ts`, `lib/rules.ts` (new), `lib/gemini.ts` (new), `data/**`, `scripts/seed-patterns.ts`, `lib/*.test.ts`

## Done
- Added `@google/genai` to package.json (A needs it too).
- Branch `slice/b-brain` created.

## Doing
- Scam pattern library in `data/patterns/`.

## Next
- Argon/audio/Atlas probes: waiting on GEMINI_API_KEY and an Atlas cluster (M10, MongoDB 8.x).
- Rules, Atlas hybrid search, Argon analysis, transcribe, DEMO_FALLBACK.

## Needs from others
- **A:** please prefix each turn in the posted transcript with `Caller:` or `Assistant:` on its own line. The brain only treats the caller's words as evidence, so the screener's own questions never turn into "quoted phrases".
- **D:** keep the stage dialogue in line with the `demo-*` cases in `data/test-cases.json`, or send me changes, so the rehearsed results match.
- **Owen:** `package.json` now has `@google/genai`. `lib/rules.ts` and `lib/gemini.ts` are new B-owned files.
- **Owen:** on Windows, Git's default `core.autocrlf=true` checks files out with CRLF and `pnpm lint` (Biome) then fails on every file. Please add a `.gitattributes` with `* text=auto eol=lf`.

## Contract change requests
- None.
