# Screening voice

The caller hears three prerecorded lines (opening, fallback follow-up and closing) in Gemini's prebuilt voice `Sulafat`, the same voice Gemini Live speaks the tailored follow-up in, so the whole call sounds like one assistant. They were generated with `gemini-3.8-flash-tts`.

`clips.json` contains 24 kHz mono PCM16 audio encoded as hex plus its exact text. Hex avoids random base64 substrings matching the repository's history-wide credential scanner. The static `/call/voice` route converts it to base64 for playback. These are generated demo assets, not human recordings or a cloned person's voice.

In English live calls the opening and closing always play from these clips. The follow-up is Gemini's own question, played only after `/api/live-token/validate` approves its text; otherwise the prerecorded follow-up plays. Assistant text enters the transcript only when its audio finishes playing. Microphone capture pauses while the assistant prepares or plays a line, and old queued frames are rejected across pauses, so callers wait for "Listening" before speaking. Gemini uses low speech-detection sensitivity and `NO_INTERRUPTION`.

The optional recorded-message read-aloud uses the device's speech synthesis. The automatic-language pilot is documented in `../multilingual.md`.

## Reproduce the audio

From the repository root, with `GEMINI_API_KEY` set:

```sh
pnpm exec tsx app/call/voice/generate.ts /tmp/voice-preview
pnpm exec biome format --write app/call/voice/clips.json
pnpm test
```

The generator speaks each line in `LIVE_VOICE` (`app/api/live-token/token.ts`), transcribes the result with `gemini-3.8-flash` and refuses a clip whose words differ from its line, then writes `clips.json` and preview WAVs. It sends the bare line: the TTS model reads any style words aloud and rejects a system instruction. Peaks are scaled to 90% without boosting quiet portions. Generated durations: opening 4.52 s, follow-up 2.84 s, closing 2.04 s. Listen to the previews before committing; synthesis varies between runs.
