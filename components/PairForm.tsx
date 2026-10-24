'use client';
import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/band';

const Session = z.object({
  role: z.enum(['grandma', 'caretaker', 'caller']),
  expiresAt: z.iso.datetime(),
});

export function PairForm({
  role,
  setup,
}: {
  role: 'grandma' | 'caretaker' | 'caller';
  setup: boolean;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Connect this phone</h1>
      <p>
        {role === 'caretaker'
          ? 'Ask your person to open Settings and create a phone invitation. Enter it here before it expires.'
          : 'Enter the private demo code from the organiser. Use made-up names and stories only.'}
      </p>
      <Card>
        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            setBusy(true);
            setError(null);
            try {
              const response = await fetch('/api/session', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ role, code, name }),
              });
              if (!response.ok) {
                const body = z.object({ error: z.string() }).safeParse(await response.json());
                throw new Error(body.success ? body.data.error : 'This phone could not connect.');
              }
              Session.parse(await response.json());
              setCode('');
              window.location.replace(
                role === 'grandma'
                  ? setup
                    ? '/setup'
                    : '/grandma'
                  : role === 'caller'
                    ? '/call'
                    : '/caretaker',
              );
            } catch (error) {
              setError(error instanceof Error ? error.message : 'This phone could not connect.');
              setBusy(false);
            }
          }}
        >
          <label className="block space-y-2">
            <span>A name for this device</span>
            <input
              className="min-h-14 w-full rounded-chip border border-line-strong bg-surface px-4"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              required
              autoComplete="off"
            />
          </label>
          <label className="block space-y-2">
            <span>{role === 'caretaker' ? 'Invitation code' : 'Private demo code'}</span>
            <input
              type="password"
              className="min-h-14 w-full rounded-chip border border-line-strong bg-surface px-4"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={256}
              required
              autoComplete="off"
              autoCapitalize={role === 'caretaker' ? 'characters' : 'none'}
              spellCheck={false}
            />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? 'Connecting…' : 'Connect phone'}
          </Button>
          {error && (
            <p role="alert" className="text-danger">
              {error}
            </p>
          )}
        </form>
      </Card>
      <p className="text-ink-2">
        Access lasts for eight hours. Your person can disconnect caretaker phones at any time.
      </p>
      <Link className="inline-flex min-h-12 items-center underline" href="/?switch">
        Back to choices
      </Link>
    </section>
  );
}
