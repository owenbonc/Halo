'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { type Role, savedRole, saveRole } from '@/lib/role';

const ROLES: { role: Role; label: string; hint: string }[] = [
  { role: 'grandma', label: 'Grandma', hint: 'See what we found out about your calls' },
  { role: 'caretaker', label: 'Caretaker', hint: 'Hear when Grandma needs you' },
];

export default function RolePicker() {
  const router = useRouter();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('switch')) return;
    const role = savedRole();
    if (role) router.replace(`/${role}`);
  }, [router]);

  return (
    <section className="space-y-10 pt-6">
      <header className="space-y-3">
        <p className="font-display text-2xl font-extrabold tracking-[-0.02em] text-accent-ink">
          Hang Up &amp; Check
        </p>
        <h1 className="text-4xl font-bold leading-tight">Who are you?</h1>
        <p className="text-ink-2">This phone will remember your answer.</p>
      </header>
      <div className="space-y-4">
        {ROLES.map(({ role, label, hint }) => (
          <Link
            key={role}
            href={`/${role}`}
            onClick={() => saveRole(role)}
            className="flex min-h-24 w-full flex-col items-start justify-center gap-1 rounded-card border border-line-strong bg-surface px-6 py-4 text-left transition-[transform,background-color] duration-100 ease-out hover:bg-surface-hover active:scale-[0.97]"
          >
            <span className="font-display text-3xl font-bold tracking-[-0.02em]">{label}</span>
            <span className="font-normal text-ink-2">{hint}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
