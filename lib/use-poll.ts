'use client';
import { useEffect, useState } from 'react';
import type { z } from 'zod';
import { sessionFetch } from './client-session';

// Re-fetches `url` every `ms`; production would push instead (SPEC.md, Cut list).
export function usePoll<T>(url: string, schema: z.ZodType<T>, ms = 2000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const clear = () => {
      live = false;
      controller.abort();
      setData(null);
      setError('This phone is disconnected.');
    };
    window.addEventListener('halo:disconnected', clear);
    const tick = async () => {
      try {
        const res = await sessionFetch(url, { cache: 'no-store', signal: controller.signal });
        if (!res.ok) throw new Error(`${res.status}`);
        const body = schema.parse(await res.json());
        if (live) {
          setData(body);
          setError(null);
        }
      } catch {
        if (live) setError("Can't reach the server. Retrying…");
      } finally {
        if (live) timer = setTimeout(tick, ms);
      }
    };
    tick();
    return () => {
      live = false;
      controller.abort();
      clearTimeout(timer);
      window.removeEventListener('halo:disconnected', clear);
    };
  }, [url, ms, schema]);
  return { data, error };
}
