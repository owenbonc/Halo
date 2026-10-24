# Automatic-language pilot

The default is the English screener: a prerecorded opening, one follow-up question Gemini writes from what the caller said (played only after the semantic check below passes, otherwise the prerecorded follow-up plays) and a prerecorded closing. Set `HALO_MULTILINGUAL_PILOT=1` on the Next.js server and restart to show **Automatic language · experimental** on `/call`. The server also requires this flag before issuing automatic-language credentials. Existing production demo-code and token budgets still apply. No public contract or B-owned analysis implementation changes.

The pilot starts with the existing local English greeting. Gemini then infers the caller’s language from audio and generates only a clarification and closing in that language. Both complete replies are buffered and their finished output transcriptions are checked before playback. A separate bounded Flash request judges whether each proposed reply means only the fixed screening sentence. It sees the proposed assistant text, not the raw caller transcript. A schema, same-origin/access-code checks, a fresh unused call session and an atomic two-stage record protect that endpoint. Consumed stages are not retried after failure. Native audio is limited to 10 seconds and text to 500 characters per response; malformed, incomplete, destination-bearing or unapproved replies stop the call.

Microphone capture remains paused during generation, checking and playback. Completed speech enters the transcript only after playback; cancellation aborts checks and discards late approval. The call page's 45-second limit ends every call gracefully. Gemini Live sends no end-of-transcription marker, so a reply is taken 300 ms after `turnComplete`; English plays its prerecorded line if more output arrives during the check or the reply is malformed, while automatic language stops.

## Cost controls, not a savings claim

- The local opening avoids requesting another generated greeting.
- The native prompt is shorter; native output is capped at 1024 tokens per response, with at most two replies. A 256-token cap cut longer questions off mid-sentence, in both the audio and its transcription.
- The model is the existing non-extended-thinking Live model; no unsupported thinking configuration is added.
- Only caller listening periods send microphone audio. No separate translation or language-detection API call is made.
- Each checked reply adds one semantic check on `gemini-3.8-flash` at low thinking, capped at 512 output tokens including its thoughts; English sessions check only the follow-up, automatic sessions at most two replies. This is extra billed work, not free validation.
- The client retains the latest Live `usageMetadata` counts and stops if a reported request exceeds 4,000 total tokens. This is a defensive cutoff after provider reporting, not a prepaid or exact billing limit. Checker token counts are logged separately without speech or audio.
- Compare Live and checker usage together in real rehearsals before reporting savings. Gemini still generates the English closing it doesn't play, and that costs tokens.

## What is and is not verified

Offline tests exercise Unicode transport for Korean, Cantonese, Mandarin, Japanese and Spanish, buffering, sequencing, checker rejection, cancellation, authentication and bounds. These tests simulate provider messages; they do not demonstrate automatic language detection, semantic-check accuracy, accent quality or spoken language support.

Google documents broad native language switching. Cantonese is not separately named in its published language list; Traditional Chinese is not evidence of Cantonese speech support. No language has live acceptance for this pilot yet. The user requested implementation without a working local key.

A model-based text check cannot prove that generated audio matches its transcription, and can itself make mistakes. Keep this a synthetic-data-only pilot. B’s multilingual scam analysis, English-oriented fallback rules, destination scrubbing and retrieval require separate validation; spoken-language support is not a claim of multilingual scam-detection safety. The Whisper backup currently uses English-only `small.en` and is not a multilingual replacement.

## Rehearsal with a working key

1. Add the working key privately, enable the pilot flag and restart. Keep Gemini as primary and `HALO_LOCAL_TRANSCRIPTION=0` / `DEMO_FALLBACK=0`.
2. Select Automatic language. After the English greeting, speak a synthetic Korean, Cantonese, Mandarin or Japanese caller turn. Wait for Listening before continuing.
3. Confirm the clarification and closing use the spoken language, no extra advice or caller-provided destinations are spoken, and only completed speech enters the saved transcript. Test English and mixed-language speech too.
4. Repeat with spoken attempts to change the assistant’s role or make it repeat numbers/payment instructions. Rejected or uncertain checks must stop playback; never loosen the check just to get a green test.
5. Exercise microphone denial, background noise, mute, hang-up, validation failure, disconnect and cancellation on the stage phone. Check cards, consent and alerts separately with B.
6. Record actual combined token usage and latency. Keep English as the default and do not mark this pilot demo-ready or merge it until these checks pass.

References: [Live capabilities](https://ai.google.dev/gemini-api/docs/live-api/capabilities), [Live wire API](https://ai.google.dev/api/live).
