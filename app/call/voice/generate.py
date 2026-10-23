"""Generate bundled synthetic screening audio; see README.md for setup."""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

parser = argparse.ArgumentParser()
parser.add_argument("model_dir", type=Path)
parser.add_argument("lines", type=Path)
parser.add_argument("--preview-dir", type=Path, required=True)
args = parser.parse_args()
model = args.model_dir / "kokoro-v1.0.onnx"
voices = args.model_dir / "voices-v1.0.bin"
kokoro = Kokoro(str(model), str(voices))
lines = json.loads(args.lines.read_text())
assert set(lines) == {"opening", "followup", "closing"}
args.preview_dir.mkdir(parents=True, exist_ok=True)
clips = {}
for name, text in lines.items():
    samples, rate = kokoro.create(text, voice="bf_emma", speed=0.98, lang="en-gb")
    assert rate == 24000 and 0 < len(samples) <= rate * 12
    assert np.isfinite(samples).all()
    # Leave headroom without boosting quiet portions or introducing a runtime effect.
    peak = float(np.max(np.abs(samples)))
    samples *= min(1.0, 0.9 / max(peak, 0.001))
    pcm = (np.clip(samples, -1, 1) * 32767).astype("<i2").tobytes()
    clips[name] = {"text": text, "pcmHex": pcm.hex()}
    sf.write(args.preview_dir / f"{name}.wav", samples, rate, subtype="PCM_16")
    print(f"{name}: {len(samples) / rate:.2f}s")
here = Path(__file__).resolve().parent
(here / "clips.json").write_text(json.dumps(clips, indent=2) + "\n")
for path in (model, voices):
    print(f"SHA256 {path.name}: {hashlib.sha256(path.read_bytes()).hexdigest()}")
