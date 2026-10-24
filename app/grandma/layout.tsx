import type { ReactNode } from 'react';
import { GrandmaShell } from '@/components/grandma/GrandmaData';
import { requirePage } from '@/lib/page-auth';

export default async function GrandmaLayout({ children }: { children: ReactNode }) {
  await requirePage('grandma');
  return <GrandmaShell>{children}</GrandmaShell>;
}
