'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Her phone gets its role at the end of setup, so only the caretaker's choice is saved here.
const CHOICES = [
  {
    href: '/pair?role=grandma&setup=1',
    label: 'Set up a phone for someone',
    hint: 'Do this on their phone, together',
  },
  {
    href: '/pair?role=caretaker',
    label: 'I look out for someone',
    hint: 'Get told when a call worries them',
  },
];

export default function RolePicker() {
  const router = useRouter();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('switch')) return;
    const abort = new AbortController();
    fetch('/api/session', { signal: abort.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const body: unknown = await response.json();
        if (
          body &&
          typeof body === 'object' &&
          'role' in body &&
          (body.role === 'grandma' || body.role === 'caretaker' || body.role === 'caller')
        )
          router.replace(body.role === 'caller' ? '/call' : `/${body.role}`);
      })
      .catch(() => {});
    return () => abort.abort();
  }, [router]);

  return (
    <section className="space-y-10 pt-6">
      <header className="space-y-3">
        <p className="font-display text-2xl font-extrabold tracking-[-0.02em] text-accent-ink">
          Halo
        </p>
        <h1 className="text-4xl font-bold leading-tight">What would you like to do?</h1>
        <p className="text-ink-2">This phone will remember your answer.</p>
      </header>
      <div className="space-y-4">
        {CHOICES.map(({ href, label, hint }) => (
          <Link
            key={href}
            href={href}
            className="glass flex min-h-24 w-full flex-col items-start justify-center gap-1 rounded-card px-6 py-4 text-left transition-[transform,background-color] duration-100 ease-out active:scale-[0.97]"
          >
            <span className="font-display text-3xl font-bold tracking-[-0.02em]">{label}</span>
            <span className="font-normal text-ink-2">{hint}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
