import { collections, noMongoId } from './db';
import type { AlertRecord, CallRecord, SamAlert, Settings } from './types';

const escalateAfterMs = () => Number(process.env.ESCALATE_AFTER_MIN ?? 3) * 60_000;

// Escalation is worked out on read, so there are no timers to fail.
export function statusAt(alert: AlertRecord, now: number): AlertRecord['status'] {
  if (alert.acknowledgedAt) return 'acknowledged';
  return now - Date.parse(alert.createdAt) >= escalateAfterMs() ? 'escalated' : 'sent';
}

export function withStatus(alert: AlertRecord, now = Date.now()): AlertRecord {
  return { ...alert, status: statusAt(alert, now) };
}

// The caretaker never sees the transcript or cues; the summary only if Grandma chose automatic alerts.
export function toSamAlert(alert: AlertRecord, call: CallRecord, settings: Settings): SamAlert {
  return {
    id: alert.id,
    createdAt: alert.createdAt,
    status: alert.status,
    elderName: settings.elderName,
    band: call.analysis.band,
    family: call.analysis.family,
    summary: settings.alertMode === 'auto_strong' ? call.analysis.summary : null,
  };
}

// One alert per call: a second tap returns the existing alert.
export async function createAlert(
  callId: string,
  trigger: AlertRecord['trigger'],
): Promise<AlertRecord> {
  const { alerts } = await collections();
  const existing = await alerts.findOne({ callId }, noMongoId);
  if (existing) return withStatus(existing);
  const alert: AlertRecord = {
    id: crypto.randomUUID(),
    callId,
    createdAt: new Date().toISOString(),
    trigger,
    status: 'sent',
    acknowledgedAt: null,
  };
  await alerts.insertOne({ ...alert });
  return alert;
}

export async function acknowledge(id: string): Promise<AlertRecord | null> {
  const { alerts } = await collections();
  const alert = await alerts.findOneAndUpdate(
    { id },
    { $set: { acknowledgedAt: new Date().toISOString(), status: 'acknowledged' } },
    { ...noMongoId, returnDocument: 'after' },
  );
  return alert ? withStatus(alert) : null;
}
