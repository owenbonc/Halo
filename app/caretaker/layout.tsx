import type { ReactNode } from 'react';
import { CaretakerShell } from '@/components/caretaker/Shell';
import { requirePage } from '@/lib/page-auth';

export default async function CaretakerLayout({ children }: { children: ReactNode }) {
  await requirePage('caretaker');
  return <CaretakerShell>{children}</CaretakerShell>;
}
