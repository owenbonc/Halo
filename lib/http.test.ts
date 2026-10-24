import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { checkWriteTarget } from '../scripts/write-target';
import { handle, readAudio, readJson } from './http';

describe('bounded request parsing', () => {
  it.each([undefined, '1'])(
    'rejects a streamed oversize JSON body with content-length %s',
    async (length) => {
      let cancelled = false;
      const body = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(129 * 1024));
        },
        cancel() {
          cancelled = true;
        },
      });
      const headers = new Headers({ 'content-type': 'application/json' });
      if (length) headers.set('content-length', length);
      const request = new Request('https://demo.test', {
        method: 'POST',
        headers,
        body,
        duplex: 'half',
      } as RequestInit);
      const response = await handle(async () => {
        await readJson(request, z.object({}));
        return new Response();
      });
      expect(response.status).toBe(413);
      expect(cancelled).toBe(true);
    },
  );
  it('accepts bounded audio without requiring a content-length header', async () => {
    const form = new FormData();
    form.append('audio', new Blob(['synthetic'], { type: 'audio/webm;codecs=opus' }));
    const audio = await readAudio(new Request('https://demo.test', { method: 'POST', body: form }));
    expect(await audio.text()).toBe('synthetic');
  });
  it.each([
    ['', 'audio/wav', 400],
    ['fake', 'text/html', 415],
  ])('rejects empty or unsupported audio', async (value, type, status) => {
    const form = new FormData();
    form.append('audio', new Blob([value], { type }));
    const response = await handle(async () => {
      await readAudio(new Request('https://demo.test', { method: 'POST', body: form }));
      return new Response();
    });
    expect(response.status).toBe(status);
  });
});

it('requires explicit confirmation for remote destructive commands without revealing credentials', () => {
  expect(checkWriteTarget('mongodb://127.0.0.1:27017', 'hangup', undefined)).toBe(
    '127.0.0.1/hangup',
  );
  const uri = 'mongodb+srv://synthetic:private@cluster.example/hangup';
  expect(() => checkWriteTarget(uri, 'hangup', undefined)).toThrow(
    'CONFIRM_DEMO_TARGET=cluster.example/hangup',
  );
  expect(() => checkWriteTarget(uri, 'hangup', 'other/hangup')).toThrow();
  expect(checkWriteTarget(uri, 'hangup', 'cluster.example/hangup')).toBe('cluster.example/hangup');
});
