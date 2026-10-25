'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { savedRole } from '@/lib/role';

// A phone opens its own app; a new phone starts setup, which asks whose phone it is.
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const role = savedRole();
    router.replace(role ? `/${role}` : '/setup');
  }, [router]);
  return <p role="status">Opening Halo…</p>;
}
