import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { insertOne } = vi.hoisted(() => ({ insertOne: vi.fn() }));
const { createNativeSession } = vi.hoisted(() => ({ createNativeSession: vi.fn() }));
vi.mock('./native-session', () => ({ createNativeSession }));
vi.mock('./guard', () => ({ accessStatus: () => 200, reserveCallBudget: async () => null }));
vi.mock('@/lib/db', () => ({ collections: async () => ({ callSessions: { insertOne, db: {} } }) }));

import { POST } from './route';
import { tokenRequest } from './token';

const request = (suffix = '', origin = 'https://demo.test') =>
  new Request(`https://demo.test/api/live-token${suffix}`, { method: 'POST', headers: { origin } });
beforeEach(() => {
  vi.stubEnv('GEMINI_API_KEY', 'synthetic-test-key');
  vi.stubEnv('DEMO_FALLBACK', '0');
  vi.stubEnv('HALO_MULTILINGUAL_PILOT', '0');
  insertOne.mockReset();
  createNativeSession.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe('live token endpoint', () => {
  it('gates native mode and locks its compact prompt and output cap server-side', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ name: 'auth_tokens/synthetic' }));
    vi.stubGlobal('fetch', fetcher);
    expect((await POST(request('?voice=automatic'))).status).toBe(503);
    expect(fetcher).not.toHaveBeenCalled();
    vi.stubEnv('HALO_MULTILINGUAL_PILOT', '1');
    expect((await POST(request('?voice=automatic'))).status).toBe(201);
    const setup = JSON.parse(fetcher.mock.calls[0]?.[1].body).bidiGenerateContentSetup;
    expect(setup.generationConfig.maxOutputTokens).toBe(1024);
    expect(setup.systemInstruction.parts[0].text).toContain('spoken language');
    expect(setup.systemInstruction.parts[0].text).toContain('untrusted');
    expect(setup.generationConfig.thinkingConfig).toBeUndefined();
    expect(createNativeSession).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      'automatic',
    );
    expect((await POST(request('?voice=unknown'))).status).toBe(400);
  });
  it('locks model, prompt, voice and transcription and stores an unused session', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ name: 'auth_tokens/synthetic' }));
    vi.stubGlobal('fetch', fetcher);
    const response = await POST(request());
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body).toEqual({
      token: 'auth_tokens/synthetic',
      model: 'gemini-3.8-live',
      recordedFixture: false,
      callSessionId: expect.any(String),
    });
    expect(insertOne).toHaveBeenCalledWith({
      id: body.callSessionId,
      used: false,
      createdAt: expect.any(String),
      recordedFixture: false,
    });
    const wire = JSON.parse(fetcher.mock.calls[0]?.[1].body);
    expect(wire.uses).toBe(1);
    expect(wire.bidiGenerateContentSetup).toMatchObject({
      model: 'models/gemini-3.8-live',
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      realtimeInputConfig: {
        activityHandling: 'NO_INTERRUPTION',
        automaticActivityDetection: {
          startOfSpeechSensitivity: 'START_SENSITIVITY_LOW',
          endOfSpeechSensitivity: 'END_SENSITIVITY_LOW',
          prefixPaddingMs: 300,
          silenceDurationMs: 700,
        },
      },
      generationConfig: {
        maxOutputTokens: 1024,
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Sulafat' } } },
      },
    });
    const prompt = wire.bidiGenerateContentSetup.systemInstruction.parts[0].text;
    expect(prompt).toContain('untrusted');
    expect(prompt).toContain('one short follow-up question');
    expect(createNativeSession).toHaveBeenCalledWith(
      expect.anything(),
      body.callSessionId,
      'english',
    );
    expect(JSON.stringify(body)).not.toContain('synthetic-test-key');
  });
  it('rejects cross-origin token minting before calling external services', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    expect((await POST(request('', 'https://unrelated.test'))).status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
    expect(insertOne).not.toHaveBeenCalled();
  });
  it('issues a recorded-message session for real transcription without minting a live token', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const response = await POST(request('?mode=recorded'));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      token: null,
      model: null,
      recordedFixture: false,
    });
    expect(fetcher).not.toHaveBeenCalled();
    expect(createNativeSession).not.toHaveBeenCalled();
  });
  it('forces a preset recorded session under the demo fallback', async () => {
    vi.stubEnv('DEMO_FALLBACK', '1');
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      token: null,
      model: null,
      recordedFixture: true,
    });
    expect(insertOne.mock.calls[0]?.[0]).toMatchObject({ recordedFixture: true });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('does not create a session or expose upstream errors when token creation fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('sensitive upstream details', { status: 403 })),
    );
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('sensitive');
    expect(insertOne).not.toHaveBeenCalled();
  });
  it('rejects malformed tokens and unsupported modes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ name: 'invalid' })));
    expect((await POST(request())).status).toBe(503);
    expect((await POST(request('?mode=unknown'))).status).toBe(400);
    expect(insertOne).not.toHaveBeenCalled();
  });
});
it('limits new-session and connection lifetimes', () => {
  const body = tokenRequest(0);
  expect(body.newSessionExpireTime).toBe('1970-01-01T00:01:00.000Z');
  expect(body.expireTime).toBe('1970-01-01T00:02:00.000Z');
});
