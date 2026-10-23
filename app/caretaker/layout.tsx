import type { ReactNode } from 'react';
import { CaretakerShell } from '@/components/caretaker/Shell';

export default function CaretakerLayout({ children }: { children: ReactNode }) {
  return <CaretakerShell>{children}</CaretakerShell>;
}
