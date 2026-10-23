# B. The brain

Owner: Josh Lim
Owns: `lib/analyse.ts`, `lib/patterns.ts`, `lib/transcribe.ts`, `lib/rules.ts` (new), `lib/gemini.ts` (new), `data/**`, `scripts/seed-patterns.ts`, `lib/*.test.ts`

## Done
- Added `@google/genai` to package.json (A needs it too).
- Branch `slice/b-brain` created.
- Scam pattern library: 30 synthetic UK patterns in `data/patterns/` (courier, police, bank, remote access, investment), schema-checked by `lib/patterns.test.ts`.
- Rules (`lib/rules.ts`): fixed band rules, a word-rule floor the model can't lower, number/URL scrubbing, verbatim-cue check; behaviour tests in `lib/rules.test.ts`.
- `findPatterns`: one `$rankFusion` query fusing Atlas Vector Search (Automated Embedding, `voyage-4`) and Atlas Search; `pnpm seed:patterns` loads the patterns, builds both indexes and runs a smoke query. Not yet run against Atlas (no cluster yet).
- `analyse`: retrieve (Atlas) → judge (Argon, structured JSON, transcript fenced as untrusted data) → decide (fixed rules). Falls back to word rules if Argon or Atlas fails. Not yet run live (no keys).
- 15 synthetic test cases (`data/test-cases.json`) with an offline sweep (never green, never a number when Argon is down) and a three-run live eval (`RUN_LIVE_EVAL=1 pnpm vitest run lib/analyse.eval.test.ts`), not yet run (no keys).
- `transcribe`: Gemini Flash, inline audio, browser MIME parameters stripped. Not yet run live (no keys).

## Doing
- Waiting on GEMINI_API_KEY and an Atlas cluster to run the live steps.

## Next
- Live: Argon/audio probes, `pnpm seed:patterns`, Argon smoke test, three-run live eval, `transcribe` check on WAV and browser audio.
- `DEMO_FALLBACK=1`: record `data/demo-fallback.json` from live runs of the three demo scripts.

## Needs from others
- **A:** please prefix each turn in the posted transcript with `Caller:` or `Assistant:` on its own line. The brain only treats the caller's words as evidence, so the screener's own questions never turn into "quoted phrases".
- **D:** keep the stage dialogue in line with the `demo-*` cases in `data/test-cases.json`, or send me changes, so the rehearsed results match.
- **Owen:** `package.json` now has `@google/genai`. `lib/rules.ts` and `lib/gemini.ts` are new B-owned files.
- **Owen:** on Windows, Git's default `core.autocrlf=true` checks files out with CRLF and `pnpm lint` (Biome) then fails on every file. Please add a `.gitattributes` with `* text=auto eol=lf`.
- **Owen:** Biome formats YAML, but `pnpm install` rewrites `pnpm-lock.yaml` in its own style, so lint fails after every dependency change. Please add `"!**/pnpm-lock.yaml"` to `files.includes` in biome.json. Until then I format the lockfile with Biome after installs.
- **A and C:** `transcribe()` now calls Gemini, and `app/api/transcribe` and `app/api/voice-note` don't catch its errors, so a quota or network failure returns a bare 500. Please wrap the call and return `fail(502, "I couldn't hear that. Try again, or call 159.")`. (`analyse()` never throws on a Gemini failure; it falls back to word rules.)

## Contract change requests
- None.
