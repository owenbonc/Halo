'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function Disconnect() {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setFailed(false);
          const response = await fetch('/api/session', { method: 'DELETE' }).catch(() => null);
          if (response?.ok) {
            window.dispatchEvent(new Event('halo:disconnected'));
            location.replace('/?switch');
          } else {
            setBusy(false);
            setFailed(true);
          }
        }}
      >
        {busy ? 'Disconnecting…' : 'Disconnect this phone'}
      </Button>
      {failed && <p role="alert">Could not disconnect. Please try again.</p>}
    </div>
  );
}
