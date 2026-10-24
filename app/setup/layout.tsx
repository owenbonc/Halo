import type { ReactNode } from 'react';
import { requirePage } from '@/lib/page-auth';

export default async function SetupLayout({ children }: { children: ReactNode }) {
  await requirePage('grandma');
  return children;
}
