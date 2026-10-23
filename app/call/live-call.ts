import { SCREENER_CLOSING } from '@/lib/screener-prompt';
import { decodePcm, LiveMessage, pcm16, Transcript } from './protocol';

export class LiveCall {
  readonly transcript = new Transcript();
  private socket?: WebSocket;
  private source?: MediaStreamAudioSourceNode;
  private capture?: AudioWorkletNode;
  private players = new Set<AudioBufferSourceNode>();
  private nextPlay = 0;
  private closed = false;
  private finishing?: Promise<string>;
  private ready = false;
  private closeTimer?: ReturnType<typeof setTimeout>;
  private pending = Promise.resolve();
  private fatal?: Error;

  constructor(
    private context: AudioContext,
    private stream: MediaStream,
    private ended: () => void,
  ) {}

  async start(token: string, model: string) {
    const socket = new WebSocket(
      `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token)}`,
    );
    this.socket = socket;
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('The live assistant took too long to connect.')),
        15_000,
      );
      const fail = () => {
        clearTimeout(timeout);
        reject(new Error('The live assistant disconnected.'));
      };
      socket.onopen = () => this.send({ setup: { model: `models/${model}` } });
      socket.onmessage = (event) => {
        this.pending = this.pending
          .then(async () => {
            if (this.closed) return;
            const raw = event.data instanceof Blob ? await event.data.text() : event.data;
            const message = LiveMessage.parse(JSON.parse(raw));
            if (message.error) throw new Error('The live assistant could not continue.');
            if (message.setupComplete) {
              clearTimeout(timeout);
              this.ready = true;
              resolve();
            }
            const content = message.serverContent;
            if (content) {
              this.transcript.add('Caller', content.inputTranscription?.text);
              this.transcript.add('Assistant', content.outputTranscription?.text);
              if (content.interrupted) this.stopPlayback();
              if (!this.finishing)
                for (const part of content.modelTurn?.parts ?? []) {
                  if (part.inlineData?.mimeType.startsWith('audio/pcm'))
                    this.play(part.inlineData.data);
                }
              const closing = this.transcript
                .lastAssistant()
                .replaceAll('’', "'")
                .includes(SCREENER_CLOSING);
              if (content.turnComplete && closing && !this.finishing) {
                clearTimeout(this.closeTimer);
                this.closeTimer = setTimeout(
                  this.ended,
                  Math.max(0, (this.nextPlay - this.context.currentTime) * 1000),
                );
              }
            }
            if (message.goAway && this.ready && !this.finishing) this.ended();
          })
          .catch(() => {
            this.fatal = new Error('The live conversation could not be read. Please try again.');
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
    if (this.closed) throw new Error('Call cancelled.');
    await this.context.audioWorklet.addModule('/call/capture');
    if (this.closed) throw new Error('Call cancelled.');
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
  private play(data: string) {
    const samples = decodePcm(data);
    const buffer = this.context.createBuffer(1, samples.length, 24000);
    buffer.copyToChannel(samples, 0);
    const player = this.context.createBufferSource();
    player.buffer = buffer;
    player.connect(this.context.destination);
    this.players.add(player);
    player.onended = () => {
      this.players.delete(player);
      player.disconnect();
    };
    this.nextPlay = Math.max(this.context.currentTime, this.nextPlay);
    player.start(this.nextPlay);
    this.nextPlay += buffer.duration;
  }
  private stopPlayback() {
    for (const player of this.players) {
      player.stop();
      player.disconnect();
    }
    this.players.clear();
    this.nextPlay = 0;
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
      this.stopPlayback();
      clearTimeout(this.closeTimer);
      this.send({ realtimeInput: { audioStreamEnd: true } });
      // Input transcription arrives independently, so allow final fragments to drain.
      if (this.socket?.readyState === WebSocket.OPEN) await new Promise((r) => setTimeout(r, 2000));
      await this.pending;
      this.dispose();
      if (this.fatal) throw this.fatal;
      if (!this.transcript.hasCaller())
        throw new Error('No caller speech was captured. Try again or use a recorded message.');
      return this.transcript.text();
    })();
    return this.finishing;
  }
  dispose() {
    this.closed = true;
    clearTimeout(this.closeTimer);
    this.stopMic();
    this.stopPlayback();
    this.socket?.close();
    void this.context.close().catch(() => {});
  }
}
