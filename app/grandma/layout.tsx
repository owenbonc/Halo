import type { ReactNode } from 'react';
import { GrandmaShell } from '@/components/grandma/GrandmaData';

export default function GrandmaLayout({ children }: { children: ReactNode }) {
  return <GrandmaShell>{children}</GrandmaShell>;
}
