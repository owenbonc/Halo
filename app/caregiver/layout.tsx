import type { ReactNode } from 'react';
import { CaregiverShell } from '@/components/caregiver/Shell';

export default function CaregiverLayout({ children }: { children: ReactNode }) {
  return <CaregiverShell>{children}</CaregiverShell>;
}
