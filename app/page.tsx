'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { buttonClass } from '@/components/ui/Button';
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
        <p className="font-semibold text-accent">Hang Up &amp; Check</p>
        <h1 className="text-4xl font-bold leading-tight">Who are you?</h1>
        <p className="text-ink-soft">This phone will remember your answer.</p>
      </header>
      <div className="space-y-4">
        {ROLES.map(({ role, label, hint }) => (
          <Link
            key={role}
            href={`/${role}`}
            onClick={() => saveRole(role)}
            className={`${buttonClass('secondary')} min-h-24 flex-col items-start gap-1 rounded-2xl text-left shadow-card`}
          >
            <span className="text-3xl font-bold">{label}</span>
            <span className="font-normal text-ink-soft">{hint}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
