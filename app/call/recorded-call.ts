import { TranscriptResponse } from './protocol';
import { CallError, callRequest } from './request';

export class RecordedCall {
  private recorder: MediaRecorder;
  private chunks: Blob[] = [];
  private recording: Promise<Blob>;
  private finished?: Promise<string>;
  private started = false;
  private abort = new AbortController();

  constructor(
    private stream: MediaStream,
    private callSessionId: string,
    private ended: () => void,
  ) {
    this.recorder = new MediaRecorder(stream);
    this.recording = new Promise((resolve, reject) => {
      this.recorder.ondataavailable = (e) => {
        if (e.data.size) this.chunks.push(e.data);
      };
      this.recorder.onstop = () => resolve(new Blob(this.chunks, { type: this.recorder.mimeType }));
      this.recorder.onerror = () => {
        reject(new CallError('Recording failed. Please try again.'));
        this.ended();
      };
    });
    void this.recording.catch(() => {});
  }
  start() {
    if (!this.stream.active) throw new CallError('Call cancelled.');
    this.recorder.start();
    this.started = true;
  }
  finish(): Promise<string> {
    this.finished ??= (async () => {
      if (!this.started) throw new CallError('No message was recorded.');
      if (this.recorder.state !== 'inactive') this.recorder.stop();
      this.stream.getTracks().forEach((t) => {
        t.stop();
      });
      const audio = await this.recording;
      if (!audio.size) throw new CallError('No audio was recorded. Please try again.');
      const form = new FormData();
      form.append('audio', audio, 'caller-message');
      const response = await callRequest(
        '/api/transcribe',
        {
          method: 'POST',
          headers: { 'x-call-session-id': this.callSessionId },
          body: form,
        },
        30_000,
        this.abort.signal,
      );
      if (!response.ok)
        throw new CallError('The recording could not be transcribed. Please try again.');
      const { transcript } = TranscriptResponse.parse(response.data);
      return `Caller: ${transcript}`;
    })();
    return this.finished;
  }
  dispose() {
    this.abort.abort();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (this.recorder.state !== 'inactive') this.recorder.stop();
    this.stream.getTracks().forEach((t) => {
      t.stop();
    });
  }
}
