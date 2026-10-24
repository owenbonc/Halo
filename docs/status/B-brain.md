# B. The brain

Owner: Josh Lim; completion work on `slice/b-brain-finish`.
Owns: `lib/analyse.ts`, `lib/patterns.ts`, `lib/transcribe.ts`, `lib/rules.ts`, `lib/gemini.ts`, shared `lib/scrub.ts` cleanup, `data/**`, `scripts/seed-patterns.ts`, `lib/*.test.ts`.

## Done

- B's analysis, transcription, hybrid retrieval, fixed band rules, 30 schema-checked synthetic patterns and 15 evaluation cases are merged into main (`82f32f8`). The keeper's caller already passes `source` to `analyse()`.
- The finish branch is based on an authenticated HTTPS pull of current main. Node 24.11.1 / pnpm 9.15.9 frozen installation completed without manifest or lockfile changes. The original B baseline passed: 4 files, 61 tests.
- One shared scrubber protects summaries, verbatim cues and displayed transcripts. It removes typed and spoken destinations including `dot io`, `dot xyz` and `dot co dot uk`; duplicate rule-module code/tests are removed. Regressions cover full-width digits, spoken numbers, ordinary wording, repeated detection, summaries, cues and preserved transcript turns.
- The opt-in live evaluator forces `DEMO_FALLBACK=0` and rejects either Atlas or Argon degradation. A local negative probe with both credentials deliberately blank failed on the first case, as expected, without calling external services.
- The seed script checks 30 unique patterns before replacement, checks stored count and searchable text, and waits for both READY indexes and a relevant courier/police smoke result. Actual seeding exposed a propagation delay after indexes became queryable; bounded retries now handle it. Behavior tests cover recovery and the five-minute deadline.
- Added transcription behavior tests for WAV and browser WebM/Opus MIME parameters, submitted audio, provider-error propagation, bounded output and silence. These mock the provider; they are not live audio acceptance.
- Current B verification: 6 test files / 89 tests passed. Full repository offline suite: 18 files / 143 tests passed; the 15 opt-in live cases are skipped by default. Typecheck and lint pass with the readiness fix. The history secret scan passed on push; `pnpm exec next build --webpack` compiles all routes and passes TypeScript.
- GitHub CI ran unchanged `scripts/verify.sh` on final code commit `35267d7` and printed **READY**, including the default production build: https://github.com/owenbonc/grandma-s-phone/actions/runs/40104150178. Local Turbopack CSS-worker setup reports `binding to a port: Operation not permitted`; local webpack and CI default builds pass, so no shared build change is needed.
- Draft PR: https://github.com/owenbonc/grandma-s-phone/pull/12. A is tagged for review; C received the green-summary handoff on issue #4 and D received all three exact synthetic caller scripts plus evidence requirements on issue #5.
- The user approved shared demo target `cluster0.lhbq6vr.mongodb.net`, database `hangup`. This replaces the older handover target. Credentials stay in `.env`; the application uses URI credentials, not `MONGODB_API_KEY`.
- **Atlas acceptance passed after the user added the current IP:** ping succeeds; `pnpm seed:patterns` exits successfully; an independent read-back validates all 30 stored pattern schemas and all 30 searchable `text` fields. `patterns_semantic` is READY/queryable with Automated Embedding on `text` using `voyage-4`; `patterns_phrases` is READY/queryable with `lucene.english` on title, description and phrases.
- The successful seed smoke returned `courier-police-cash-collection`, `courier-foreign-currency`, and `police-ongoing-investigation-secrecy`. Independent read-back returned `courier-police-cash-collection`, `courier-foreign-currency`, and `courier-bank-card-collection`. Both are relevant courier/police retrievals. Only the synthetic `patterns` collection and its search indexes were changed; calls, alerts and settings were untouched.

## Doing

- PR #12 is merged. User-approved cross-slice security completion is on `security/demo-hardening`, based on authenticated HTTPS main `20ad174`; only this status file and no shared types are changed.
- Added server role sessions, one-time caretaker invitations/revocation, recipient isolation, consent snapshots, settings ETags, atomic call/alert/receipt persistence, upload and durable provider limits, recoverable submissions, recording cleanup, Unicode destination protection and guarded destructive scripts. See `docs/security.md` for contracts and deployment requirements.
- Security checkpoint: **21 files / 194 tests passed; 15 live cases skipped**. Typecheck, lint and the production webpack build pass. Security tests use an isolated local MongoDB replica set; no Atlas writes or Gemini calls. Browser review and unchanged full verification remain in progress.

## Deferred at the user's request

- **Gemini billing:** the minimal `gemini-4-argon` probe returned `429 RESOURCE_EXHAUSTED` with the monthly spending-cap message. Further billable calls stopped. The user asked to ignore the unavailable Gemini key for now; Flash, the 45 live analysis runs and real WAV/WebM transcription are not verified.
- **Captured fallback:** no `data/demo-fallback.json` or runtime bypass is added because the agreed fixture must come from successful live police/courier runs. This depends on Gemini being restored; no placeholder is presented as captured output.

## Next

1. A reviews the database/readiness checkpoint and checks the deployed app targets the same approved cluster/database; the older `docs/HANDOVER.md` hostname is stale relative to the user's confirmed target. D can show the stored documents, two READY indexes and matched patterns in Atlas.
2. After the Gemini cap is resolved, run both minimal model probes, then `RUN_LIVE_EVAL=1 pnpm vitest run lib/analyse.eval.test.ts --bail=1`: 15 cases, three runs each. Fix actual prompt/rule defects without weakening expected cases.
3. Exercise temporary synthetic WAV and browser-recorded WebM/Opus through `transcribe()` and normal analysis; do not commit recordings.
4. Capture the first valid police/courier analysis after its three runs pass. Store exactly `{ transcript, analysis }` in `data/demo-fallback.json`, parse once with Zod, and return independent copies only for screener calls under `DEMO_FALLBACK=1`. Test no provider calls and voice-note exclusion.
5. After A integrates the fixture transcript route, test complete recorded fallback with isolated local MongoDB and an empty Gemini key. After deployment, run all three scenarios three times across the app phones. CI verification is READY, but live acceptance is required before calling the whole slice done.

## Needs from others

- **A / keeper (`ish24cho`):** review draft PR #12; code CI is READY. Vercel's preview check asks for the branch author's project access. This branch does not modify shared build configuration, routes or `lib/types.ts`.
- **A / keeper:** confirm production uses `cluster0.lhbq6vr.mongodb.net` / `hangup` so A/C/D consume the seeded shared patterns. B does not change Vercel's environment variables.
- **A / keeper:** once B's captured fixture exists, return its transcript from `/api/transcribe` when `DEMO_FALLBACK=1`, before calling Gemini. Preserve upload validation; return a plain `502` on normal transcription failure. Keep `recordedFixture=true` whenever fixed fallback is active, even if `CALL_RECORDED_TRANSCRIPTION_READY=1`.
- **A / keeper:** update the Notion source of truth to merged two-argument `analyse(transcript, source)` and the agreed one-scenario fallback. `SPEC.md` already contains the source argument. Shared access control, submission recovery and session expiry remain A's responsibilities.
- **C (`owenbonc`):** existing green summaries say what the call was about, but the read screen and read-aloud script still hide them. Display/read them when ready; B does not edit C's screens.
- **D:** exact stage wording is in `data/test-cases.json`: `demo-police-courier` (strong; police/courier), `demo-gp` (none; no alert), `demo-trick` (strong; no caller number/link shown). Use those caller turns. Atlas evidence is verified above; three-run Gemini acceptance remains deferred.

## Contract change requests

- No public API shape or `lib/types.ts` changes in this branch.
