# A. The call

Owner: call slice on `The-call`
Owns: `app/call/**`, `app/api/live-token/**`, `lib/screener-prompt.ts`

## Done

- PR milestone: SPEC demo step 2, the simulated browser call from microphone through Gemini screening to transcript submission. Live caller speech and fixed Kokoro screening lines are implemented; downstream analysis is still slice B’s placeholder in this checkout.
- Merged `origin/main` (f44524e), read `DESIGN.md`, and checked the laptop phone frame. The shared root layout already pads `/call` with `var(--safe-top)` / `var(--safe-bottom)`; the call page adds no duplicate inset and uses no window scrolling. Colour/token migration is left to Owen as explicitly requested.
- Full `scripts/verify.sh` now prints READY on the merged branch, including the default Turbopack build. Stale generated route types from the pre-merge dev server were cleared and regenerated; no shared build configuration was changed.

- Integrated live Gemini calls: microphone AudioWorklet, PCM audio, input/output transcription, 45-second limit, manual/assistant hang-up and guarded transcript submission.
- Independent security/usability review completed, followed by fixes and a second review. Verdict: suitable for further controlled synthetic-demo testing, not unrestricted public or real-user deployment.
- Token issuance now requires `CALL_DEMO_ACCESS_CODE` in production (at least 16 characters); missing/short configuration fails closed. The code is checked server-side before provider/database work and is held only in browser memory. Origin checking remains a CSRF layer, not the authentication mechanism.
- Durable atomic MongoDB budgets limit issuance to 6 attempts/minute and 60/hour globally, including fallback. TTL-indexed budget documents expire; rate-limited responses include the actual retry interval. Tested with 20 concurrent database requests: exactly 6 admitted.
- Live token lifetime reduced to 2 minutes, one use, with a 1-minute new-session window. Model, voice, instructions and both transcriptions remain locked server-side. Credentials are never included in browser assets.
- Fixed capture-after-finish startup race, cancellation of requests/body parsing, stalled response bodies, stale Blob callbacks, old speaking/listening timers, and browser back-navigation state restoration. Disposal is idempotent.
- Replaced browser reliance on `AbortSignal.timeout` with a bounded AbortController request helper. Explicit capability checks explain unsupported microphone, AudioWorklet and MediaRecorder paths; no deprecated ScriptProcessor implementation was added.
- Recorded fallback requires a separate recording tap after the visible question. Optional read-aloud is initiated directly by a user tap. Until `CALL_RECORDED_TRANSCRIPTION_READY=1`, a prominent warning explains that the recording produces a preset sample scam result; completion is also labelled as a sample.
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
- Chrome UI reviewed at a 390-pixel phone viewport. Speaker test, explicit sample disclosure and cancellation exercised without collecting personal microphone audio.

## Doing

- Actual stage-phone microphone/speaker testing and three consecutive deployed scenario runs remain outstanding.

## Next

- Set a random production `CALL_DEMO_ACCESS_CODE` (16+ characters) privately. Do not put it in a `NEXT_PUBLIC_` variable. Without it, production calls intentionally return 503. Configure provider spending limits and deployment access protection for the entire demo.
- Only set `CALL_RECORDED_TRANSCRIPTION_READY=1` after slice B's real transcription is integrated and validated. The current checkout's transcription is a fixture.
- Test physical phone permissions, Kokoro audibility, turn-taking, mute, cancellation, background/back navigation, delayed transcription and repeat calls over HTTPS.
- Run all three synthetic scenarios three times on the deployed build after shared blockers are fixed.

## Needs from others

- **P1 shared API protection:** `/api/transcribe`, `/api/calls`, `/api/settings` and alert routes need the shared owner's access-control review. Token gating does not secure those routes. Main now includes slice C’s voice-note size/rate guard; its in-memory limit and access control still need review before real users. Authenticate/rate-limit billable transcription and bound uploads before buffering.
- **P1 submission recovery:** `/api/calls` consumes the session before analysis/save. A transient failure can lose the submission; an alert failure after save can make delivery appear to fail. Implement idempotent receipt/recovery and separate notification failures from persistence. Client deliberately does not blindly retry.
- **P1 truthfulness/analysis:** slice B's transcription and analysis are still placeholders here. A's recorded sample disclosure is explicit, but it is not a working real-transcription fallback.
- **P2 expiry/privacy:** enforce call-session expiry on consumption and define transcript retention/access. Session records currently have no expiry check. This demo must use synthetic data only.
- Spoken responses are now deterministically restricted to the three bundled questions/closing. This does not validate caller truthfulness or shared analysis, and does not make the entire application safe for real callers.
- Stage-phone and HTTPS deployment access are still needed for final acceptance. Local full verification is READY; physical microphone/speaker checks and three deployed scenario runs remain outstanding.
- The saved event API key was previously pasted into chat; rotation remains recommended before a public deployment. No credential value appears in tracked files.

## Contract change requests

- Keeper request for this PR: add `recordedFixture: boolean` to `LiveToken` in `lib/types.ts`. It is true only for recorded/fallback mode while `CALL_RECORDED_TRANSCRIPTION_READY` is not `1`; live mode and validated real transcription return false. The API sends it and the slice-local schema requires it. Existing nullable token/model fields are unchanged. Owen requested this contract change in the same merge; this branch does not edit the keeper-owned file.
- Shared keeper: idempotent submission lifecycle, session expiry, and authenticated/bounded transcription as described above.

## Research references

- Google Live API Web Console: https://github.com/google-gemini/live-api-web-console (Apache-2.0; only the small audio buffering/gain approach was adapted).
- Pipecat: https://github.com/pipecat-ai/pipecat and its Gemini starter https://github.com/pipecat-ai/pipecat-examples/tree/main/gemini-live-starters/web-bot (evaluated, not added).
- Kokoro model: https://github.com/hexgrad/kokoro and https://huggingface.co/hexgrad/Kokoro-82M (Apache-2.0); generation runtime https://github.com/thewh1teagle/kokoro-onnx (MIT).
- Gemini activity settings: https://ai.google.dev/api/live
