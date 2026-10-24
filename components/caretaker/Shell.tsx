'use client';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, type ReactNode, useContext, useEffect, useRef } from 'react';
import { Bell, Clock, User } from '@/components/ui/icons';
import { TabBar } from '@/components/ui/TabBar';
import type { SamAlert } from '@/lib/types';
import { usePoll } from '@/lib/use-poll';
import { SamAlerts } from '@/lib/view-schemas';
import { ring } from './alert-signal';
import { arrivals } from './arrivals';

type Alerts = { data: SamAlert[] | null; error: string | null };

const AlertsContext = createContext<Alerts>({ data: null, error: null });

// One poll for the whole caretaker app, so the tab badge and the screens always agree.
export const useAlerts = () => useContext(AlertsContext);

export function CaretakerShell({ children }: { children: ReactNode }) {
  const alerts = usePoll('/api/alerts', SamAlerts);
  const router = useRouter();
  const pathname = usePathname();
  const previous = useRef<SamAlert[] | null>(null);

  // Sam may be on any tab when an alert lands: ring, then bring the alert to the front.
  useEffect(() => {
    if (!alerts.data) return;
    const fresh = arrivals(previous.current, alerts.data);
    previous.current = alerts.data;
    if (fresh.length === 0) return;
    ring();
    if (pathname !== '/caretaker') router.push('/caretaker');
  }, [alerts.data, router, pathname]);
  const waiting = alerts.data?.filter((a) => a.status !== 'acknowledged').length ?? 0;
  return (
    <AlertsContext value={alerts}>
      {/* The bottom padding lets the last item scroll clear of the floating tab bar. */}
      <div className="pb-20 text-[1.0625rem]">{children}</div>
      <TabBar
        size="md"
        tabs={[
          { href: '/caretaker', label: 'Alerts', Icon: Bell, badge: waiting },
          { href: '/caretaker/history', label: 'History', Icon: Clock },
          { href: '/caretaker/profile', label: 'Profile', Icon: User },
        ]}
      />
    </AlertsContext>
  );
}

// An iOS large title on sticky material, so content scrolls under it instead of under the status bar.
export function LargeTitle({ children }: { children: ReactNode }) {
  return (
    <header className="material sticky top-0 z-10 -mx-4 -mt-[max(2rem,var(--safe-top))] mb-4 px-4 pt-[max(1rem,var(--safe-top))] pb-2">
      <h1 className="text-[2.125rem] leading-tight font-bold tracking-[-0.02em]">{children}</h1>
    </header>
  );
}

// The poll's own states: first load and a lost connection. Data stays on screen while it retries.
export function PollStatus({ alerts, loading }: { alerts: Alerts; loading: string }) {
  if (alerts.error)
    return (
      <p role="alert" className="mb-4 text-[0.9375rem] font-semibold text-danger">
        {alerts.error}
      </p>
    );
  if (!alerts.data)
    return (
      <p role="status" className="text-[0.9375rem] text-ink-2">
        {loading}
      </p>
    );
  return null;
}
