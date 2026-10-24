import { TranscriptResponse } from './protocol';
import { CallError, callRequest } from './request';

// Matches the shared transcription endpoint's audio-blob ceiling.
export const MAX_RECORDING_BYTES = 10 * 1024 * 1024;

export class RecordedCall {
  private recorder: MediaRecorder;
  private chunks: Blob[] = [];
  private bytes = 0;
  private recording: Promise<Blob>;
  private rejectRecording!: (error: Error) => void;
  private failed = false;
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
      this.rejectRecording = reject;
      this.recorder.ondataavailable = (e) => {
        if (this.failed || this.abort.signal.aborted || !e.data.size) return;
        this.bytes += e.data.size;
        if (this.bytes > MAX_RECORDING_BYTES) {
          this.fail(
            new CallError('The recording is too large. Nothing was sent. Try a shorter message.'),
          );
          return;
        }
        this.chunks.push(e.data);
      };
      this.recorder.onstop = () => {
        resolve(new Blob(this.chunks, { type: this.recorder.mimeType }));
        this.chunks = [];
      };
      this.recorder.onerror = () => this.fail(new CallError('Recording failed. Please try again.'));
      this.abort.signal.addEventListener(
        'abort',
        () => reject(new DOMException('Aborted', 'AbortError')),
        { once: true },
      );
    });
    void this.recording.catch(() => {});
  }
  private stopMic() {
    this.stream.getTracks().forEach((track) => {
      track.stop();
    });
  }
  private fail(error: CallError) {
    if (this.failed || this.abort.signal.aborted) return;
    this.failed = true;
    this.chunks = [];
    this.rejectRecording(error);
    this.stopMic();
    try {
      if (this.recorder.state !== 'inactive') this.recorder.stop();
    } catch {
      // The recording is already rejected; a broken recorder must not prevent cleanup.
    }
    this.ended();
  }
  start() {
    if (!this.stream.active || this.abort.signal.aborted || this.failed)
      throw new CallError('Call cancelled.');
    this.recorder.start(1000);
    this.started = true;
  }
  finish(): Promise<string> {
    this.finished ??= (async () => {
      if (!this.started) throw new CallError('No message was recorded.');
      const timeout = setTimeout(
        () =>
          this.fail(
            new CallError('The recording could not finish. Nothing was sent. Please try again.'),
          ),
        5000,
      );
      let audio: Blob;
      try {
        if (this.recorder.state !== 'inactive') this.recorder.stop();
        this.stopMic();
        audio = await this.recording;
      } catch (error) {
        this.stopMic();
        throw error;
      } finally {
        clearTimeout(timeout);
      }
      if (this.abort.signal.aborted) throw new DOMException('Aborted', 'AbortError');
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
    this.chunks = [];
    this.stopMic();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    try {
      if (this.recorder.state !== 'inactive') this.recorder.stop();
    } catch {
      // Cancellation still releases the microphone if MediaRecorder has already failed.
    }
  }
}
