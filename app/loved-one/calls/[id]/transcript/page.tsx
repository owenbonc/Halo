'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CallScreen } from '@/components/loved-one/CallScreen';

type Load =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'ready'; lines: { id: number; text: string }[] };

// Turns start with who spoke; the screener's are "Assistant", which she knows as us.
const SPEAKER = /^(Caller|Assistant):\s*/;

// The whole call, with every number and link taken out on the server.
export default function TranscriptPage() {
  const { id } = useParams<{ id: string }>();
  const [load, setLoad] = useState<Load>({ kind: 'loading' });

  useEffect(() => {
    fetch(`/api/calls/${encodeURIComponent(id)}/transcript`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((body: { transcript: string }) =>
        setLoad({
          kind: 'ready',
          lines: body.transcript.split('\n').map((text, id) => ({ id, text })),
        }),
      )
      .catch(() => setLoad({ kind: 'failed' }));
  }, [id]);

  return (
    <CallScreen title="The whole call">
      {() => (
        <div className="space-y-6">
          <p className="text-ink-2">
            We've taken out any numbers and links, so you never ring one by mistake.
          </p>
          {load.kind === 'loading' && <p role="status">Opening the call…</p>}
          {load.kind === 'failed' && (
            <p role="alert" className="font-semibold text-danger">
              We couldn't open the whole call just now. Go back and try again.
            </p>
          )}
          {load.kind === 'ready' && (
            <ol className="space-y-4">
              {load.lines.map(({ id: lineId, text: line }) => {
                const speaker = line.match(SPEAKER)?.[1];
                return (
                  <li
                    key={lineId}
                    className="break-words rounded-card border border-line bg-surface p-4"
                  >
                    {speaker && (
                      <strong className="block text-ink-2">
                        {speaker === 'Caller' ? 'The caller' : 'Our assistant'}
                      </strong>
                    )}
                    {line.replace(SPEAKER, '')}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </CallScreen>
  );
}
