'use client';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, type ReactNode, useContext, useEffect, useRef } from 'react';
import { Bell, Clock, Gear } from '@/components/ui/icons';
import { TabBar } from '@/components/ui/TabBar';
import type { SamAlert } from '@/lib/types';
import { usePoll } from '@/lib/use-poll';
import { ring } from './alert-signal';
import { arrivals } from './arrivals';

type Alerts = { data: SamAlert[] | null; error: string | null; refresh: () => void };

const AlertsContext = createContext<Alerts>({ data: null, error: null, refresh: () => {} });

// One poll for the whole caregiver app, so the tab badge and the screens always agree.
export const useAlerts = () => useContext(AlertsContext);

export function CaregiverShell({ children }: { children: ReactNode }) {
  const alerts = usePoll<SamAlert[]>('/api/alerts');
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
    if (pathname !== '/caregiver') router.push('/caregiver');
  }, [alerts.data, router, pathname]);
  const waiting = alerts.data?.filter((a) => a.status !== 'acknowledged').length ?? 0;
  return (
    <AlertsContext value={alerts}>
      {/* The bottom padding lets the last item scroll clear of the floating tab bar. */}
      <div className="pb-24 text-[1.0625rem]">{children}</div>
      <TabBar
        standard
        tabs={[
          { href: '/caregiver', label: 'Alerts', Icon: Bell, badge: waiting },
          { href: '/caregiver/history', label: 'History', Icon: Clock },
          { href: '/caregiver/settings', label: 'Settings', Icon: Gear },
        ]}
      />
    </AlertsContext>
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
