/**
 * Halo's phone line: answers a Twilio number and screens the call with the same Gemini Live
 * setup, Sulafat lines, follow-up check and analysis as /call. Run with `pnpm phone`.
 * Setup: app/call/phone/README.md.
 */
import { type ChildProcess, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import WebSocket, { WebSocketServer } from 'ws';
import { z } from 'zod';
import { CallError } from '../request';
import { Clips, type VoiceClips } from '../scripted-voice';
import clipFile from '../voice/clips.json';
import { geminiToPhone, phoneToGemini } from './audio';
import { type HaloClient, haloClient } from './halo';
import { pipeline } from './pipeline';
import { PhoneScreener } from './screener';
import { BUSY_TWIML, pointNumberAt, StreamEvent, streamTwiml, validTwilioRequest } from './twilio';

const HINTS: Record<string, string> = {
  TWILIO_ACCOUNT_SID: 'starts with AC, on the Twilio console home page',
  TWILIO_AUTH_TOKEN: '32 characters, next to the Account SID',
  TWILIO_PHONE_NUMBER: 'your Twilio number in +E.164 form, like +15551234567',
  CALL_DEMO_ACCESS_CODE: 'the event demo code that /call asks for',
};
const Env = z.object({
  TWILIO_ACCOUNT_SID: z.string().regex(/^AC[0-9a-f]{32}$/),
  TWILIO_AUTH_TOKEN: z.string().regex(/^[0-9a-f]{32}$/),
  TWILIO_PHONE_NUMBER: z.string().regex(/^\+[1-9]\d{6,14}$/),
  CALL_DEMO_ACCESS_CODE: z.string().min(16),
  HALO_URL: z.url().default('https://hang-up-and-check.vercel.app'),
  PHONE_BRIDGE_PORT: z.coerce.number().int().min(1024).max(65535).default(8787),
  // Set to use your own tunnel; the Twilio webhook is then left for you to point here.
  PHONE_PUBLIC_URL: z.url().optional(),
});
type Env = z.infer<typeof Env>;

const GEMINI_LIVE =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained';
const MAX_CALLS = 1;
const SamAlerts = z.array(z.object({ createdAt: z.string() }));

function readEnv(): Env {
  const env = Env.safeParse(process.env);
  if (env.success) return env.data;
  console.error('The phone line needs these in .env (see app/call/phone/README.md):');
  for (const issue of env.error.issues) {
    const key = String(issue.path[0]);
    const state = process.env[key] === undefined ? 'missing' : 'not valid';
    console.error(`  ${key}: ${state}${HINTS[key] ? `, ${HINTS[key]}` : ''}`);
  }
  process.exit(1);
}

function loadClips(): VoiceClips {
  return Clips.parse(
    Object.fromEntries(
      Object.entries(clipFile).map(([id, { text, pcmHex }]) => [
        id,
        { text, pcm: Buffer.from(pcmHex, 'hex').toString('base64') },
      ]),
    ),
  );
}

/** One answered phone call, from the first audio frame to the card on her phone. */
class PhoneCall {
  readonly screener: PhoneScreener;
  private gemini?: WebSocket;
  private sessionId = '';
  private marks = new Map<string, () => void>();
  private markCount = 0;
  private over = false;

  constructor(
    private phone: WebSocket,
    private streamSid: string,
    private halo: HaloClient,
    private haloUrl: string,
    private log: ReturnType<typeof pipeline>,
    clips: VoiceClips,
    private released: () => void,
  ) {
    this.screener = new PhoneScreener({
      clips,
      send: (value) => {
        if (this.gemini?.readyState === WebSocket.OPEN) this.gemini.send(JSON.stringify(value));
      },
      play: (pcm, heard) => this.play(pcm, heard),
      silence: () => this.toPhone({ event: 'clear', streamSid }),
      check: (turn, signal) => this.halo.check(this.sessionId, turn, signal),
      log: (stage, detail) => this.log.log(stage, detail),
      ended: () => void this.wrapUp(),
    });
  }

  async run() {
    this.log.log('phone', 'answered (caller ID is not read or shown)');
    let session: Awaited<ReturnType<HaloClient['startCall']>>;
    try {
      session = await this.halo.startCall();
    } catch (error) {
      this.log.log('halo', `${(error as Error).message} The caller hears nothing; hanging up.`);
      this.close();
      return;
    }
    if (this.over) return;
    this.sessionId = session.callSessionId;
    this.log.log('halo', 'call session issued (access code and call budget checked)');
    const gemini = new WebSocket(
      `${GEMINI_LIVE}?access_token=${encodeURIComponent(session.token)}`,
    );
    this.gemini = gemini;
    const connecting = setTimeout(
      () => this.screener.stop(new CallError('Gemini took too long to connect.')),
      15_000,
    );
    gemini.on('open', () =>
      gemini.send(JSON.stringify({ setup: { model: `models/${session.model}` } })),
    );
    gemini.on('message', (data) => {
      const started = this.screener.started;
      this.screener.gemini(data.toString());
      if (!started && this.screener.started) {
        clearTimeout(connecting);
        this.log.log(
          'gemini',
          `Live session open: ${session.model}, Sulafat voice, settings locked by Halo`,
        );
      }
    });
    const lost = () => {
      clearTimeout(connecting);
      if (this.over) return;
      this.screener.stop(new CallError('Gemini disconnected.'));
    };
    gemini.on('close', lost);
    gemini.on('error', lost);
  }

  audio(payload: string) {
    this.screener.callerAudio(phoneToGemini(payload));
  }

  marked(name: string) {
    const heard = this.marks.get(name);
    this.marks.delete(name);
    heard?.();
  }

  /** The caller hung up: deliver what they said, as the browser's Hang up does. */
  hungUp() {
    if (this.screener.started) this.screener.stop();
    else this.close();
  }

  private play(pcm: string, heard: () => void) {
    for (const payload of geminiToPhone(pcm))
      this.toPhone({ event: 'media', streamSid: this.streamSid, media: { payload } });
    // Twilio echoes a mark once everything sent before it has played to the caller.
    const name = `line-${++this.markCount}`;
    this.marks.set(name, heard);
    this.toPhone({ event: 'mark', streamSid: this.streamSid, mark: { name } });
  }

  private toPhone(value: unknown) {
    if (this.phone.readyState === WebSocket.OPEN) this.phone.send(JSON.stringify(value));
  }

  private close() {
    if (this.over) return;
    this.over = true;
    this.phone.close();
    this.gemini?.close();
    this.released();
  }

  private async wrapUp() {
    if (this.over) return;
    this.phone.close();
    this.log.log('phone', 'hung up');
    // Caller transcription arrives independently, so let the last words land.
    if (this.gemini?.readyState === WebSocket.OPEN) await new Promise((r) => setTimeout(r, 2000));
    this.close();
    const { fatal, transcript } = this.screener;
    if (fatal) {
      this.log.log('stopped', `${fatal.message} Nothing was sent.`);
      return;
    }
    if (!transcript.hasCaller()) {
      this.log.log('stopped', 'No caller speech was captured. Nothing was sent.');
      return;
    }
    const text = transcript.text();
    this.log.log(
      'transcript',
      `${text.split('\n').length} turns, ${text.length} characters → Halo /api/calls`,
    );
    try {
      const record = await this.halo.deliver(this.sessionId, text);
      this.log.analysis(record);
      this.log.log('alert', `card is on her Alerts screen: ${this.haloUrl}/loved-one`);
      await this.reportAlert(record.createdAt);
    } catch (error) {
      this.log.log(
        'stopped',
        `${(error as Error).message} Check /loved-one before calling again; it may have arrived.`,
      );
    }
  }

  private async reportAlert(since: string) {
    try {
      const response = await fetch(`${this.haloUrl}/api/alerts`, {
        signal: AbortSignal.timeout(10_000),
      });
      const alerts = SamAlerts.parse(await response.json());
      const sent = alerts.some((alert) => Date.parse(alert.createdAt) >= Date.parse(since));
      this.log.log(
        'alert',
        sent
          ? `sent automatically to her person's phone: ${this.haloUrl}/caregiver`
          : 'no automatic alert; her consent setting decides, and she can tell her person herself',
      );
    } catch {
      this.log.log('alert', 'could not read alert status; check /caregiver');
    }
  }
}

function openTunnel(port: number): Promise<{ url: string; child: ChildProcess }> {
  const child = spawn(
    'cloudflared',
    ['tunnel', '--no-autoupdate', '--url', `http://127.0.0.1:${port}`],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('cloudflared opened no tunnel in 30 seconds.')),
      30_000,
    );
    const scan = (chunk: Buffer) => {
      const url = chunk.toString().match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)?.[0];
      if (!url) return;
      clearTimeout(timer);
      resolve({ url, child });
    };
    child.stdout.on('data', scan);
    child.stderr.on('data', scan);
    child.on('error', () =>
      reject(new Error('cloudflared is not installed: brew install cloudflared')),
    );
    child.on('exit', (code) => reject(new Error(`cloudflared exited (${code}).`)));
  });
}

// A new quick tunnel takes a few seconds to resolve; Twilio's first request must not fail.
async function waitUntilReachable(url: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3_000) });
      if (response.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1_000));
  }
  throw new Error(`The tunnel ${url} never became reachable.`);
}

function readForm(request: IncomingMessage): Promise<Record<string, string> | null> {
  return new Promise((resolve) => {
    let body = '';
    const timer = setTimeout(() => {
      request.destroy();
      resolve(null);
    }, 5_000);
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => {
      body += chunk;
      if (body.length > 16_384) {
        clearTimeout(timer);
        request.destroy();
        resolve(null);
      }
    });
    request.on('end', () => {
      clearTimeout(timer);
      resolve(Object.fromEntries(new URLSearchParams(body)));
    });
    request.on('error', () => {
      clearTimeout(timer);
      resolve(null);
    });
  });
}

async function main() {
  const env = readEnv();
  const haloUrl = env.HALO_URL.replace(/\/$/, '');
  const halo = haloClient(haloUrl, env.CALL_DEMO_ACCESS_CODE);
  const clips = loadClips();
  let publicUrl = env.PHONE_PUBLIC_URL?.replace(/\/$/, '') ?? '';
  const tickets = new Map<string, number>();
  let calls = 0;
  let callNumber = 0;
  const busy = () => {
    for (const [ticket, expiry] of tickets) if (expiry < Date.now()) tickets.delete(ticket);
    return calls + tickets.size >= MAX_CALLS;
  };

  const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method === 'GET' && request.url === '/health') return void response.end('ok');
    if (request.method !== 'POST' || request.url !== '/twilio/voice') {
      response.statusCode = 404;
      return void response.end();
    }
    const form = await readForm(request);
    const signature = request.headers['x-twilio-signature'];
    if (
      !form ||
      form.AccountSid !== env.TWILIO_ACCOUNT_SID ||
      !validTwilioRequest(
        env.TWILIO_AUTH_TOKEN,
        `${publicUrl}/twilio/voice`,
        form,
        typeof signature === 'string' ? signature : undefined,
      )
    ) {
      response.statusCode = 403;
      return void response.end();
    }
    response.setHeader('Content-Type', 'text/xml');
    if (busy()) return void response.end(BUSY_TWIML);
    const ticket = randomBytes(24).toString('hex');
    tickets.set(ticket, Date.now() + 30_000);
    response.end(streamTwiml(`${publicUrl.replace(/^http/, 'ws')}/twilio/media`, ticket));
  });

  const sockets = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });
  server.on('upgrade', (request, socket, head) => {
    if (request.url !== '/twilio/media') return void socket.destroy();
    sockets.handleUpgrade(request, socket, head, (phone) => {
      let call: PhoneCall | undefined;
      // Twilio sends "start" straight away; a stream without a valid ticket is dropped.
      const unclaimed = setTimeout(() => phone.close(), 10_000);
      phone.on('message', (data, binary) => {
        if (binary) return;
        let event: StreamEvent;
        try {
          const parsed = StreamEvent.safeParse(JSON.parse(data.toString()));
          if (!parsed.success) return;
          event = parsed.data;
        } catch {
          return;
        }
        if (event.event === 'start' && !call) {
          const expiry = tickets.get(event.start.customParameters.ticket ?? '');
          tickets.delete(event.start.customParameters.ticket ?? '');
          if (!expiry || expiry < Date.now()) return void phone.close();
          clearTimeout(unclaimed);
          calls += 1;
          let released = false;
          call = new PhoneCall(
            phone,
            event.streamSid,
            halo,
            haloUrl,
            pipeline(++callNumber),
            clips,
            () => {
              if (released) return;
              released = true;
              calls -= 1;
            },
          );
          void call.run();
        } else if (event.event === 'media') call?.audio(event.media.payload);
        else if (event.event === 'mark') call?.marked(event.mark.name);
        else if (event.event === 'stop') call?.hungUp();
      });
      phone.on('close', () => {
        clearTimeout(unclaimed);
        call?.hungUp();
      });
    });
  });

  await new Promise<void>((resolve) => server.listen(env.PHONE_BRIDGE_PORT, '127.0.0.1', resolve));
  let tunnel: ChildProcess | undefined;
  const stop = () => {
    tunnel?.kill();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  try {
    if (!publicUrl) {
      const opened = await openTunnel(env.PHONE_BRIDGE_PORT);
      tunnel = opened.child;
      publicUrl = opened.url;
      await waitUntilReachable(publicUrl);
      await pointNumberAt(
        {
          sid: env.TWILIO_ACCOUNT_SID,
          token: env.TWILIO_AUTH_TOKEN,
          number: env.TWILIO_PHONE_NUMBER,
        },
        `${publicUrl}/twilio/voice`,
      );
    }
  } catch (error) {
    console.error((error as Error).message);
    tunnel?.kill();
    process.exit(1);
  }
  console.log(`
Halo phone line is ready.
  Call      ${env.TWILIO_PHONE_NUMBER} from any phone
  Screens   through ${haloUrl}: cards land on /loved-one
  Webhook   ${publicUrl}/twilio/voice${env.PHONE_PUBLIC_URL ? ' (point your Twilio number here)' : ' (set on your Twilio number)'}
  Stop      Ctrl-C`);
}

void main();
