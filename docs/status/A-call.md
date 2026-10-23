# A. The call

Owner: call slice on `The-call`
Owns: `app/call/**`, `app/api/live-token/**`, `lib/screener-prompt.ts`

## Done

- Implemented the integrated `/call` live conversation: microphone AudioWorklet, PCM streaming, queued AI playback, interruption handling, timer, red hang-up button, and a 45-second limit.
- Token route issues one-use, short-lived Gemini Live tokens with server-locked model, screener instructions, voice and both transcription streams. Creates the existing unused database call session; rejects cross-origin requests and does not cache tokens.
- Uses the verified `v1alpha` constrained WebSocket and REST wire formats emitted by Google's SDK, without changing shared dependencies or contracts.
- Caller/assistant transcripts stay in memory until hang-up. Final fragments get a bounded drain period; submission is guarded against duplicate hang-ups. Silent calls are rejected. No caller/model numbers, URLs or transcript text appear on the call page.
- Assistant closing, disconnect and manual hang-up enter the same submission path. UI reports success only after a valid saved CallRecord response. Failure and cancellation release microphone/audio resources.
- Preserved explicit recorded-message fallback via `/api/transcribe`; `DEMO_FALLBACK=1` also selects it server-side. The fallback posts only the caller transcript, without inventing assistant speech.
- Installed Node 24 and pnpm 9.15.9 in a temporary local toolchain, without changing the user's global tools.
- Validation: typecheck and lint pass; 19 tests pass, including token restrictions, session creation, audio encoding, transcript limits, silence, late fragments and hang-up cleanup.
- Production build passes with `pnpm build --webpack`. Browser production assets were scanned: the saved API key is absent.
- Real integrated smoke tests passed: token issuance, Gemini voice output and assistant transcription, nonempty synthetic GP audio input and caller transcription, transcript save, rejection of a second submission with the same session ID, and recorded fallback session issuance.
- Synthetic courier, GP and instruction-injection responses each passed a smoke check for no safety endorsement, number or URL. These are single API runs, not stage-phone acceptance runs.
- Call page reviewed in Chrome. Local app runs at `http://localhost:3000/call`, using a temporary local MongoDB.

## Doing

- Stage-phone HTTPS testing and the three consecutive full deployed demo runs remain outstanding. Slice A is implemented but has not met the complete acceptance criteria.

## Next

- Test actual microphone permission, speaker audibility, interruption, denied permission, hang-up and repeat calls on the stage phone over HTTPS.
- Integrate slice B's real transcription/analysis and slice D's demo scripts, then run all three scenarios three times on the deployed app.
- Run the default verification script in an environment where the Turbopack worker can bind its local port.

## Needs from others

- Slice B: `lib/transcribe.ts` and `lib/analyse.ts` are still canned placeholders in this checkout. Recorded-message fallback and warning-card classifications are not yet real analysis.
- Deployment/stage-phone access for acceptance testing. The local URL is laptop-only; the phone needs HTTPS.
- Default `scripts/verify.sh` reports NOT READY because Turbopack fails with `binding to a port / Operation not permitted`, including when retried with elevated execution. Typecheck, lint, tests and secret scan pass; the separate webpack production build passes. No shared build settings were changed.
- Notion source page was inaccessible; implementation follows the checked-in SPEC.md and call brief.

## Contract change requests

None. Existing `LiveToken` null fields support the recorded-message fallback. Existing `/api/calls` owns single-use consumption and persistence.
