import { AudioPlayer } from './audio-player';
import { NativeReply, type NativeTurn } from './native-speech';
import { LiveMessage, pcm16, Transcript } from './protocol';
import { CallError } from './request';
import { ScriptedReply, type VoiceClips } from './scripted-voice';

export class LiveCall {
  readonly transcript = new Transcript();
  private socket?: WebSocket;
  private source?: MediaStreamAudioSourceNode;
  private capture?: AudioWorkletNode;
  private player: AudioPlayer;
  private cancelStart?: () => void;
  private closed = false;
  private terminated = false;
  private finishing?: Promise<string>;
  private ready = false;
  private activityTimer?: ReturnType<typeof setTimeout>;
  private replyTimer?: ReturnType<typeof setTimeout>;
  private pending = Promise.resolve();
  private fatal?: Error;
  private reply = '';
  private script = new ScriptedReply();
  private listening = false;
  private generation = 0;
  private speaking = false;
  private awaitingReply = false;
  private lateCompletion = false;
  private nativeReply = new NativeReply();
  private checkingNative = false;
  private nativeAbort = new AbortController();
  private nativeCallerBaseline = 0;
  private sessionLimit?: ReturnType<typeof setTimeout>;
  usage: { totalTokenCount?: number; promptTokenCount?: number; responseTokenCount?: number } = {};

  constructor(
    private context: AudioContext,
    private stream: MediaStream,
    private ended: () => void,
    private clips: VoiceClips,
    private activity: (state: 'waiting' | 'speaking' | 'listening') => void = () => {},
    private validateNative?: (turn: NativeTurn, signal: AbortSignal) => Promise<void>,
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
            if (message.usageMetadata) {
              this.usage = message.usageMetadata;
              if (this.validateNative && (this.usage.totalTokenCount ?? 0) > 4000)
                throw new CallError('The practice call reached its usage limit. Please try again.');
            }
            if (message.setupComplete) {
              clearTimeout(timeout);
              this.ready = true;
              resolve();
            }
            const content = message.serverContent;
            if (content) {
              this.transcript.add('Caller', content.inputTranscription?.text);
              if (!this.finishing && !this.terminated && this.validateNative) {
                const hasOutput =
                  !!content.outputTranscription || !!content.modelTurn?.parts.length;
                if (hasOutput && (this.speaking || this.checkingNative))
                  throw new CallError('The assistant spoke out of turn. Please try again.');
                if (!this.speaking && !this.checkingNative && (hasOutput || content.turnComplete)) {
                  if (this.listening) {
                    this.send({ realtimeInput: { audioStreamEnd: true } });
                    this.setListening(false);
                    this.activity('waiting');
                  }
                  this.nativeReply.add(content);
                  if (content.turnComplete && !this.replyTimer)
                    this.replyTimer = setTimeout(
                      () =>
                        this.end(new CallError('The screening reply was incomplete. Try again.')),
                      3000,
                    );
                  if (this.nativeReply.ready) void this.playNativeReply();
                }
              } else if (!this.finishing && !this.terminated) {
                if (content.modelTurn?.parts.length) this.lateCompletion = false;
                if (content.turnComplete && !this.speaking) this.lateCompletion = true;
                if (content.outputTranscription?.text || content.modelTurn?.parts.length) {
                  if (this.listening) {
                    this.send({ realtimeInput: { audioStreamEnd: true } });
                    this.setListening(false);
                    this.activity('waiting');
                  }
                }
                this.reply += content.outputTranscription?.text ?? '';
                if (this.reply.length > 1000) throw new CallError('Unexpected screening response.');
                if (content.interrupted && !this.speaking) this.reply = '';
                if (
                  this.lateCompletion &&
                  !this.speaking &&
                  !this.awaitingReply &&
                  (!this.listening || this.reply.trim())
                ) {
                  this.awaitingReply = true;
                  // Retry on later fragments, but never wait indefinitely for a complete line.
                  this.replyTimer = setTimeout(() => {
                    if (this.closed || this.finishing) return;
                    this.end(new CallError('The screening response was incomplete. Try again.'));
                  }, 3000);
                }
                if (this.awaitingReply) this.playReply();
              }
            }
            if (message.goAway && this.ready) this.end(this.interrupted());
          })
          .catch((error) => {
            if (this.closed || this.terminated || this.finishing) return;
            this.fatal =
              error instanceof CallError
                ? error
                : new CallError(
                    'The live conversation could not be read. Nothing was sent. Please try again.',
                  );
            if (this.ready) this.end(this.fatal);
            else fail();
          });
      };
      socket.onerror = () => {
        if (this.ready) this.end(this.interrupted());
        else fail();
      };
      socket.onclose = () => {
        if (!this.closed && !this.finishing) {
          if (this.ready) this.end(this.interrupted());
          else fail();
        }
      };
    });
    if (this.closed || this.finishing || this.terminated) throw new CallError('Call cancelled.');
    await this.context.audioWorklet.addModule('/call/microphone');
    if (this.closed || this.finishing || this.terminated) throw new CallError('Call cancelled.');
    this.source = this.context.createMediaStreamSource(this.stream);
    this.capture = new AudioWorkletNode(this.context, 'call-capture');
    this.capture.port.onmessage = ({
      data,
    }: MessageEvent<{ samples: Float32Array; generation: number }>) => {
      if (this.closed || this.finishing || !this.listening || data.generation !== this.generation)
        return;
      if (socket.bufferedAmount > 256_000) {
        this.end(this.interrupted());
        return;
      }
      this.send({
        realtimeInput: {
          audio: {
            data: btoa(String.fromCharCode(...pcm16(data.samples))),
            mimeType: `audio/pcm;rate=${this.context.sampleRate}`,
          },
        },
      });
    };
    this.source.connect(this.capture);
    this.capture.connect(this.context.destination);
    if (this.validateNative) {
      this.sessionLimit = setTimeout(
        () =>
          this.end(new CallError('The practice call reached its time limit. Please try again.')),
        45_000,
      );
      this.send({
        clientContent: {
          turns: [{ role: 'model', parts: [{ text: this.clips.opening.text }] }],
          turnComplete: false,
        },
      });
      this.playClip(this.clips.opening.pcm, this.clips.opening.text, false);
      return;
    }
    this.send({
      clientContent: {
        turns: [
          { role: 'user', parts: [{ text: 'The demo caller has connected. Please greet them.' }] },
        ],
        turnComplete: true,
      },
    });
  }

  private setListening(enabled: boolean) {
    this.listening = enabled;
    this.generation += 1;
    this.capture?.port.postMessage({ enabled, generation: this.generation });
  }
  private playReply() {
    if (this.closed || this.finishing || this.script.isIncomplete(this.reply)) return;
    try {
      if (this.speaking) throw new CallError('The assistant spoke out of turn. Please try again.');
      const id = this.script.accept(this.reply);
      clearTimeout(this.replyTimer);
      this.awaitingReply = false;
      this.lateCompletion = false;
      this.reply = '';
      const clip = this.clips[id];
      this.playClip(clip.pcm, clip.text, id === 'closing');
    } catch (error) {
      this.end(error instanceof CallError ? error : new CallError('The voice could not play.'));
    }
  }
  private async playNativeReply() {
    if (
      !this.validateNative ||
      this.checkingNative ||
      this.closed ||
      this.finishing ||
      this.terminated
    )
      return;
    this.checkingNative = true;
    clearTimeout(this.replyTimer);
    this.replyTimer = undefined;
    try {
      if (this.transcript.text().length <= this.nativeCallerBaseline)
        throw new CallError('No caller speech was captured. Please try again.');
      const turn = this.nativeReply.take();
      await this.validateNative(turn, this.nativeAbort.signal);
      if (this.closed || this.finishing || this.terminated) return;
      this.playClip(turn.pcm, turn.text, turn.stage === 'closing');
    } catch (error) {
      if (!this.closed && !this.finishing && !this.terminated)
        this.end(
          error instanceof CallError
            ? error
            : new CallError('The assistant’s reply could not be checked. Try the English voice.'),
        );
    } finally {
      this.checkingNative = false;
    }
  }
  private playClip(pcm: string, text: string, closing: boolean) {
    if (this.listening) this.send({ realtimeInput: { audioStreamEnd: true } });
    this.setListening(false);
    this.speaking = true;
    this.activity('speaking');
    this.player.play(pcm, () => {
      if (this.closed || this.finishing) return;
      try {
        this.transcript.add('Assistant', text);
        this.nativeCallerBaseline = this.transcript.text().length;
      } catch {
        this.end(new CallError('The call transcript is too long. Nothing was sent.'));
        return;
      }
      this.speaking = false;
      if (closing) {
        this.end();
        return;
      }
      this.activityTimer = setTimeout(() => {
        if (this.closed || this.finishing) return;
        this.setListening(true);
        this.activity('listening');
      }, 150);
    });
  }
  private interrupted() {
    return new CallError('The call was interrupted. Nothing was sent. Please start a new call.');
  }
  private end(error?: CallError) {
    if (this.closed || this.terminated || this.finishing) return;
    this.terminated = true;
    this.nativeAbort.abort();
    clearTimeout(this.sessionLimit);
    this.fatal = error;
    this.stopMic();
    this.player.stop();
    clearTimeout(this.activityTimer);
    clearTimeout(this.replyTimer);
    this.ended();
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
    this.setListening(false);
    this.capture?.disconnect();
    this.source?.disconnect();
    this.stream.getTracks().forEach((track) => {
      track.stop();
    });
  }
  finish(): Promise<string> {
    this.finishing ??= (async () => {
      this.nativeAbort.abort();
      clearTimeout(this.sessionLimit);
      this.stopMic();
      this.player.stop();
      clearTimeout(this.replyTimer);
      clearTimeout(this.activityTimer);
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
    this.nativeAbort.abort();
    clearTimeout(this.sessionLimit);
    this.cancelStart?.();
    clearTimeout(this.activityTimer);
    clearTimeout(this.replyTimer);
    this.stopMic();
    this.player.dispose();
    this.socket?.close();
    void this.context.close().catch(() => {});
  }
}
