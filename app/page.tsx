'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { type Role, savedRole, saveRole } from '@/lib/role';

const ROLES: { role: Role; label: string; hint: string }[] = [
  { role: 'grandma', label: 'Grandma', hint: 'See your screened calls' },
  { role: 'caretaker', label: 'Caretaker', hint: 'Get alerts when Grandma needs you' },
];

export default function RolePicker() {
  const router = useRouter();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('switch')) return;
    const role = savedRole();
    if (role) router.replace(`/${role}`);
  }, [router]);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Who are you?</h1>
      {ROLES.map(({ role, label, hint }) => (
        <Link
          key={role}
          href={`/${role}`}
          onClick={() => saveRole(role)}
          className="block rounded-2xl border-2 border-stone-800 bg-white p-6 focus-visible:outline-4"
        >
          <span className="block text-2xl font-semibold">{label}</span>
          <span className="block text-lg text-stone-600">{hint}</span>
        </Link>
      ))}
    </section>
  );
}
