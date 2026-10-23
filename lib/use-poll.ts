'use client';
import { useEffect, useState } from 'react';

// Re-fetches `url` every `ms`; production would push instead (SPEC.md, Cut list).
export function usePoll<T>(url: string, ms = 2000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    const tick = async () => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`${res.status}`);
        const body = (await res.json()) as T;
        if (live) {
          setData(body);
          setError(null);
        }
      } catch {
        if (live) setError("Can't reach the server. Retrying…");
      }
    };
    tick();
    const timer = setInterval(tick, ms);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [url, ms]);
  return { data, error };
}
