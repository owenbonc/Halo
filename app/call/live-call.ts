import { SCREENER_CLOSING } from '@/lib/screener-prompt';
import { AudioPlayer } from './audio-player';
import { LiveMessage, pcm16, Transcript } from './protocol';
import { CallError } from './request';

export class LiveCall {
  readonly transcript = new Transcript();
  private socket?: WebSocket;
  private source?: MediaStreamAudioSourceNode;
  private capture?: AudioWorkletNode;
  private player: AudioPlayer;
  private cancelStart?: () => void;
  private closed = false;
  private finishing?: Promise<string>;
  private ready = false;
  private activityTimer?: ReturnType<typeof setTimeout>;
  private closeTimer?: ReturnType<typeof setTimeout>;
  private pending = Promise.resolve();
  private fatal?: Error;

  constructor(
    private context: AudioContext,
    private stream: MediaStream,
    private ended: () => void,
    private activity: (state: 'speaking' | 'listening') => void = () => {},
  ) {
    this.player = new AudioPlayer(context);
  }

  async start(token: string, model: string) {
    const socket = new WebSocket(
      `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token)}`,
    );
    this.socket = socket;
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new CallError('The live assistant took too long to connect.')),
        15_000,
      );
      const fail = () => {
        clearTimeout(timeout);
        reject(new CallError('The live assistant disconnected.'));
      };
      this.cancelStart = fail;
      socket.onopen = () => this.send({ setup: { model: `models/${model}` } });
      socket.onmessage = (event) => {
        this.pending = this.pending
          .then(async () => {
            if (this.closed) return;
            const raw = event.data instanceof Blob ? await event.data.text() : event.data;
            if (this.closed) return;
            const message = LiveMessage.parse(JSON.parse(raw));
            if (message.error) throw new CallError('The live assistant could not continue.');
            if (message.setupComplete) {
              clearTimeout(timeout);
              this.ready = true;
              resolve();
            }
            const content = message.serverContent;
            if (content) {
              this.transcript.add('Caller', content.inputTranscription?.text);
              this.transcript.add('Assistant', content.outputTranscription?.text);
              if (content.interrupted) {
                this.player.stop();
                clearTimeout(this.activityTimer);
                this.activity('listening');
              }
              if (!this.finishing)
                for (const part of content.modelTurn?.parts ?? []) {
                  if (part.inlineData?.mimeType.startsWith('audio/pcm')) {
                    clearTimeout(this.activityTimer);
                    this.player.play(part.inlineData.data);
                    this.activity('speaking');
                  }
                }
              const closing = this.transcript
                .lastAssistant()
                .replaceAll('’', "'")
                .toLowerCase()
                .replace(/[^a-z ]/g, '')
                .replace(/\s+/g, ' ')
                .includes(SCREENER_CLOSING.toLowerCase().replace(/[^a-z ]/g, ''));
              if (content.turnComplete && closing && !this.finishing) {
                clearTimeout(this.closeTimer);
                this.closeTimer = setTimeout(this.ended, this.player.remainingMs);
              }
            }
            if (content?.turnComplete && !this.finishing) {
              clearTimeout(this.activityTimer);
              this.activityTimer = setTimeout(() => {
                if (!this.closed && !this.finishing) this.activity('listening');
              }, this.player.remainingMs);
            }
            if (message.goAway && this.ready && !this.finishing) this.ended();
          })
          .catch(() => {
            this.fatal = new CallError(
              'The live conversation could not be read. Please try again.',
            );
            if (this.ready) this.ended();
            else fail();
          });
      };
      socket.onerror = () => {
        if (this.ready) this.ended();
        else fail();
      };
      socket.onclose = () => {
        if (!this.closed && !this.finishing) {
          if (this.ready) this.ended();
          else fail();
        }
      };
    });
    if (this.closed || this.finishing) throw new CallError('Call cancelled.');
    await this.context.audioWorklet.addModule('/call/capture');
    if (this.closed || this.finishing) throw new CallError('Call cancelled.');
    this.source = this.context.createMediaStreamSource(this.stream);
    this.capture = new AudioWorkletNode(this.context, 'call-capture');
    this.capture.port.onmessage = ({ data }: MessageEvent<Float32Array>) => {
      if (this.closed || this.finishing) return;
      if (socket.bufferedAmount > 256_000) {
        this.ended();
        return;
      }
      this.send({
        realtimeInput: {
          audio: {
            data: btoa(String.fromCharCode(...pcm16(data))),
            mimeType: `audio/pcm;rate=${this.context.sampleRate}`,
          },
        },
      });
    };
    this.source.connect(this.capture);
    this.capture.connect(this.context.destination);
    this.send({
      clientContent: {
        turns: [
          { role: 'user', parts: [{ text: 'The demo caller has connected. Please greet them.' }] },
        ],
        turnComplete: true,
      },
    });
  }

  private send(value: unknown) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(value));
  }
  setVolume(volume: number) {
    this.player.setVolume(volume);
  }
  setMuted(muted: boolean) {
    this.stream.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }
  private stopMic() {
    this.capture?.disconnect();
    this.source?.disconnect();
    this.stream.getTracks().forEach((track) => {
      track.stop();
    });
  }
  finish(): Promise<string> {
    this.finishing ??= (async () => {
      this.stopMic();
      this.player.stop();
      clearTimeout(this.closeTimer);
      this.send({ realtimeInput: { audioStreamEnd: true } });
      // Input transcription arrives independently, so allow final fragments to drain.
      if (this.socket?.readyState === WebSocket.OPEN) await new Promise((r) => setTimeout(r, 2000));
      await this.pending;
      this.dispose();
      if (this.fatal) throw this.fatal;
      if (!this.transcript.hasCaller())
        throw new CallError('No caller speech was captured. Try again or use a recorded message.');
      return this.transcript.text();
    })();
    return this.finishing;
  }
  dispose() {
    if (this.closed) return;
    this.closed = true;
    this.cancelStart?.();
    clearTimeout(this.activityTimer);
    clearTimeout(this.closeTimer);
    this.stopMic();
    this.player.dispose();
    this.socket?.close();
    void this.context.close().catch(() => {});
  }
}
