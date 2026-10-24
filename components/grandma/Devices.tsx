'use client';
import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/band';
import { sessionFetch } from '@/lib/client-session';

const Devices = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    createdAt: z.iso.datetime(),
    expiresAt: z.iso.datetime(),
  }),
);
const Invitation = z.object({ code: z.string(), expiresAt: z.iso.datetime() });

export function ConnectedDevices() {
  const [devices, setDevices] = useState<z.infer<typeof Devices>>([]);
  const [invitation, setInvitation] = useState<z.infer<typeof Invitation> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    const response = await sessionFetch('/api/devices', { cache: 'no-store', signal });
    if (!response.ok) throw new Error('Could not load connected phones.');
    setDevices(Devices.parse(await response.json()));
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).catch(() => {
      if (!controller.signal.aborted) setError('Could not load connected phones.');
    });
    return () => controller.abort();
  }, [load]);
  const act = async (work: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await work();
      await load();
    } catch {
      setError('That did not complete. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="space-y-4">
      <h2 className="text-2xl font-bold">Connected caretaker phones</h2>
      <p>
        Give an invitation to your chosen person in private. It works once and expires after ten
        minutes. No text message is sent.
      </p>
      <Button
        disabled={busy}
        onClick={() =>
          act(async () => {
            setInvitation(null);
            const response = await sessionFetch('/api/invitations', { method: 'POST' });
            if (!response.ok) throw new Error();
            setInvitation(Invitation.parse(await response.json()));
          })
        }
      >
        Create phone invitation
      </Button>
      {invitation && (
        <div role="status" className="space-y-2">
          <p className="break-all font-bold tracking-widest">{invitation.code}</p>
          <p>
            Expires at{' '}
            {new Date(invitation.expiresAt).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            . Creating another code cancels this one.
          </p>
        </div>
      )}
      {!devices.length && <p>No caretaker phone is connected yet.</p>}
      {devices.map((device) => (
        <div key={device.id} className="space-y-2 border-t border-line pt-4">
          <p className="font-bold">{device.name}</p>
          <p className="text-ink-2">
            Connected {new Date(device.createdAt).toLocaleString('en-GB')}
          </p>
          <Button
            disabled={busy}
            variant="secondary"
            onClick={() =>
              act(async () => {
                const response = await sessionFetch(
                  `/api/devices/${encodeURIComponent(device.id)}`,
                  { method: 'DELETE' },
                );
                if (!response.ok) throw new Error();
              })
            }
          >
            Disconnect {device.name}
          </Button>
        </div>
      ))}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
    </Card>
  );
}
