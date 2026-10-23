# A. The call

Owner: call slice on `The-call`
Owns: `app/call/**`, `app/api/live-token/**`, `lib/screener-prompt.ts`

## Done

- Integrated live Gemini calls: microphone AudioWorklet, PCM audio, input/output transcription, 45-second limit, manual/assistant hang-up and guarded transcript submission.
- Independent security/usability review completed, followed by fixes and a second review. Verdict: suitable for further controlled synthetic-demo testing, not unrestricted public or real-user deployment.
- Token issuance now requires `CALL_DEMO_ACCESS_CODE` in production (at least 16 characters); missing/short configuration fails closed. The code is checked server-side before provider/database work and is held only in browser memory. Origin checking remains a CSRF layer, not the authentication mechanism.
- Durable atomic MongoDB budgets limit issuance to 6 attempts/minute and 60/hour globally, including fallback. TTL-indexed budget documents expire; rate-limited responses include the actual retry interval. Tested with 20 concurrent database requests: exactly 6 admitted.
- Live token lifetime reduced to 2 minutes, one use, with a 1-minute new-session window. Model, voice, instructions and both transcriptions remain locked server-side. Credentials are never included in browser assets.
- Fixed capture-after-finish startup race, cancellation of requests/body parsing, stalled response bodies, stale Blob callbacks, old speaking/listening timers, and browser back-navigation state restoration. Disposal is idempotent.
- Replaced browser reliance on `AbortSignal.timeout` with a bounded AbortController request helper. Explicit capability checks explain unsupported microphone, AudioWorklet and MediaRecorder paths; no deprecated ScriptProcessor implementation was added.
- Recorded fallback requires a separate recording tap after the visible question. Optional read-aloud is initiated directly by a user tap. Until `CALL_RECORDED_TRANSCRIPTION_READY=1`, a prominent warning explains that the recording produces a preset sample scam result; completion is also labelled as a sample.
- Call UI now includes microphone mute, assistant volume, speaking/listening status, a gentle two-tone speaker test, readable failures, wrapped mobile controls, and pre-call audio/transcript privacy information.
- Voice changed to Google's warm `Sulafat`, with calm, clear British-English pacing requested in the screener prompt. Real Gemini token/audio/transcript/save smoke tests passed with this voice. Voice preference remains subjective; a local preview is available.
- Refined delivery toward an ordinary phone conversation: natural contractions, varied intonation and meaning-led pauses, without forced slow pacing, announcer delivery or scripted hesitations. Assistant identity and screening restrictions remain explicit.
- Adapted the 100 ms initial buffering and gain scheduling approach from Google's Apache-2.0 Live API Web Console. Added a bounded 15-second queue and short interruption fades. Attribution/change notice are in `app/call/audio-player.ts`; full upstream license is in `app/call/licenses/google-audio.txt`. No new package dependency or voice server was introduced.
- Reviewed Pipecat as an alternative. Its Gemini starter introduces a Python server and WebRTC transport; that is a larger architectural change than this browser-to-Gemini slice warrants during the event.
- Validation: 32 tests, typecheck and lint pass; webpack production build passes. Tests cover credentials, rate windows, PCM, transcript limits, startup race, late fragments, silence, cancellation, stalled bodies, fallback errors, audio buffering/fades/limits and duplicate finish.
- Production dependency audit reports no known vulnerabilities. This is an advisory check, not proof of application security.
- Chrome UI reviewed at a 390-pixel phone viewport. Speaker test, explicit sample disclosure and cancellation exercised without collecting personal microphone audio.

## Doing

- Actual stage-phone microphone/speaker testing and three consecutive deployed scenario runs remain outstanding.

## Next

- Set a random production `CALL_DEMO_ACCESS_CODE` (16+ characters) privately. Do not put it in a `NEXT_PUBLIC_` variable. Without it, production calls intentionally return 503. Configure provider spending limits and deployment access protection for the entire demo.
- Only set `CALL_RECORDED_TRANSCRIPTION_READY=1` after slice B's real transcription is integrated and validated. The current checkout's transcription is a fixture.
- Test physical phone permissions, audibility, interruption, mute, cancellation, background/back navigation, delayed transcription and repeat calls over HTTPS.
- Run all three synthetic scenarios three times on the deployed build after shared blockers are fixed.

## Needs from others

- **P1 shared API protection:** `/api/transcribe`, `/api/voice-note`, `/api/calls`, `/api/settings` and alert routes need the shared owner's access-control review. Token gating does not secure those routes. Limit uploads before buffering; authenticate/rate-limit billable transcription.
- **P1 submission recovery:** `/api/calls` consumes the session before analysis/save. A transient failure can lose the submission; an alert failure after save can make delivery appear to fail. Implement idempotent receipt/recovery and separate notification failures from persistence. Client deliberately does not blindly retry.
- **P1 truthfulness/analysis:** slice B's transcription and analysis are still placeholders here. A's recorded sample disclosure is explicit, but it is not a working real-transcription fallback.
- **P2 expiry/privacy:** enforce call-session expiry on consumption and define transcript retention/access. Session records currently have no expiry check. This demo must use synthetic data only.
- Prompt rules cannot guarantee safe model speech. Direct generated audio is played without a deterministic safety filter; do not claim it can safely screen real callers.
- Stage-phone and HTTPS deployment access are needed for acceptance. Default `scripts/verify.sh` remains NOT READY due to local Turbopack `binding to a port / Operation not permitted`; separate webpack build passes. Shared build settings were left unchanged.
- The saved event API key was previously pasted into chat; rotation remains recommended before a public deployment. No credential value appears in tracked files.

## Contract change requests

- Token response now adds `recordedFixture: boolean`; slice-local schema validates it. Please add that field to the keeper-owned `LiveToken` type when integrating. Existing nullable token/model fields are unchanged.
- Shared keeper: idempotent submission lifecycle, session expiry, and authenticated/bounded transcription as described above.

## Research references

- Google Live API Web Console: https://github.com/google-gemini/live-api-web-console (Apache-2.0; only the small audio buffering/gain approach was adapted).
- Pipecat: https://github.com/pipecat-ai/pipecat and its Gemini starter https://github.com/pipecat-ai/pipecat-examples/tree/main/gemini-live-starters/web-bot (evaluated, not added).
- Google's voice catalogue: https://firebase.google.com/docs/ai-logic/live-api/configuration (`Sulafat`: warm).
