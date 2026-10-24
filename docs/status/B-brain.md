# B. The brain

Owner: Josh Lim; completion work on `slice/b-brain-finish`.
Owns: `lib/analyse.ts`, `lib/patterns.ts`, `lib/transcribe.ts`, `lib/rules.ts`, `lib/gemini.ts`, shared `lib/scrub.ts` cleanup, `data/**`, `scripts/seed-patterns.ts`, `lib/*.test.ts`.

## Done

- B's analysis, transcription, hybrid retrieval, fixed band rules, 30 schema-checked synthetic patterns and 15 evaluation cases are merged into main (`82f32f8`). The keeper's caller already passes `source` to `analyse()`.
- The finish branch is based on an authenticated HTTPS pull of current main. Node 24.11.1 / pnpm 9.15.9 frozen installation completed without manifest or lockfile changes. The original B baseline passed: 4 files, 61 tests.
- One shared scrubber protects summaries, verbatim cues and displayed transcripts. It removes typed and spoken destinations including `dot io`, `dot xyz` and `dot co dot uk`; duplicate rule-module code/tests are removed. Regressions cover full-width digits, spoken numbers, ordinary wording, repeated detection, summaries, cues and preserved transcript turns.
- The opt-in live evaluator forces `DEMO_FALLBACK=0` and rejects either Atlas or Argon degradation. A local negative probe with both credentials deliberately blank failed on the first case, as expected, without calling external services.
- The seed script checks 30 unique patterns before replacement, checks stored count and searchable text, and requires a relevant courier/police smoke-query result after both search indexes become queryable.
- Added transcription behavior tests for WAV and browser WebM/Opus MIME parameters, submitted audio, provider-error propagation, bounded output and silence. These mock the provider; they are not live audio acceptance.
- Current B verification: 5 test files / 87 tests passed; the 15 opt-in live cases are skipped by default. Full verification passes typecheck, lint, offline tests and the history secret scan. `pnpm exec next build --webpack` compiles all routes and passes TypeScript.
- The user approved shared demo target `cluster0.lhbq6vr.mongodb.net`, database `hangup`. This replaces the older handover target. Credentials stay in `.env`; the application uses URI credentials, not `MONGODB_API_KEY`.

## Doing

- Preparing checked B changes and precise A/C/D handoffs for review.
- Helping configure Atlas Network Access for this laptop before retrying the database ping and seed.

## Blocked

- **Atlas connectivity:** the configured hostname/database were checked before any write. DNS resolves three members, but ping and a read-only retry fail with `ReplicaSetNoPrimary`; every member reports `MongoNetworkError` / `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`. The user has instructions to add their current IP in Atlas and wait for Active. No seed or other database write was performed, and there is no new Atlas smoke-query evidence.
- **Default build:** `scripts/verify.sh` prints `NOT READY` because Turbopack's CSS worker reports `binding to a port: Operation not permitted`. The failure repeats with network access and a direct `pnpm build`; webpack production build passes. Shared build configuration is unchanged.

## Deferred at the user's request

- **Gemini billing:** the minimal `gemini-4-argon` probe returned `429 RESOURCE_EXHAUSTED` with the monthly spending-cap message. Further billable calls stopped. The user asked to ignore the unavailable Gemini key for now; Flash, the 45 live analysis runs and real WAV/WebM transcription are not verified.
- **Captured fallback:** no `data/demo-fallback.json` or runtime bypass is added because the agreed fixture must come from successful live police/courier runs. This depends on Gemini being restored; no placeholder is presented as captured output.

## Next

1. Once the current IP is Active, repeat sanitized Mongo ping and run `pnpm seed:patterns` against the approved `hangup` database. Require 30 stored patterns, non-empty search text, queryable `patterns_semantic` (Automated Embedding, `voyage-4`) and `patterns_phrases` (English text search), plus a relevant courier/police result.
2. After the Gemini cap is resolved, run both minimal model probes, then `RUN_LIVE_EVAL=1 pnpm vitest run lib/analyse.eval.test.ts --bail=1`: 15 cases, three runs each. Fix actual prompt/rule defects without weakening expected cases.
3. Exercise temporary synthetic WAV and browser-recorded WebM/Opus through `transcribe()` and normal analysis; do not commit recordings.
4. Capture the first valid police/courier analysis after its three runs pass. Store exactly `{ transcript, analysis }` in `data/demo-fallback.json`, parse once with Zod, and return independent copies only for screener calls under `DEMO_FALLBACK=1`. Test no provider calls and voice-note exclusion.
5. After A integrates the fixture transcript route, test complete recorded fallback with isolated local MongoDB and an empty Gemini key. After deployment, run all three scenarios three times across the app phones. Full verification must print READY before calling the slice done.

## Needs from others

- **A / keeper (`ish24cho`):** reproduce the default Turbopack worker failure and run unchanged `scripts/verify.sh` to READY in the merge environment. This branch does not modify shared build configuration, routes or `lib/types.ts`.
- **A / keeper:** once B's captured fixture exists, return its transcript from `/api/transcribe` when `DEMO_FALLBACK=1`, before calling Gemini. Preserve upload validation; return a plain `502` on normal transcription failure. Keep `recordedFixture=true` whenever fixed fallback is active, even if `CALL_RECORDED_TRANSCRIPTION_READY=1`.
- **A / keeper:** update the Notion source of truth to merged two-argument `analyse(transcript, source)` and the agreed one-scenario fallback. `SPEC.md` already contains the source argument. Shared access control, submission recovery and session expiry remain A's responsibilities.
- **C (`owenbonc`):** existing green summaries say what the call was about, but the read screen and read-aloud script still hide them. Display/read them when ready; B does not edit C's screens.
- **D:** exact stage wording is in `data/test-cases.json`: `demo-police-courier` (strong; police/courier), `demo-gp` (none; no alert), `demo-trick` (strong; no caller number/link shown). Use those caller turns. Atlas evidence and three-run live acceptance are pending connectivity/billing recovery.

## Contract change requests

- No public API shape or `lib/types.ts` changes in this branch.
