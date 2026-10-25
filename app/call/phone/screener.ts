import type { z } from 'zod';
import { NativeReply, type NativeTurn } from '../native-speech';
import { LiveMessage, Transcript } from '../protocol';
import { CallError } from '../request';

type Message = z.infer<typeof LiveMessage>;
export type Clip = { text: string; pcm: string };
export type Stage =
  | 'assistant'
  | 'listening'
  | 'caller'
  | 'drafting'
  | 'drafted'
  | 'checked'
  | 'fallback'
  | 'noise'
  | 'stopped';

export type ScreenerDeps = {
  /** Sends a message to Gemini Live. */
  send(value: unknown): void;
  /** Plays 24 kHz PCM to the caller; `heard` runs once the caller has heard all of it. */
  play(pcm: string, heard: () => void): void;
  /** Drops audio the caller has not heard yet. */
  silence(): void;
  /** Asks the Halo app whether a drafted follow-up may be spoken. */
  check(turn: NativeTurn, signal: AbortSignal): Promise<boolean>;
  log(stage: Stage, detail: string): void;
  /** The call is over: hang up, then drain and deliver the transcript. */
  ended(): void;
  clips: { opening: Clip; followup: Clip; closing: Clip };
};

const CALL_LIMIT_MS = 45_000;
const TOKEN_LIMIT = 4_000;

/**
 * One phone call's screening turns, in English: the prerecorded opening, one follow-up that
 * Gemini drafts and the Halo app checks (or the prerecorded one), then the prerecorded closing.
 */
export class PhoneScreener {
  readonly transcript = new Transcript();
  fatal?: CallError;
  done = false;
  private reply = new NativeReply();
  private begun = false;
  private listening = false;
  private speaking = false;
  private checking = false;
  private lateOutput = false;
  private heard = '';
  private shown = 0;
  private drafting = false;
  private playing = 0;
  private drain?: ReturnType<typeof setTimeout>;
  private resume?: ReturnType<typeof setTimeout>;
  private limit?: ReturnType<typeof setTimeout>;
  private abort = new AbortController();

  constructor(private deps: ScreenerDeps) {}

  /** Caller audio as base64 PCM at 8 kHz; only forwarded while it is the caller's turn. */
  callerAudio(pcm: string) {
    if (!this.listening || this.done) return;
    this.deps.send({ realtimeInput: { audio: { data: pcm, mimeType: 'audio/pcm;rate=8000' } } });
  }

  gemini(raw: string) {
    let message: Message;
    try {
      message = LiveMessage.parse(JSON.parse(raw));
    } catch {
      this.stop(new CallError('The live conversation could not be read.'));
      return;
    }
    const tokens = message.usageMetadata?.totalTokenCount ?? 0;
    // The cutoff guards cost, so a call that already heard the caller is still sent.
    if (tokens > TOKEN_LIMIT)
      this.stop(this.transcript.hasCaller() ? undefined : new CallError('Usage limit reached.'));
    if (message.setupComplete && !this.begun) this.begin();
    const content = message.serverContent;
    if (content) {
      const words = content.inputTranscription?.text;
      if (words) {
        try {
          this.transcript.add('Caller', words);
        } catch {
          this.stop(new CallError('The call transcript is too long.'));
          return;
        }
        this.heard += words;
      }
      if (!this.done) this.output(content);
    }
    if (message.goAway) this.stop(new CallError('Gemini closed the session.'));
  }

  /** Ends the call once. Without an error, what the caller said is delivered. */
  stop(error?: CallError) {
    if (this.done) return;
    this.done = true;
    this.fatal = error;
    this.abort.abort();
    clearTimeout(this.drain);
    clearTimeout(this.resume);
    clearTimeout(this.limit);
    this.pauseListening();
    this.deps.silence();
    this.deps.log('stopped', error ? error.message : 'call complete');
    this.deps.ended();
  }

  get started() {
    return this.begun;
  }

  private begin() {
    this.begun = true;
    this.limit = setTimeout(() => this.stop(), CALL_LIMIT_MS);
    const { opening } = this.deps.clips;
    this.deps.send({
      clientContent: {
        turns: [{ role: 'model', parts: [{ text: opening.text }] }],
        turnComplete: false,
      },
    });
    this.say(opening, false, 'prerecorded');
  }

  private output(content: NonNullable<Message['serverContent']>) {
    const hasOutput = !!content.outputTranscription || !!content.modelTurn?.parts.length;
    // Output while a line plays or is checked is late; a checked draft must match its audio.
    if (hasOutput && (this.speaking || this.checking)) {
      this.lateOutput = true;
      return;
    }
    if (this.speaking || this.checking || !(hasOutput || content.turnComplete)) return;
    this.pauseListening();
    if (this.reply.stage === 'closing') {
      // A silent noise turn: keep listening.
      if (!hasOutput && !this.heard.trim()) return this.listen();
      // English always closes with the prerecorded line, so it need not wait for Gemini's.
      this.reply.skip();
      this.callerSaid();
      this.say(this.deps.clips.closing, true, 'prerecorded');
      return;
    }
    if (hasOutput && !this.drafting) {
      this.drafting = true;
      this.callerSaid();
      this.deps.log('drafting', 'Gemini is writing a follow-up question');
    }
    this.reply.add(content);
    // Gemini Live sends no end-of-transcription marker, so let the last words land.
    if (this.reply.ready && !this.drain)
      this.drain = setTimeout(() => {
        this.drain = undefined;
        void this.answer();
      }, 300);
  }

  private async answer() {
    if (this.checking || this.done) return;
    this.checking = true;
    this.lateOutput = false;
    try {
      // A silent noise turn: keep listening. A spoken reply means Gemini heard the caller.
      if (!this.heard.trim() && this.reply.empty) {
        this.reply.discard();
        this.deps.log('noise', 'ignored a sound; still listening');
        this.listen();
        return;
      }
      this.callerSaid();
      let line = this.deps.clips.followup;
      let source: 'generated' | 'prerecorded' = 'prerecorded';
      try {
        const turn = this.reply.advance();
        this.deps.log('drafted', turn.text);
        const began = Date.now();
        const approved = await this.deps.check(turn, this.abort.signal);
        const seconds = ((Date.now() - began) / 1000).toFixed(1);
        if (approved && !this.lateOutput) {
          this.deps.log('checked', `approved in ${seconds}s`);
          line = { text: turn.text, pcm: turn.pcm };
          source = 'generated';
        } else
          this.deps.log('fallback', `not approved (${seconds}s); using the prerecorded question`);
      } catch (error) {
        this.deps.log(
          'fallback',
          `${error instanceof Error ? error.message : 'draft unusable'}; using the prerecorded question`,
        );
      }
      if (this.done) return;
      this.say(line, false, source);
    } finally {
      this.checking = false;
    }
  }

  private say(clip: Clip, closing: boolean, source: 'generated' | 'prerecorded') {
    this.pauseListening();
    this.speaking = true;
    this.heard = '';
    this.shown = 0;
    this.drafting = false;
    const playing = ++this.playing;
    this.deps.log('assistant', `${clip.text} (${source})`);
    this.deps.play(clip.pcm, () => {
      if (this.done || playing !== this.playing) return;
      try {
        this.transcript.add('Assistant', clip.text);
      } catch {
        this.stop(new CallError('The call transcript is too long.'));
        return;
      }
      this.speaking = false;
      if (closing) this.stop();
      else this.resume = setTimeout(() => this.listen(), 150);
    });
  }

  /** Shows the caller's words not yet shown; transcription can trail the reply. */
  private callerSaid() {
    const words = this.heard.slice(this.shown).trim();
    this.shown = this.heard.length;
    if (words) this.deps.log('caller', words);
  }

  private listen() {
    if (this.done) return;
    this.listening = true;
    this.deps.log('listening', 'caller’s turn');
  }

  private pauseListening() {
    if (this.listening) this.deps.send({ realtimeInput: { audioStreamEnd: true } });
    this.listening = false;
  }
}
