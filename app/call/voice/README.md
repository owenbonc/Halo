# Kokoro screening voice

The caller hears three prerecorded lines generated locally with [Kokoro-82M](https://github.com/hexgrad/kokoro), voice `bf_emma`, British English, speed `0.98`. Kokoro's code and model weights are Apache-2.0; [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) is MIT. Notices are in `../licenses/`.

`clips.json` contains 24 kHz mono PCM16 audio encoded as hex plus its exact text. Hex avoids random base64 substrings matching the repository's history-wide credential scanner. The static `/call/voice` route converts it to base64 for playback (approximately 591 KB transferred). No model weights, Python packages, remote inference service or caller recordings are deployed. These are generated demo assets, not human recordings or a cloned person's voice.

Gemini still handles live caller audio and selects the opening, optional follow-up, or closing. Its generated audio is discarded. The browser checks the complete response against the three allowed lines and their order, plays the corresponding Kokoro clip, and records canonical assistant text only when playback completes. Unexpected wording ends the call with an error. Gemini audio generation is still billable even though it is not played.

Microphone processing and transmission pause during response preparation and playback. Old queued frames are rejected across pause/resume boundaries. Callers must wait for “Listening” before speaking; intentional voice interruption is not supported in this fixed-line mode. Mute and hang-up remain available. Gemini also uses low speech-detection sensitivity and `NO_INTERRUPTION`.

The optional recorded-message read-aloud still uses the device's speech synthesis. The Kokoro flow is the live screening mode, not the placeholder recorded-transcription fallback.

## Reproduce the audio

From the repository root, using Node 24 and Python 3.10–3.13:

```sh
python3 -m venv /tmp/kokoro-env
/tmp/kokoro-env/bin/pip install kokoro-onnx==0.6.1 soundfile==0.13.1
mkdir -p /tmp/kokoro-model
curl -fL -o /tmp/kokoro-model/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/kokoro-v1.0.onnx
curl -fL -o /tmp/kokoro-model/voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/voices-v1.0.bin
node --input-type=module -e 'import { SCREENER_LINES } from "./lib/screener-prompt.ts"; console.log(JSON.stringify(SCREENER_LINES))' > /tmp/kokoro-model/lines.json
/tmp/kokoro-env/bin/python app/call/voice/generate.py /tmp/kokoro-model /tmp/kokoro-model/lines.json --preview-dir /tmp/kokoro-preview
pnpm exec biome format --write app/call/voice/clips.json
pnpm test
```

Before inference, verify the downloaded files against the hashes used for this bundle:

- `kokoro-v1.0.onnx`: `beb0d1848dee9a49da392cc3df26958d46cfa35d321edf434f52949153f0df3a`
- `voices-v1.0.bin`: `bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d`

The generator leaves headroom without boosting the volume. Generated durations: opening 4.54 s, follow-up 2.79 s, closing 1.89 s. Listen to regenerated clips before replacing the bundle; synthesis can vary across runtime versions.
