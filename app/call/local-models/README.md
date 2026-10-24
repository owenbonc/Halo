# Optional private GPU transcription

Gemini remains the default. This opt-in experiment changes only recorded messages sent through `/api/transcribe`; Gemini Live, analysis and voice notes retain their existing paths. It is not enabled in production.

The caller hears the existing recorded-message question, records up to 45 seconds and sends it through Halo's authenticated call session. Halo sends that recording through a private SSH connection to this Whisper service. The transcript follows the existing save/card/consent/alert flow. The call page discloses the private transcription computer before recording. No audio is saved by this service.

With Gemini unavailable, analysis still uses the existing conservative word checks: the courier/trick scripts produce warnings; the GP is amber, not a verified green result. There is no automatic switch to a fabricated sample or another provider when the private service fails.

## Setup on a separate Windows NVIDIA machine

Use an isolated folder and Python 3.13 virtual environment. Do not install into another project's environment. Tested with an RTX 5070 Ti, 16 GB VRAM, driver 610.88.

```powershell
$haloRoot = Join-Path $env:USERPROFILE 'halo-inference'
New-Item -ItemType Directory -Force $haloRoot
python -m venv "$haloRoot\venv"
# Copy server.py and requirements.txt from this directory into $haloRoot first.
& "$haloRoot\venv\Scripts\python.exe" -m pip install -r "$haloRoot\requirements.txt"
& "$haloRoot\venv\Scripts\python.exe" -c "from faster_whisper.utils import download_model; import os; download_model('small.en',output_dir=os.path.join(os.environ['USERPROFILE'],'halo-inference','models','small.en'))"
& "$haloRoot\venv\Scripts\python.exe" -c "from pathlib import Path; import secrets,os; p=Path(os.environ['USERPROFILE'])/'halo-inference'/'model-token.txt'; p.write_text(secrets.token_urlsafe(32)) if not p.exists() else None"
& "$haloRoot\venv\Scripts\python.exe" "$haloRoot\server.py" --model-dir "$haloRoot\models\small.en" --token-file "$haloRoot\model-token.txt"
```

Keep this process running in its SSH/terminal session. Windows may terminate background child processes when the SSH command that launched them exits. No startup task, firewall exception or public port is needed.

Keep the token file private to the service user. Transfer it privately to Halo's server environment, never into browser code, Git, command logs or chat.

## Connect local Halo

On the Mac running Halo, with the existing authenticated SSH connection:

```sh
ssh -N -L 127.0.0.1:8767:127.0.0.1:8767 YOUR_GPU_SSH_ALIAS
```

Set these **server-side** environment variables for the local Next.js process:

- `HALO_LOCAL_TRANSCRIPTION=1`
- `HALO_LOCAL_MODEL_TOKEN`: the private token from the GPU service.
- `DEMO_FALLBACK=0`: actual transcription, not the separately disclosed preset sample.

Keep the existing database and demo access-code configuration. The call page starts in Recorded message when local transcription is enabled; Live conversation still uses Gemini. Unset `HALO_LOCAL_TRANSCRIPTION` to restore the normal default.

A Vercel function cannot reach this Mac's loopback SSH forwarding. Do not enable this flag on Vercel. A deployed alternative requires a separately secured, reachable inference service and another review.

## Boundaries and checks

The service binds only `127.0.0.1`, authenticates every request, rejects browser origins and has no CORS allowance. It accepts raw WAV/WebM/Ogg/MP4 audio, not multipart. One request at a time bounds GPU concurrency. Uploads are limited to 10 MiB, decoded audio to 60 seconds and output to 20,000 characters. Halo's adapter has a 25-second deadline, bounds response bytes and validates the response schema. The shared app's existing synthetic-data-only and access-control limitations still apply.

Run protocol checks without model packages:

```sh
python3 -m unittest discover -s app/call/local-models -p 'test_*.py'
pnpm exec vitest run app/api/transcribe app/call/recorded-call.test.ts app/call/submit-call.test.ts
scripts/verify.sh
```

On this sandboxed Mac, default Turbopack fails when its CSS worker binds an internal port. `pnpm exec next build --webpack` passes. The full script also prints READY with the installed Next bundler selector `IS_WEBPACK_TEST=1 scripts/verify.sh`. This is local Webpack evidence, not a claim that the default Turbopack command passed; shared build scripts are unchanged.

Actual GPU acceptance also requires synthetic WAV and browser WebM recordings, silence, invalid audio, oversized/overlong recordings, loss of the SSH connection and a full local app rehearsal. Unit tests do not establish model accuracy or physical-phone microphone/speaker behaviour.

## Measured model experiment

On 24 October 2026, Whisper `small.en` with `int8_float16` correctly transcribed the three team-written demo scripts in WAV and WebM. First inference was 11.16 seconds; subsequent standalone calls took 0.56–0.91 seconds for 11.20–18.88 seconds of audio. Nine authenticated WebM requests also succeeded while the local language-model evaluation ran. These were Kokoro-generated synthetic recordings, not real callers or noisy microphone tests.

Qwen3 8B `Q4_K_M` was tested separately with Ollama 0.40.11, temperature zero, thinking disabled and the existing analysis schema/rules. With all 30 static pattern descriptions and 16,384 context tokens, it passed 42 of 45 checks (15 team cases, three runs each). All three benign-bank runs were incorrectly amber. Without the library it passed 24 of 45, mainly due to incorrect scam-family labels. No Atlas retrieval was claimed. Qwen is **not connected to Halo's analysis path**; B must review and validate an optional adapter before any switch.

## Open source

- [faster-whisper](https://github.com/SYSTRAN/faster-whisper), MIT; [Whisper](https://github.com/openai/whisper), MIT.
- [CTranslate2](https://github.com/OpenNMT/CTranslate2), MIT; [PyAV](https://github.com/PyAV-Org/PyAV), BSD-3-Clause.
- Decoder pinned below PyAV 19 for the released faster-whisper version: [upstream compatibility issue](https://github.com/SYSTRAN/faster-whisper/issues/1589).
- Separate reasoning experiment: [Ollama](https://github.com/ollama/ollama), MIT; [Qwen3-8B](https://huggingface.co/Qwen/Qwen3-8B), Apache-2.0.

No model weights, recordings, private addresses or service credentials are committed. NVIDIA runtime libraries retain their vendor licence terms.
