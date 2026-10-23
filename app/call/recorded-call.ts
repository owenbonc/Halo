import { SCREENER_OPENING } from '@/lib/screener-prompt';
import { TranscriptResponse } from './protocol';

export class RecordedCall {
  private recorder: MediaRecorder;
  private chunks: Blob[] = [];
  private recording: Promise<Blob>;
  private finished?: Promise<string>;
  private started = false;
  private cancelGreeting?: () => void;

  constructor(
    private stream: MediaStream,
    private ended: () => void,
  ) {
    this.recorder = new MediaRecorder(stream);
    this.recording = new Promise((resolve, reject) => {
      this.recorder.ondataavailable = (e) => {
        if (e.data.size) this.chunks.push(e.data);
      };
      this.recorder.onstop = () => resolve(new Blob(this.chunks, { type: this.recorder.mimeType }));
      this.recorder.onerror = () => {
        reject(new Error('Recording failed. Please try again.'));
        this.ended();
      };
    });
    void this.recording.catch(() => {});
  }
  async start() {
    if ('speechSynthesis' in window)
      await new Promise<void>((resolve) => {
        const greeting = new SpeechSynthesisUtterance(SCREENER_OPENING);
        const timeout = setTimeout(resolve, 12_000);
        const done = () => {
          clearTimeout(timeout);
          resolve();
        };
        this.cancelGreeting = done;
        greeting.onend = done;
        greeting.onerror = done;
        speechSynthesis.speak(greeting);
      });
    if (!this.stream.active) throw new Error('Call cancelled.');
    this.recorder.start();
    this.started = true;
  }
  finish(): Promise<string> {
    this.finished ??= (async () => {
      if (!this.started) throw new Error('No message was recorded.');
      this.recorder.stop();
      this.stream.getTracks().forEach((t) => {
        t.stop();
      });
      const audio = await this.recording;
      if (!audio.size) throw new Error('No audio was recorded. Please try again.');
      const form = new FormData();
      form.append('audio', audio, 'caller-message');
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok)
        throw new Error('The recording could not be transcribed. Please try again.');
      const { transcript } = TranscriptResponse.parse(await response.json());
      return `Caller: ${transcript}`;
    })();
    return this.finished;
  }
  dispose() {
    this.cancelGreeting?.();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (this.recorder.state !== 'inactive') this.recorder.stop();
    this.stream.getTracks().forEach((t) => {
      t.stop();
    });
  }
}
