# B. The brain

Owner: Josh Lim
Owns: `lib/analyse.ts`, `lib/patterns.ts`, `lib/transcribe.ts`, `lib/rules.ts` (new), `lib/gemini.ts` (new), `data/**`, `scripts/seed-patterns.ts`, `lib/*.test.ts`

## Done
- Added `@google/genai` to package.json (A needs it too).
- Branch `slice/b-brain` created.
- Scam pattern library: 30 synthetic UK patterns in `data/patterns/` (courier, police, bank, remote access, investment), schema-checked by `lib/patterns.test.ts`.
- Rules (`lib/rules.ts`): fixed band rules, a word-rule floor the model can't lower, number/URL scrubbing, verbatim-cue check; behaviour tests in `lib/rules.test.ts`.
- `findPatterns`: one `$rankFusion` query fusing Atlas Vector Search (Automated Embedding, `voyage-4`) and Atlas Search; `pnpm seed:patterns` loads the patterns, builds both indexes and runs a smoke query.
- `pnpm seed:patterns` ran on my own Atlas cluster (24 Oct): 30 patterns loaded, both indexes built, and the courier smoke query returned three courier patterns. Automated Embedding works there. Still to run on the team cluster `cluster0.revh6w` once Owen invites me.
- `analyse`: retrieve (Atlas) → judge (Argon, structured JSON, transcript fenced as untrusted data) → decide (fixed rules). Falls back to word rules if Argon or Atlas fails. Not yet run live (no keys).
- 15 synthetic test cases (`data/test-cases.json`) with an offline sweep (never green, never a number when Argon is down) and a three-run live eval (`RUN_LIVE_EVAL=1 pnpm vitest run lib/analyse.eval.test.ts`), not yet run (no keys).
- `transcribe`: Gemini Flash, inline audio, browser MIME parameters stripped. Not yet run live (no keys).
- Merged main (24 Oct) and did the handover's B items:
  - Summaries never carry a digit or a link: every summary, green included, goes through `scrub()`. Tested.
  - Screened calls drop `different_phone` from the steps, since she never picked up. Voice notes keep it.
  - A green summary now says what the call was about (Argon is asked for it). If Argon's line is empty, claims the call is safe, or talks about warning signs, it falls back to "The caller didn't ask for money, bank details or access to a device." It never repeats the card title.

## Doing
- Brain PR open for A to review. Josh is handing the live steps to a teammate (see "Handover" below).

## Blocked
- **Gemini billing (24 Oct, 14:12).** Two different keys (an `AQ.` key and an `AIza` key) both get `429 RESOURCE_EXHAUSTED: Your billing account has exceeded its monthly spending cap` on `gemini-4-argon` and `gemini-3.8-flash`. The keys are valid (a bad key gives 401/403); the billing account behind them is capped. Raising the cap or linking the event credits didn't clear it yet. Check in AI Studio which project each key belongs to and that the project's billing account holds the DeepMind credits with a cap above this month's spend.

## Handover (for whoever picks up B)
1. `git checkout slice/b-brain && git pull`, `pnpm install`, `git config core.hooksPath .githooks`.
2. `cp .env.example .env` and fill in your **own** values. Never share them in chat, the repo or an AI conversation.
   - `MONGODB_URI`: Atlas, Drivers, Node.js connection string, with the real password in place of `<db_password>`. Your IP must be in Network Access.
   - `GEMINI_API_KEY`: from AI Studio, on a project whose billing has the event credits.
3. Check Gemini with two tiny calls before spending credits:
   `pnpm tsx --env-file=.env -e "import('./lib/gemini').then(async ({ gemini, ANALYSIS_MODEL, TRANSCRIBE_MODEL }) => { for (const model of [ANALYSIS_MODEL, TRANSCRIBE_MODEL]) console.log(model, (await gemini().models.generateContent({ model, contents: 'Reply with: ok' })).text) })"`
4. Once both reply, run the live eval (45 Argon calls plus Atlas): `RUN_LIVE_EVAL=1 pnpm vitest run lib/analyse.eval.test.ts`. A failing case means a band or family outside what `data/test-cases.json` allows, or a digit in the output. Fix the rules or the prompt, not the case, unless the case is wrong.
5. Run `pnpm seed:patterns` on the team cluster `cluster0.revh6w` (needs Owen's Atlas invite).

## Next
- Live: Gemini probe, three-run live eval, `transcribe` check on WAV and browser audio.
- `pnpm seed:patterns` on the team cluster.
- `DEMO_FALLBACK=1`: record `data/demo-fallback.json` from live runs of the three demo scripts.

## Needs from others
- **A (keeper):** this branch changes `analyse(transcript)` to `analyse(transcript, source)`. That is one line in `lib/calls.ts` and the contract line in `SPEC.md`, both yours, so please check them in the PR. The Notion spec needs the same line.
- **A (keeper):** `app/api/transcribe` still doesn't catch errors from `transcribe()`, so a Gemini quota or network failure returns a bare 500. Please wrap it and return `fail(502, "I couldn't hear that. Try again, or call 159.")`. (C already did this for `/api/voice-note`.)
- **C or design:** the Grandma card only shows `analysis.summary` on warning cards. A green card could now show it too ("Her GP surgery called about her flu jab"), since it no longer repeats the title.
- **D:** keep the stage dialogue in line with the `demo-*` cases in `data/test-cases.json`, or send me changes, so the rehearsed results match.
- **Team question:** screened strong calls on the remote-access family still include `hang_up` ("You don't have to stay on the line"). She never picked up, so it may be worth dropping too.

## Contract change requests
- `analyse(transcript: string, source: "screener" | "voice_note")` (SPEC "Interfaces"). No change to `lib/types.ts`.
