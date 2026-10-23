'use client';
import Link from 'next/link';
import { BAND_LABEL, FAMILY_LABEL } from '@/lib/labels';
import type { SamAlert } from '@/lib/types';
import { usePoll } from '@/lib/use-poll';

const ack = (id: string) => fetch(`/api/alerts/${id}/ack`, { method: 'POST' });

export default function CaretakerPage() {
  const alerts = usePoll<SamAlert[]>('/api/alerts');
  const open = alerts.data?.find((a) => a.status !== 'acknowledged');
  const history = alerts.data?.filter((a) => a !== open) ?? [];

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Alerts</h1>
      {alerts.error && <p role="alert">{alerts.error}</p>}
      {open ? (
        <article
          className={`space-y-4 rounded-2xl border-4 p-5 ${BAND_LABEL[open.band].tone}`}
          role="alert"
        >
          <h2 className="text-2xl font-semibold">
            {open.elderName} got a call that looks like a scam. Please call her.
          </h2>
          <p className="font-medium">{FAMILY_LABEL[open.family]}</p>
          {open.summary && <p>{open.summary}</p>}
          {open.status === 'escalated' && <p>She has been told you haven't replied yet.</p>}
          <button
            type="button"
            onClick={() => ack(open.id)}
            className="w-full rounded-xl bg-stone-900 p-4 text-white"
          >
            I’m calling her now
          </button>
        </article>
      ) : (
        <p>No alerts right now.</p>
      )}
      {history.length > 0 && (
        <ul className="space-y-2 text-base">
          {history.map((a) => (
            <li key={a.id}>
              {new Date(a.createdAt).toLocaleString('en-GB')}: {FAMILY_LABEL[a.family]} ({a.status})
            </li>
          ))}
        </ul>
      )}
      <Link href="/?switch" className="block text-base underline">
        Switch role
      </Link>
    </section>
  );
}
