import type { ReactNode } from 'react';
import { LovedOneShell } from '@/components/loved-one/LovedOneData';

export default function LovedOneLayout({ children }: { children: ReactNode }) {
  return <LovedOneShell>{children}</LovedOneShell>;
}
