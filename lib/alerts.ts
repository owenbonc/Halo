import type { ClientSession } from 'mongodb';
import { collections, transaction } from './db';
import { HttpError } from './http';
import type { StoredAlert, StoredSettings } from './server-schemas';
import { household } from './settings-store';
import type { AlertRecord, CallRecord, SamAlert, Settings } from './types';
import { AlertRecord as AlertSchema, CallRecord as CallSchema } from './types';

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
export function toSamAlert(
  alert: AlertRecord & { sharedSummary?: string | null },
  call: CallRecord,
  settings: Settings,
): SamAlert {
  return {
    id: alert.id,
    createdAt: alert.createdAt,
    status: alert.status,
    elderName: settings.elderName,
    band: call.analysis.band,
    family: call.analysis.family,
    summary:
      settings.alertMode === 'auto_strong' && !settings.paused
        ? (alert.sharedSummary ?? null)
        : null,
  };
}

export async function insertAlert(
  call: CallRecord,
  trigger: AlertRecord['trigger'],
  current: StoredSettings,
  session: ClientSession,
): Promise<AlertRecord | null> {
  const { alerts, devices } = await collections();
  const connected = await devices.countDocuments(
    { role: 'caretaker', recipientId: current.recipientId, expiresAt: { $gt: new Date() } },
    { session },
  );
  if (current.paused || !current.contact.verified || !connected) {
    if (trigger === 'user_tap')
      throw new HttpError(
        409,
        current.paused ? 'Messages are paused.' : 'Connect your person’s phone first.',
      );
    return null;
  }
  const existing = await alerts.findOne({ callId: call.id }, { session });
  if (existing) {
    if (existing.recipientId !== current.recipientId)
      throw new HttpError(409, 'This call was shared with your previous person.');
    return withStatus(AlertSchema.parse(existing));
  }
  const alert: StoredAlert = {
    id: crypto.randomUUID(),
    callId: call.id,
    createdAt: new Date().toISOString(),
    trigger,
    status: 'sent',
    acknowledgedAt: null,
    recipientId: current.recipientId,
    sharedSummary: current.alertMode === 'auto_strong' ? call.analysis.summary : null,
  };
  await alerts.insertOne({ ...alert }, { session });
  return AlertSchema.parse(alert);
}

// Settings and alert creation share a write, so a concurrent pause is respected on retry.
export async function createAlert(
  callId: string,
  trigger: AlertRecord['trigger'],
): Promise<AlertRecord> {
  return transaction(async (session) => {
    const current = await household(session, true);
    const call = await (await collections()).calls.findOne({ id: callId }, { session });
    if (!call) throw new HttpError(404, 'No such call.');
    const alert = await insertAlert(CallSchema.parse(call), trigger, current, session);
    if (!alert) throw new HttpError(409, 'Messages are unavailable.');
    return alert;
  });
}

export async function acknowledge(id: string, recipientId: string): Promise<AlertRecord | null> {
  return transaction(async (session) => {
    const { alerts } = await collections();
    const current = await household(session, true);
    if (current.recipientId !== recipientId)
      throw new HttpError(403, 'This alert is not shared with you.');
    await alerts.updateOne(
      { id, recipientId, acknowledgedAt: null },
      { $set: { acknowledgedAt: new Date().toISOString(), status: 'acknowledged' } },
      { session },
    );
    const alert = await alerts.findOne({ id, recipientId }, { session });
    return alert ? withStatus(AlertSchema.parse(alert)) : null;
  });
}
