import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as Ack from '@/app/api/alerts/[id]/ack/route';
import * as Alerts from '@/app/api/alerts/route';
import * as Transcript from '@/app/api/calls/[id]/transcript/route';
import * as Calls from '@/app/api/calls/route';
import * as Devices from '@/app/api/devices/route';
import * as Invitations from '@/app/api/invitations/route';
import * as Token from '@/app/api/live-token/route';
import * as Sessions from '@/app/api/session/route';
import * as Config from '@/app/api/settings/route';
import * as Transcription from '@/app/api/transcribe/route';
import * as VoiceNote from '@/app/api/voice-note/route';
import { acknowledge, createAlert } from './alerts';
import { connectDevice, cookie, hash, inviteCaretaker, requireDevice, revokeDevice } from './auth';
import { reserveBudget } from './budget';
import { listCallViews, listSamAlerts, persistCall, saveSettings } from './calls';
import { closeDb, collections, ensureIndexes, transaction } from './db';
import { household, settingsTag } from './settings-store';
import { submitCall } from './submissions';
import { type Analysis, type CallRecord, Settings } from './types';

const { analyse, transcribe } = vi.hoisted(() => ({ analyse: vi.fn(), transcribe: vi.fn() }));
vi.mock('./analyse', () => ({ analyse }));
vi.mock('./transcribe', () => ({ transcribe }));

const analysis: Analysis = {
  band: 'strong',
  family: 'courier',
  cues: ['collect your cash'],
  summary: 'The caller wants a courier to collect cash.',
  nextSteps: ['call_159'],
  matchedPatternIds: ['courier-police-cash-collection'],
};
const accessCode = 'synthetic-private-code-for-tests';
let server: MongoMemoryReplSet;
beforeAll(async () => {
  server = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  vi.stubEnv('MONGODB_URI', server.getUri());
  vi.stubEnv('MONGODB_DB', 'halo_security_tests');
  vi.stubEnv('ELDER_DEMO_ACCESS_CODE', accessCode);
  vi.stubEnv('CALL_DEMO_ACCESS_CODE', accessCode);
  vi.stubEnv('DEMO_FALLBACK', '0');
  await ensureIndexes();
}, 60_000);
beforeEach(async () => {
  const { calls } = await collections();
  for (const { name } of await calls.db.listCollections().toArray())
    await calls.db.collection(name).deleteMany({});
  analyse.mockReset().mockResolvedValue(structuredClone(analysis));
  transcribe
    .mockReset()
    .mockResolvedValue('A courier will collect your cash. Do not tell your family.');
});
afterAll(async () => {
  await closeDb();
  if (server) await server.stop();
  vi.unstubAllEnvs();
});

const request = (
  path: string,
  method = 'GET',
  token?: string,
  body?: unknown,
  extra?: Record<string, string>,
) =>
  new Request(`https://demo.test${path}`, {
    method,
    headers: {
      origin: 'https://demo.test',
      ...(token ? { cookie: cookie(token).split(';')[0] as string } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...extra,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
const connect = (role: 'grandma' | 'caller') =>
  connectDevice({ role, name: `${role} phone`, code: accessCode });
async function caretaker() {
  const elder = await connect('grandma');
  const invitation = await inviteCaretaker(elder.device.id);
  const carer = await connectDevice({
    role: 'caretaker',
    name: 'Sam phone',
    code: invitation.code as string,
  });
  return { elder, carer };
}
const call = (id = crypto.randomUUID()): CallRecord => ({
  id,
  source: 'screener',
  createdAt: new Date().toISOString(),
  callerLabel: 'Synthetic caller',
  transcript: 'A courier will collect your cash.',
  analysis: structuredClone(analysis),
});
async function callSession(ownerId: string) {
  const id = crypto.randomUUID();
  await (await collections()).callSessions.insertOne({
    id,
    ownerId,
    status: 'open',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 600_000),
    cleanupAt: new Date(Date.now() + 600_000),
  });
  return {
    callSessionId: id,
    transcript: 'A courier will collect your cash.',
    callerLabel: 'Synthetic caller',
  };
}

describe('device authorization and invitation lifecycle', () => {
  it.each([
    ['/api/calls', 'GET', Calls.GET],
    ['/api/calls', 'POST', Calls.POST],
    ['/api/settings', 'GET', Config.GET],
    ['/api/settings', 'PUT', Config.PUT],
    ['/api/alerts', 'GET', Alerts.GET],
    ['/api/alerts', 'POST', Alerts.POST],
    ['/api/live-token', 'POST', Token.POST],
    ['/api/transcribe', 'POST', Transcription.POST],
    ['/api/voice-note', 'POST', VoiceNote.POST],
    ['/api/devices', 'GET', Devices.GET],
    ['/api/invitations', 'POST', Invitations.POST],
  ] as const)('denies anonymous %s %s before provider work', async (path, method, handler) => {
    const response = await handler(request(path, method));
    expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(analyse).not.toHaveBeenCalled();
    expect(transcribe).not.toHaveBeenCalled();
  });
  it('denies anonymous transcript reads and acknowledgements', async () => {
    expect(
      (
        await Transcript.GET(request('/api/calls/id/transcript'), {
          params: Promise.resolve({ id: 'id' }),
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await Ack.POST(request('/api/alerts/id/ack', 'POST'), {
          params: Promise.resolve({ id: 'id' }),
        })
      ).status,
    ).toBe(401);
  });
  it('fails closed for missing/short setup codes and rejects incorrect codes', async () => {
    const configured = process.env.ELDER_DEMO_ACCESS_CODE;
    try {
      process.env.ELDER_DEMO_ACCESS_CODE = '';
      await expect(connect('grandma')).rejects.toMatchObject({ status: 503 });
      process.env.ELDER_DEMO_ACCESS_CODE = 'short';
      await expect(connect('grandma')).rejects.toMatchObject({ status: 503 });
      process.env.ELDER_DEMO_ACCESS_CODE = configured;
      await expect(
        connectDevice({ role: 'grandma', name: 'test', code: 'wrong' }),
      ).rejects.toMatchObject({ status: 401 });
    } finally {
      process.env.ELDER_DEMO_ACCESS_CODE = configured;
    }
  });
  it('sets private cookies, stores only token hashes, and denies cross-origin login', async () => {
    const response = await Sessions.POST(
      request('/api/session', 'POST', undefined, {
        role: 'grandma',
        name: 'test',
        code: accessCode,
      }),
    );
    expect(response.status).toBe(201);
    expect(response.headers.get('set-cookie')).toContain(
      'HttpOnly; SameSite=Strict; Max-Age=28800',
    );
    const token = response.headers.get('set-cookie')?.split(';')[0]?.split('=')[1] as string;
    const found = await (await collections()).devices.findOne({ tokenHash: hash(token) });
    expect(JSON.stringify(found)).not.toContain(token);
    expect(
      (
        await Sessions.POST(
          request('/api/session', 'POST', undefined, {}, { origin: 'https://other.test' }),
        )
      ).status,
    ).toBe(403);
  });
  it('consumes an invitation only once under concurrent redemption', async () => {
    const elder = await connect('grandma');
    const invite = await inviteCaretaker(elder.device.id);
    const results = await Promise.allSettled(
      Array.from({ length: 4 }, () =>
        connectDevice({ role: 'caretaker', name: 'synthetic', code: invite.code as string }),
      ),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await (await collections()).devices.countDocuments({ role: 'caretaker' })).toBe(1);
  });
  it('rejects expired invitations and cancels the previous code when issuing another', async () => {
    const elder = await connect('grandma');
    const expired = await inviteCaretaker(elder.device.id, Date.now() - 600_001);
    await expect(
      connectDevice({ role: 'caretaker', name: 'test', code: expired.code as string }),
    ).rejects.toMatchObject({ status: 401 });
    const old = await inviteCaretaker(elder.device.id);
    await inviteCaretaker(elder.device.id);
    await expect(
      connectDevice({ role: 'caretaker', name: 'test', code: old.code as string }),
    ).rejects.toMatchObject({ status: 401 });
  });
  it('enforces role boundaries even with a forged matching Origin', async () => {
    const { carer } = await caretaker();
    expect((await Calls.GET(request('/api/calls', 'GET', carer.token))).status).toBe(403);
    expect((await Config.PUT(request('/api/settings', 'PUT', carer.token, {}))).status).toBe(403);
    expect((await Invitations.POST(request('/api/invitations', 'POST', carer.token))).status).toBe(
      403,
    );
    const caller = await connect('caller');
    expect((await Alerts.GET(request('/api/alerts', 'GET', caller.token))).status).toBe(403);
    expect((await Config.GET(request('/api/settings', 'GET', caller.token))).status).toBe(403);
  });
  it('rejects expired devices without waiting for Mongo TTL cleanup', async () => {
    const elder = await connect('grandma');
    await (await collections()).devices.updateOne(
      { id: elder.device.id },
      { $set: { expiresAt: new Date(0) } },
    );
    await expect(
      requireDevice(request('/', 'GET', elder.token), ['grandma']),
    ).rejects.toMatchObject({ status: 401 });
  });
  it('revokes a caretaker device and invalidates a logged-out session', async () => {
    const { elder, carer } = await caretaker();
    await revokeDevice(carer.device.id, elder.device.id);
    expect((await Alerts.GET(request('/api/alerts', 'GET', carer.token))).status).toBe(401);
    expect((await Sessions.DELETE(request('/api/session', 'DELETE', elder.token))).status).toBe(
      200,
    );
    expect((await Config.GET(request('/api/settings', 'GET', elder.token))).status).toBe(401);
  });
});

describe('consent and atomic writes', () => {
  it('rejects missing/stale ETags and cannot forge contact verification', async () => {
    await household();
    const current = await household();
    const next = Settings.parse(current);
    await expect(saveSettings(next, null)).rejects.toMatchObject({ status: 428 });
    const saved = await saveSettings(
      { ...next, paused: true, contact: { ...next.contact, verified: true } },
      settingsTag(current),
    );
    expect(saved.contact.verified).toBe(false);
    await expect(
      saveSettings({ ...next, paused: false }, settingsTag(current)),
    ).rejects.toMatchObject({ status: 412 });
    expect((await household()).paused).toBe(true);
  });
  it('never grants a past summary when consent later changes to automatic', async () => {
    const { carer } = await caretaker();
    const current = await household();
    await saveSettings(
      { ...Settings.parse(current), alertMode: 'ask_first' },
      settingsTag(current),
    );
    const saved = call();
    await persistCall(saved);
    await createAlert(saved.id, 'user_tap');
    const before = await household();
    await saveSettings(
      { ...Settings.parse(before), alertMode: 'auto_strong' },
      settingsTag(before),
    );
    expect((await listSamAlerts(carer.device.recipientId as string))[0]?.summary).toBeNull();
  });
  it('shares only the authorized snapshot and hides it after permission is withdrawn', async () => {
    const { carer } = await caretaker();
    const saved = call();
    await persistCall(saved);
    await (await collections()).calls.updateOne(
      { id: saved.id },
      { $set: { 'analysis.summary': 'A changed private summary.' } },
    );
    expect((await listSamAlerts(carer.device.recipientId as string))[0]?.summary).toBe(
      analysis.summary,
    );
    const current = await household();
    await saveSettings(
      { ...Settings.parse(current), alertMode: 'ask_first' },
      settingsTag(current),
    );
    expect((await listSamAlerts(carer.device.recipientId as string))[0]?.summary).toBeNull();
  });
  it('replacing the caretaker revokes devices/invitations and isolates previous alerts', async () => {
    const { elder, carer } = await caretaker();
    await persistCall(call());
    const oldInvite = await inviteCaretaker(elder.device.id);
    const current = await household();
    await saveSettings(
      { ...Settings.parse(current), contact: { name: 'Alex', verified: true } },
      settingsTag(current),
    );
    expect((await Alerts.GET(request('/api/alerts', 'GET', carer.token))).status).toBe(401);
    await expect(
      connectDevice({ role: 'caretaker', name: 'old', code: oldInvite.code as string }),
    ).rejects.toMatchObject({ status: 401 });
    const invite = await inviteCaretaker(elder.device.id);
    const replacement = await connectDevice({
      role: 'caretaker',
      name: 'Alex phone',
      code: invite.code as string,
    });
    expect(await listSamAlerts(replacement.device.recipientId as string)).toEqual([]);
  });
  it('creates exactly one alert under concurrent taps and acknowledgements retain the first time', async () => {
    const { carer } = await caretaker();
    const current = await household();
    await saveSettings(
      { ...Settings.parse(current), alertMode: 'ask_first' },
      settingsTag(current),
    );
    const saved = call();
    await persistCall(saved);
    const results = await Promise.all(
      Array.from({ length: 5 }, () => createAlert(saved.id, 'user_tap')),
    );
    expect(new Set(results.map((a) => a.id)).size).toBe(1);
    expect(await (await collections()).alerts.countDocuments({})).toBe(1);
    const first = await acknowledge(results[0]?.id as string, carer.device.recipientId as string);
    const second = await acknowledge(results[0]?.id as string, carer.device.recipientId as string);
    expect(second?.acknowledgedAt).toBe(first?.acknowledgedAt);
    expect(JSON.stringify(await listSamAlerts(carer.device.recipientId as string))).not.toMatch(
      /transcript|cues|tokenHash|recipientId|sharedSummary/,
    );
    expect(JSON.stringify(await listCallViews())).not.toContain('recipientId');
  });
  it('creates no automatic or tapped alert after a committed pause', async () => {
    await caretaker();
    const current = await household();
    await saveSettings({ ...Settings.parse(current), paused: true }, settingsTag(current));
    const saved = call();
    await persistCall(saved);
    await expect(createAlert(saved.id, 'user_tap')).rejects.toMatchObject({ status: 409 });
    expect(await (await collections()).alerts.countDocuments({})).toBe(0);
    expect(await (await collections()).calls.countDocuments({})).toBe(1);
  });
  it('rolls back writes together when a transaction fails', async () => {
    const saved = call();
    await expect(
      transaction(async (session) => {
        await (await collections()).calls.insertOne(saved, { session });
        throw new Error('synthetic failure');
      }),
    ).rejects.toThrow('synthetic failure');
    expect(await (await collections()).calls.countDocuments({})).toBe(0);
  });
});

describe('recoverable submissions and durable budgets', () => {
  it('binds sessions to a device, expires unused sessions and rejects changed retry payloads', async () => {
    const owner = await connect('caller');
    const body = await callSession(owner.device.id);
    await expect(submitCall(body, 'another-device')).rejects.toMatchObject({ status: 403 });
    await submitCall(body, owner.device.id);
    await expect(
      submitCall({ ...body, transcript: 'Changed conversation' }, owner.device.id),
    ).rejects.toMatchObject({ status: 409 });
    const expired = await callSession(owner.device.id);
    await (await collections()).callSessions.updateOne(
      { id: expired.callSessionId },
      { $set: { expiresAt: new Date(0) } },
    );
    await expect(submitCall(expired, owner.device.id)).rejects.toMatchObject({ status: 410 });
  });
  it('returns the same saved call on retry without repeating analysis or alert creation', async () => {
    await caretaker();
    const owner = await connect('caller');
    const body = await callSession(owner.device.id);
    const saved = await submitCall(body, owner.device.id);
    expect(await submitCall(body, owner.device.id)).toEqual(saved);
    expect(analyse).toHaveBeenCalledOnce();
    const c = await collections();
    expect(await c.calls.countDocuments({})).toBe(1);
    expect(await c.alerts.countDocuments({})).toBe(1);
    const receipt = await c.callSessions.findOne({ id: body.callSessionId });
    expect(receipt?.status).toBe('completed');
    expect(receipt?.cleanupAt.getTime()).toBeGreaterThan(Date.now() + 23 * 3_600_000);
  });
  it('admits one simultaneous submission and permits recovery after analysis failure', async () => {
    const owner = await connect('caller');
    const body = await callSession(owner.device.id);
    analyse.mockRejectedValueOnce(new Error('synthetic provider failure'));
    await expect(submitCall(body, owner.device.id)).rejects.toThrow('synthetic provider failure');
    const results = await Promise.allSettled(
      Array.from({ length: 4 }, () => submitCall(body, owner.device.id)),
    );
    expect(results.some((r) => r.status === 'fulfilled')).toBe(true);
    expect(await (await collections()).calls.countDocuments({})).toBe(1);
    expect(analyse).toHaveBeenCalledTimes(2);
  });
  it('transcribes voice-note retries once, returns one call, and uses voice-note analysis', async () => {
    const owner = await connect('grandma');
    const id = crypto.randomUUID();
    const upload = () => {
      const form = new FormData();
      form.append('audio', new Blob(['synthetic audio'], { type: 'audio/webm;codecs=opus' }));
      return new Request('https://demo.test/api/voice-note', {
        method: 'POST',
        headers: {
          origin: 'https://demo.test',
          cookie: cookie(owner.token).split(';')[0] as string,
          'x-voice-note-id': id,
        },
        body: form,
      });
    };
    const first = await VoiceNote.POST(upload());
    const second = await VoiceNote.POST(upload());
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(await second.json()).toEqual(await first.json());
    expect(transcribe).toHaveBeenCalledOnce();
    expect(analyse).toHaveBeenCalledWith(expect.any(String), 'voice_note');
  });
  it('returns a plain 502 for transcription failures and does not run analysis', async () => {
    const owner = await connect('caller');
    const body = await callSession(owner.device.id);
    const form = new FormData();
    form.append('audio', new Blob(['synthetic audio'], { type: 'audio/wav' }));
    transcribe.mockRejectedValueOnce(new Error('sensitive upstream error'));
    const response = await Transcription.POST(
      new Request('https://demo.test/api/transcribe', {
        method: 'POST',
        headers: {
          origin: 'https://demo.test',
          cookie: cookie(owner.token).split(';')[0] as string,
          'x-call-session-id': body.callSessionId,
        },
        body: form,
      }),
    );
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('sensitive');
    expect(analyse).not.toHaveBeenCalled();
  });
  it('admits only six concurrent provider starts across shared counters', async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () => reserveBudget('transcribe')),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(6);
    expect(results.filter((r) => r.status === 'rejected' && r.reason.status === 429)).toHaveLength(
      14,
    );
  });
  it('enforces authentication and hourly provider limits with retry intervals', async () => {
    const now = 3_601_000;
    for (let i = 0; i < 10; i++) await reserveBudget('auth', now);
    await expect(reserveBudget('auth', now)).rejects.toMatchObject({ status: 429, retryAfter: 59 });
    const { calls } = await collections();
    await calls.db.collection('call_token_budgets').insertOne({
      _id: 'analyse:3600000:1',
      count: 60,
      expiresAt: new Date(Date.now() + 10000),
    } as never);
    await expect(reserveBudget('analyse', now)).rejects.toMatchObject({
      status: 429,
      retryAfter: 3599,
    });
  });
});
