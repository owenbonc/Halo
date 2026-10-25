'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { savedRole, saveRole } from '@/lib/role';

// Her phone gets its role at the end of setup, so only the caregiver's choice is saved here.
const CHOICES = [
  { href: '/setup', label: 'Set up a phone for someone', hint: 'Do this on their phone, together' },
  {
    href: '/caregiver',
    label: 'I look out for someone',
    hint: 'Get told when a call worries them',
    role: 'caregiver' as const,
  },
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
          Halo
        </p>
        <h1 className="text-4xl font-bold leading-tight">What would you like to do?</h1>
        <p className="text-ink-2">This phone will remember your answer.</p>
      </header>
      <div className="space-y-4">
        {CHOICES.map(({ href, label, hint, role }) => (
          <Link
            key={href}
            href={href}
            onClick={() => role && saveRole(role)}
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
