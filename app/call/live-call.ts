import type { NativeVoice } from '@/app/api/live-token/native-session';
import { AudioPlayer } from './audio-player';
import { NativeReply, type NativeTurn } from './native-speech';
import { LiveMessage, pcm16, Transcript } from './protocol';
import { CallError } from './request';
import type { VoiceClips } from './scripted-voice';

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
  private pending = Promise.resolve();
  private fatal?: Error;
  private listening = false;
  private generation = 0;
  private speaking = false;
  private nativeReply = new NativeReply();
  private checkingNative = false;
  private nativeAbort = new AbortController();
  private nativeCallerBaseline = 0;
  private drainTimer?: ReturnType<typeof setTimeout>;
  private lateOutput = false;
  usage: { totalTokenCount?: number; promptTokenCount?: number; responseTokenCount?: number } = {};

  constructor(
    private context: AudioContext,
    private stream: MediaStream,
    private ended: () => void,
    private clips: VoiceClips,
    private voice: NativeVoice,
    private validate: (turn: NativeTurn, signal: AbortSignal) => Promise<void>,
    private activity: (state: 'waiting' | 'speaking' | 'listening') => void = () => {},
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
              if ((this.usage.totalTokenCount ?? 0) > 4000) {
                // The cutoff guards cost, so a call that already heard the caller is still sent.
                this.end(
                  this.transcript.hasCaller()
                    ? undefined
                    : new CallError('The practice call reached its usage limit. Please try again.'),
                );
                return;
              }
            }
            if (message.setupComplete) {
              clearTimeout(timeout);
              this.ready = true;
              resolve();
            }
            const content = message.serverContent;
            if (content) {
              this.transcript.add('Caller', content.inputTranscription?.text);
              if (!this.finishing && !this.terminated) {
                const hasOutput =
                  !!content.outputTranscription || !!content.modelTurn?.parts.length;
                if (hasOutput && (this.speaking || this.checkingNative)) {
                  if (this.voice !== 'english')
                    throw new CallError('The assistant spoke out of turn. Please try again.');
                  // Output during a check means the checked text may not match the audio.
                  this.lateOutput = true;
                }
                if (!this.speaking && !this.checkingNative && (hasOutput || content.turnComplete)) {
                  if (this.listening) {
                    this.send({ realtimeInput: { audioStreamEnd: true } });
                    this.setListening(false);
                    this.activity('waiting');
                  }
                  this.nativeReply.add(content);
                  if (this.nativeReply.ready && !this.drainTimer)
                    this.drainTimer = setTimeout(() => {
                      this.drainTimer = undefined;
                      void this.playNativeReply();
                    }, 300);
                }
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
    this.send({
      clientContent: {
        turns: [{ role: 'model', parts: [{ text: this.clips.opening.text }] }],
        turnComplete: false,
      },
    });
    this.playClip(this.clips.opening.pcm, this.clips.opening.text, false);
  }

  private setListening(enabled: boolean) {
    this.listening = enabled;
    this.generation += 1;
    this.capture?.port.postMessage({ enabled, generation: this.generation });
  }
  private async playNativeReply() {
    if (this.checkingNative || this.closed || this.finishing || this.terminated) return;
    this.checkingNative = true;
    this.lateOutput = false;
    try {
      if (this.transcript.text().length <= this.nativeCallerBaseline)
        throw new CallError('No caller speech was captured. Please try again.');
      const line = await this.nextLine();
      if (this.closed || this.finishing || this.terminated) return;
      this.playClip(line.pcm, line.text, line.closing);
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
  private async nextLine() {
    if (this.voice === 'english' && this.nativeReply.stage === 'closing') {
      this.nativeReply.skip();
      return { ...this.clips.closing, closing: true };
    }
    try {
      const turn = this.nativeReply.advance();
      await this.validate(turn, this.nativeAbort.signal);
      if (this.lateOutput)
        throw new CallError('The assistant spoke out of turn. Please try again.');
      return { pcm: turn.pcm, text: turn.text, closing: turn.stage === 'closing' };
    } catch (error) {
      if (this.voice !== 'english') throw error;
      return { ...this.clips.followup, closing: false };
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
    clearTimeout(this.drainTimer);
    this.fatal = error;
    this.stopMic();
    this.player.stop();
    clearTimeout(this.activityTimer);
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
      clearTimeout(this.drainTimer);
      this.stopMic();
      this.player.stop();
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
    clearTimeout(this.drainTimer);
    this.cancelStart?.();
    clearTimeout(this.activityTimer);
    this.stopMic();
    this.player.dispose();
    this.socket?.close();
    void this.context.close().catch(() => {});
  }
}
