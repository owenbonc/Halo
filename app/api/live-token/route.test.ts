import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { insertOne } = vi.hoisted(() => ({ insertOne: vi.fn() }));
vi.mock('./guard', () => ({ accessStatus: () => 200, reserveCallBudget: async () => null }));
vi.mock('@/lib/db', () => ({ collections: async () => ({ callSessions: { insertOne } }) }));

import { POST } from './route';
import { tokenRequest } from './token';

const request = (suffix = '', origin = 'https://demo.test') =>
  new Request(`https://demo.test/api/live-token${suffix}`, { method: 'POST', headers: { origin } });
beforeEach(() => {
  vi.stubEnv('GEMINI_API_KEY', 'synthetic-test-key');
  vi.stubEnv('DEMO_FALLBACK', '0');
  insertOne.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe('live token endpoint', () => {
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
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Sulafat' } } },
      },
    });
    expect(wire.bidiGenerateContentSetup.systemInstruction.parts[0].text).toContain('untrusted');
    expect(JSON.stringify(body)).not.toContain('synthetic-test-key');
    expect(new Date(wire.newSessionExpireTime).getTime()).toBeLessThan(
      new Date(wire.expireTime).getTime(),
    );
  });
  it('rejects cross-origin token minting before calling external services', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    expect((await POST(request('', 'https://unrelated.test'))).status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
    expect(insertOne).not.toHaveBeenCalled();
  });
  it('issues a recorded-message session without Gemini access', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const response = await POST(request('?mode=recorded'));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ token: null, model: null });
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
  it('does not let a client override protected turn-taking', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ name: 'auth_tokens/synthetic' }));
    vi.stubGlobal('fetch', fetcher);
    expect((await POST(request('?interruptions=on'))).status).toBe(201);
    const wire = JSON.parse(fetcher.mock.calls[0]?.[1].body);
    expect(wire.bidiGenerateContentSetup.realtimeInputConfig.activityHandling).toBe(
      'NO_INTERRUPTION',
    );
  });
});
it('limits new-session and connection lifetimes', () => {
  const body = tokenRequest(0);
  expect(body.newSessionExpireTime).toBe('1970-01-01T00:01:00.000Z');
  expect(body.expireTime).toBe('1970-01-01T00:02:00.000Z');
});
