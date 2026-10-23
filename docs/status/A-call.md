# A. The call

Owner: call slice on `The-call`
Owns: `app/call/**`, `app/api/live-token/**`, `lib/screener-prompt.ts`

## Done

- Brought the shared skeleton into `The-call` with a fast-forward from `origin/main`.
- Verified event API access and availability of `gemini-3.8-live`.
- Created the required scratch prototype outside the repo at `/private/tmp/grandma-call-spike`.
- Verified SDK ephemeral-token creation using `v1alpha`. The published REST example using `v1beta` and `liveConnectConstraints` returned HTTP 400; do not copy that request without testing.
- Real synthetic Live session passed: ephemeral authentication, AI PCM audio output and assistant transcription.
- Local call page provides microphone capture, audio playback, hang-up, a 45-second limit and transcription receipt indicators. Transcript text is not displayed.
- Confirmed browser assets contain no API key and cross-origin token requests return HTTP 403.

## Doing

- Checking caller audio transcription; the initial synthetic audio test timed out without input transcription.
- Physical microphone, speaker playback and HTTPS stage-phone testing are not yet verified. This is not a completed spike or finished slice.

## Next

- Exercise the scratch page on the laptop, resolve caller transcription, then test the actual demo phone over HTTPS.
- Integrate the verified Live flow into the owned app files, preserving the recorded-line fallback and single-use call-session contract.
- Run the full verification script and the three synthetic demo scenarios on the deployed build.

## Needs from others

- Stage-phone access and the shared HTTPS deployment for the phone test.
- Demo scripts from slice D and working transcription/analysis from slice B.
- Local machine currently has Node 20 and no pnpm; shared app requires Node 24 or later and pnpm 9.15.9 before full verification can run.

## Contract change requests

None.
