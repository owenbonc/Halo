import type { ReactNode } from 'react';
import { requirePage } from '@/lib/page-auth';

export default async function CallLayout({ children }: { children: ReactNode }) {
  await requirePage('caller');
  return children;
}
