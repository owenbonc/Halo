"""Private Whisper service for Halo's optional GPU experiment; see README.md."""

import argparse
import hmac
import io
import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
import sys

MAX_BYTES = 10 * 1024 * 1024
MAX_SECONDS = 60
AUDIO_TYPES = {'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/mp4'}


class Handler(BaseHTTPRequestHandler):
    token = ''
    transcribe = None
    protocol_version = 'HTTP/1.0'

    def setup(self):
        super().setup()
        self.connection.settimeout(10)

    def log_message(self, *_args):
        pass  # Never log caller audio, transcripts or authentication headers.

    def respond(self, status, body):
        raw = json.dumps(body).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(raw)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        try:
            self.wfile.write(raw)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def authorised(self):
        if self.headers.get('Origin'):
            self.respond(403, {'error': 'Use the Halo server.'})
            return False
        supplied = self.headers.get('Authorization', '').encode()
        expected = ('Bearer ' + self.token).encode()
        if not self.token or not hmac.compare_digest(supplied, expected):
            self.respond(401, {'error': 'Unauthorised.'})
            return False
        return True

    def do_GET(self):
        if not self.authorised():
            return
        if self.path != '/health':
            self.respond(404, {'error': 'Not found.'})
            return
        self.respond(200, {'ready': True, 'model': 'small.en', 'device': 'cuda'})

    def do_POST(self):
        if not self.authorised():
            return
        if self.path != '/transcribe':
            self.respond(404, {'error': 'Not found.'})
            return
        lengths = self.headers.get_all('Content-Length', [])
        if self.headers.get('Transfer-Encoding') or len(lengths) != 1:
            self.respond(411, {'error': 'One Content-Length is required.'})
            return
        try:
            length = int(lengths[0])
        except ValueError:
            self.respond(400, {'error': 'Invalid Content-Length.'})
            return
        if length < 1 or length > MAX_BYTES:
            self.respond(413, {'error': 'Send a recording of at most ten megabytes.'})
            return
        kind = self.headers.get('Content-Type', '').split(';')[0].strip().lower()
        if kind not in AUDIO_TYPES:
            self.respond(415, {'error': 'Unsupported recording type.'})
            return
        try:
            audio = self.rfile.read(length)
            if len(audio) != length:
                raise ValueError('Incomplete audio')
            text = type(self).transcribe(audio)
            self.respond(200, {'transcript': text})
        except (ValueError, TimeoutError, OSError):
            self.respond(422, {'error': 'The recording could not be transcribed.'})
        except Exception:
            self.respond(503, {'error': 'Transcription is unavailable.'})


def create_transcriber(model_dir):
    # Keep CUDA DLL search changes inside this process and Halo's virtual environment.
    handles = []
    if os.name == 'nt':
        for directory in (Path(sys.prefix) / 'Lib/site-packages/nvidia').glob('*/bin'):
            handles.append(os.add_dll_directory(str(directory)))
            os.environ['PATH'] = str(directory) + os.pathsep + os.environ['PATH']
    import av
    import numpy as np
    from faster_whisper import WhisperModel

    model = WhisperModel(str(model_dir), device='cuda', compute_type='int8_float16', local_files_only=True)

    def transcribe(raw):
        # Decode incrementally: compressed uploads must not expand into unbounded audio.
        chunks = []
        samples = 0
        try:
            with av.open(io.BytesIO(raw)) as container:
                resampler = av.AudioResampler(format='s16', layout='mono', rate=16000)
                for frame in container.decode(audio=0):
                    for decoded in resampler.resample(frame):
                        samples += decoded.samples
                        if samples > 16000 * MAX_SECONDS:
                            raise ValueError('Recording is too long')
                        chunks.append(decoded.to_ndarray().reshape(-1))
                for decoded in resampler.resample(None):
                    samples += decoded.samples
                    if samples > 16000 * MAX_SECONDS:
                        raise ValueError('Recording is too long')
                    chunks.append(decoded.to_ndarray().reshape(-1))
        except Exception as error:
            raise ValueError('Invalid or oversized recording') from error
        if not chunks:
            return ''
        audio = np.concatenate(chunks).astype(np.float32) / 32768.0
        segments, _ = model.transcribe(audio, language='en', beam_size=5,
                                      vad_filter=True, condition_on_previous_text=False)
        return ' '.join(s.text.strip() for s in segments).strip()[:20_000]

    # DLL handles must outlive all inference calls on Windows.
    transcribe.dll_handles = handles
    return transcribe


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model-dir', type=Path, required=True)
    parser.add_argument('--token-file', type=Path, required=True)
    parser.add_argument('--port', type=int, default=8767)
    args = parser.parse_args()
    token = args.token_file.read_text().strip()
    if len(token) < 32 or not token.isascii():
        parser.error('The private token must be at least 32 ASCII characters.')
    Handler.token = token
    Handler.transcribe = staticmethod(create_transcriber(args.model_dir))
    # One request at a time bounds GPU work and upload memory; SSH provides remote access.
    with HTTPServer(('127.0.0.1', args.port), Handler) as server:
        print('Halo Whisper ready on loopback', flush=True)
        server.serve_forever()


if __name__ == '__main__':
    main()
