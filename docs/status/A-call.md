# A. The call

Owner: call slice on `The-call`
Owns: `app/call/**`, `app/api/live-token/**`, `lib/screener-prompt.ts`. Saturday keeper scope from `docs/HANDOVER.md`: shared routes and database integration. Public `lib/types.ts` remains unchanged.

## Done

- M3 usability: green-call summaries now appear on the Read it to me screen and in its spoken script, with the uncertainty caveat retained. Browser speech is guarded for missing support, synchronous failures and denied playback; a visible error leaves the text and retry button usable. Stop, replacement and navigation suppress late speech callbacks.
- Keeper/C-open cleanup: Call 159 dial destinations and labels come from `lib/guidance.ts` in both help and escalation screens. Removed unused band emoji/colour fields and the unused legacy `speak()` helper. The recorder used by voice notes and the Kokoro call clips are unchanged.
- M3 checks: 84 targeted tests pass and full `scripts/verify.sh` prints READY. Actual production-build browser checks on isolated local data covered a synthetic green summary/caveat, speech completion/replay/Stop, and both `tel:159` link destinations without placing a call. These are UI fixtures inserted only into a temporary local database, not live/captured model responses or a deployed fallback. Visual review at the standard phone-frame size found no clipping or overlap.
- Synced `origin/main` at `a20d3f9` after Owen merged B/D. This changes ancestry only; main is not pushed from this branch.

- Integrated B finish `04cfb58` and D `fdfa29d` into `The-call` without conflicts. B adds the shared destination scrubber, transcription tests and Atlas readiness checks; D adds alert arrival/chime controls and demo material. B/D were subsequently merged into main by Owen; this branch has synced that history without pushing main.
- Shared reliability fixes: transcription failures return a plain 502; a failed initial MongoDB connection is cleared and can reconnect on the next request; call submission atomically rejects sessions older than five minutes or dated in the future; caller labels are assigned server-side so caller-provided destinations cannot reach cards. Submission failures remain explicitly uncertain; no automatic retry or fabricated receipt.
- Integration validation: 73 targeted tests passed, and full `scripts/verify.sh` printed READY after regenerating duplicated Next.js cache files. No build configuration or public API shape changed.
- Exercised the actual production build against isolated local MongoDB with synthetic transcripts and the existing degraded word rules: courier and trick produce strong cards, GP remains amber with no alert while Argon is unavailable, automatic alerts arrive, a caretaker browser moves from History to Alerts, acknowledgement persists, paused/manual-consent behavior holds, caretaker responses omit transcripts/cues, replay and expired/future sessions fail, and transcript display removes caller numbers. Gemini and Atlas were deliberately unavailable in this local check: this is database/UI integration evidence, not live AI or deployed acceptance.
- The Notion source was inaccessible from this session; the fetched repository SPEC, DESIGN, HANDOVER and all four status files were reviewed. No product-spec changes were invented.

- Codex with ChatGPT independently reviewed the code and execution outputs in two iterations and accepted this local milestone. Review corrections preserve the first terminal outcome against late malformed messages and cover delayed/late recorder events. Live end-to-end acceptance remains blocked on provider billing; the user has requested a draft PR for review.

- Call-flow reliability milestone: unexpected WebSocket closure/error, provider go-away and audio backpressure stop capture immediately and reject partial calls before submission. Deliberate hang-up and completed Kokoro closing still drain final transcript fragments and may submit normally.
- Recorded messages collect timed chunks, enforce the shared 10 MiB audio-blob ceiling before upload, release the microphone on failure, and reject stalled finalisation after five seconds. Cancellation settles pending recording work; no oversized recording reaches transcription.
- Submission is a tested plain module: only a finished, valid transcript can be posted; a valid server receipt is required for success. Failed/malformed delivery responses remain uncertain and are never automatically retried.
- Validation for this milestone: 49 targeted call tests passed, then full `scripts/verify.sh` printed READY. Browser checks on the real local app covered production calling-disabled failure, a repeat attempt, explicit recorded-message setup, and cancellation back to ready. No personal microphone audio was captured. These local checks do not establish deployed/physical-phone or live-provider acceptance.

- PR #7 is merged. Pulled main through `82f32f8`: shared phone frame, Halo setup/Alerts screens, real B transcription/analysis, and the `recordedFixture` contract are integrated.
- `/call` now uses DESIGN semantic colours and shared Button controls, including the red hang-up exception and 48px radio-label targets. The root layout already pads with `var(--safe-top)` / `var(--safe-bottom)`; no duplicate inset or window scrolling. Checked the actual phone-frame UI, speaker control, recorded prompt and cancellation in Chrome.
- Name-free opening regenerated with Kokoro (`bf_emma`, 4.01 seconds), with matching locked prompt and clip text. Call-page wording no longer assumes the recipient is named Grandma.
- Full `scripts/verify.sh` prints READY (24 Oct): typecheck, lint, tests, production build and history secret scan. Stale generated route types were cleared and regenerated; no shared build configuration changed. Independent review found no substantive regression in this diff.

- Integrated live Gemini calls: microphone AudioWorklet, PCM audio, input/output transcription, 45-second limit, manual/assistant hang-up and guarded transcript submission.
- Independent security/usability review completed, followed by fixes and a second review. Verdict: suitable for further controlled synthetic-demo testing, not unrestricted public or real-user deployment.
- Token issuance now requires `CALL_DEMO_ACCESS_CODE` in production (at least 16 characters); missing/short configuration fails closed. The code is checked server-side before provider/database work and is held only in browser memory. Origin checking remains a CSRF layer, not the authentication mechanism.
- Durable atomic MongoDB budgets limit issuance to 6 attempts/minute and 60/hour globally, including fallback. TTL-indexed budget documents expire; rate-limited responses include the actual retry interval. Tested with 20 concurrent database requests: exactly 6 admitted.
- Live token lifetime reduced to 2 minutes, one use, with a 1-minute new-session window. Model, voice, instructions and both transcriptions remain locked server-side. Credentials are never included in browser assets.
- Fixed capture-after-finish startup race, cancellation of requests/body parsing, stalled response bodies, stale Blob callbacks, old speaking/listening timers, and browser back-navigation state restoration. Disposal is idempotent.
- Replaced browser reliance on `AbortSignal.timeout` with a bounded AbortController request helper. Explicit capability checks explain unsupported microphone, AudioWorklet and MediaRecorder paths; no deprecated ScriptProcessor implementation was added.
- Recorded messages require a separate recording tap after the visible question. Optional read-aloud is initiated directly by a user tap. Since B now supplies real transcription, live and recorded token responses set `recordedFixture: false`; obsolete preset-result messaging and the readiness environment flag are removed. Behaviour tests cover explicit recorded mode and forced recorded mode.
- Call UI now includes microphone mute, assistant volume, speaking/listening status, a gentle two-tone speaker test, readable failures, wrapped mobile controls, and pre-call audio/transcript privacy information.
- Live screening now uses three bundled clips generated locally with open-source/open-weight Kokoro-82M, British voice `bf_emma` at speed 0.98. The user explicitly selected fixed lines without an extra server. UI discloses prerecorded questions. Gemini still handles live caller audio and turn selection; its generated audio is discarded (but remains billable). No new deployed dependency or inference server. Reproduction instructions and model hashes are in `app/call/voice/README.md`; licenses are included.
- Client allows only the exact opening, optional fixed follow-up and closing, in order. Unexpected model wording fails closed. Canonical assistant text enters the transcript only after its Kokoro clip completes; cancelled clips are omitted.
- Questions cannot be cut off by incidental sounds: server uses NO_INTERRUPTION and low speech-detection sensitivity; microphone processing/transmission pause during response generation and playback. UI says when the microphone is paused. Intentional voice interruption is unavailable; wait for Listening. Generation tags discard stale microphone frames.
- Fixed late-transcription handling with fragment-driven completion and a bounded deadline, including empty noise turns. Moved the incompatible worklet to `/call/microphone` and disabled stale caching. Independent review findings were addressed.
- Adapted the 100 ms initial buffering and gain scheduling approach from Google's Apache-2.0 Live API Web Console. Added a bounded 15-second queue and short interruption fades. Attribution/change notice are in `app/call/audio-player.ts`; full upstream license is in `app/call/licenses/google-audio.txt`. No new package dependency or voice server was introduced.
- Reviewed Pipecat as an alternative. Its Gemini starter introduces a Python server and WebRTC transport; that is a larger architectural change than this browser-to-Gemini slice warrants during the event.
- Validation: automated tests cover credentials, rate windows, PCM, transcript limits, startup races, late fragments, silence, cancellation, stalled bodies, fallback errors, audio scheduling, fixed-line sequence, real bundled audio, completed-vs-cancelled speech, capture gating and stale frames. Typecheck, lint and webpack production build pass.
- Actual LiveCall controller exercised against real Gemini with synthetic caller audio and bundled Kokoro clips: transcript saved successfully. 216 synthetic noise frames injected during protected playback, 50 caller frames sent while listening. AudioContext playback timing was simulated; physical phone testing is still needed.
- Production dependency audit reports no known vulnerabilities. This is an advisory check, not proof of application security.
- Chrome UI reviewed in the laptop phone frame. Speaker test, recorded prompt and cancellation exercised without collecting personal microphone audio.

## Doing

- Draft PR handoff: synced main through `20ad174`, retaining A/keeper/C-open changes only. The PR makes call failure handling, bounded recording, shared-route reliability and complete summary reading available for review. Owen merges; no direct push to main. The `recordedFixture` contract is already present, so no new `lib/types.ts` change is requested.

- Codex with ChatGPT independently accepted the merged local integration milestone after reviewing the diff, merged implementation and all four execution records. The user explicitly requested a draft PR for review. Ready-for-merge status and full live-demo certification remain gated on real end-to-end evidence. Current key was retried at the user’s request: both Argon and Flash still report the monthly spending cap. Both required models remain capped on the latest retry. The user is arranging billing/a working local key and confirmed Owen will configure production; Vercel access here stops at its login screen. Prior live-controller check minted a token but disconnected with a billing error. No full live-demo or deployed acceptance is claimed.
- Codex with ChatGPT independently accepted M3 after inspecting the full diff and all three execution records. Actual stage-phone microphone/speaker testing and three consecutive deployed scenario runs remain outstanding.

## Next

- Deployed readiness probe (24 Oct): `/api/live-token?mode=recorded` returns 503, “Demo calling is not configured yet”, before any provider call. Set a random production `CALL_DEMO_ACCESS_CODE` (16+ characters) privately. Do not put it in a `NEXT_PUBLIC_` variable. Without it, production calls intentionally return 503. Configure provider spending limits and deployment access protection for the entire demo.
- Verify real recorded transcription with the event account. B reports its billing account exceeded its monthly cap; provider availability is still a demo blocker. `DEMO_FALLBACK=1` currently forces recorded input but does not supply recorded analysis fixtures.
- Test physical phone permissions, Kokoro audibility, turn-taking, mute, cancellation, background/back navigation, delayed transcription and repeat calls over HTTPS.
- Run all three synthetic scenarios three times on the deployed build after shared blockers are fixed.

## Needs from others

- **P1 shared API protection:** `/api/transcribe`, `/api/calls`, `/api/settings` and alert routes need the shared owner's access-control review. Token gating does not secure those routes. Main now includes slice C’s voice-note size/rate guard; its in-memory limit and access control still need review before real users. Authenticate/rate-limit billable transcription and bound uploads before buffering.
- **P1 submission recovery:** `/api/calls` consumes the session before analysis/save. A transient failure can lose the submission; an alert failure after save can make delivery appear to fail. Implement idempotent receipt/recovery and separate notification failures from persistence. Client deliberately does not blindly retry.
- **P1 transcription protection:** controlled 502 responses now work. Authentication/rate limits and request-size enforcement before buffering remain unresolved; live provider verification and captured-response fallback remain outstanding.
- **P2 retention/privacy:** sessions now expire on consumption after five minutes. Define transcript/session retention and shared-route access before real users; this demo must use synthetic data only.
- Spoken responses are now deterministically restricted to the three bundled questions/closing. This does not validate caller truthfulness or shared analysis, and does not make the entire application safe for real callers.
- Stage-phone and HTTPS deployment access are still needed for final acceptance. Local full verification is READY; physical microphone/speaker checks and three deployed scenario runs remain outstanding.
- The saved event API key was previously pasted into chat; rotation remains recommended before a public deployment. No credential value appears in tracked files.

## Contract change requests

- `recordedFixture: boolean` is already in `lib/types.ts`; no outstanding A type change for this step. It remains false while recorded messages use real transcription.
- Shared keeper: idempotent submission lifecycle and authenticated/bounded transcription as described above. Session expiry is implemented without a public type change.
- B/D script alignment: the current opening is “Hello, you've reached a call assistant. Who's calling, and what's it about?” and follow-up is “Could you tell me a little more about why you're calling?” Update owned demo/test scripts to match; current scripted caller turns remain unchanged.
- Deployment owner: B reports the seeded target is now `cluster0.lhbq6vr.mongodb.net` / `hangup`, while HANDOVER and D still name the old cluster. Confirm the production URI targets the seeded cluster; never commit its credentials.

## Research references

- Google Live API Web Console: https://github.com/google-gemini/live-api-web-console (Apache-2.0; only the small audio buffering/gain approach was adapted).
- Pipecat: https://github.com/pipecat-ai/pipecat and its Gemini starter https://github.com/pipecat-ai/pipecat-examples/tree/main/gemini-live-starters/web-bot (evaluated, not added).
- Kokoro model: https://github.com/hexgrad/kokoro and https://huggingface.co/hexgrad/Kokoro-82M (Apache-2.0); generation runtime https://github.com/thewh1teagle/kokoro-onnx (MIT).
- Gemini activity settings: https://ai.google.dev/api/live
