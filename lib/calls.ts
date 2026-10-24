import { insertAlert, toSamAlert, withStatus } from './alerts';
import { analyse } from './analyse';
import { reserveBudget } from './budget';
import { collections, noMongoId, transaction } from './db';
import { HttpError } from './http';
import { StoredAlert } from './server-schemas';
import { household, settingsTag } from './settings-store';
import { AlertRecord, CallRecord, type CallView, type SamAlert, Settings } from './types';

export async function getSettings(): Promise<Settings> {
  return Settings.parse(await household());
}

export async function saveSettings(next: Settings, expected: string | null) {
  if (!expected) throw new HttpError(428, 'Reload settings before saving.');
  return transaction(async (session) => {
    const current = await household(session, true);
    if (expected !== settingsTag(current))
      throw new HttpError(412, 'Settings changed on another phone. Reload before trying again.');
    const { settings, devices, invitations } = await collections();
    const changed = next.contact.name !== current.contact.name;
    const recipientId = changed ? crypto.randomUUID() : current.recipientId;
    if (changed) {
      await devices.deleteMany({ role: 'caretaker' }, { session });
      await invitations.deleteMany({}, { session });
    }
    const saved = {
      ...current,
      ...next,
      contact: { name: next.contact.name, verified: changed ? false : current.contact.verified },
      recipientId,
      revision: current.revision + 1,
    };
    await settings.replaceOne({ id: 'household' }, saved, { session });
    return saved;
  });
}

export async function analyseBudgeted(transcript: string, source: CallRecord['source']) {
  await reserveBudget('analyse');
  return analyse(transcript, source);
}

export async function persistCall(
  call: CallRecord,
  receipt?: { id: string; ownerId: string; leaseUntil: Date },
) {
  return transaction(async (session) => {
    const { calls, callSessions } = await collections();
    const current = await household(session, true);
    if (receipt) {
      const updated = await callSessions.updateOne(
        {
          id: receipt.id,
          ownerId: receipt.ownerId,
          status: 'processing',
          leaseUntil: receipt.leaseUntil,
        },
        {
          $set: {
            status: 'completed',
            resultId: call.id,
            cleanupAt: new Date(Date.now() + 24 * 3_600_000),
          },
          $unset: { leaseUntil: '', analysis: '', transcript: '' },
        },
        { session },
      );
      if (!updated.modifiedCount)
        throw new HttpError(409, 'Submission changed. Retry the same call.');
    }
    await calls.insertOne({ ...call }, { session });
    if (current.alertMode === 'auto_strong' && call.analysis.band === 'strong')
      await insertAlert(call, 'auto_strong', current, session);
  });
}

export async function listCallViews(limit = 20): Promise<CallView[]> {
  const { calls, alerts } = await collections();
  const recent = await calls
    .find({}, { projection: { _id: 0, transcript: 0 } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  const found = await alerts
    .find({ callId: { $in: recent.map((c) => c.id) } }, noMongoId)
    .toArray();
  const byCall = new Map(found.map((a) => [a.callId, withStatus(AlertRecord.parse(a))]));
  return recent.map((call) => ({
    ...CallRecord.omit({ transcript: true }).parse(call),
    alert: byCall.get(call.id) ?? null,
  }));
}

export async function listSamAlerts(recipientId: string, limit = 20): Promise<SamAlert[]> {
  const { calls, alerts } = await collections();
  const recent = await alerts
    .find({ recipientId }, noMongoId)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  const found = await calls.find({ id: { $in: recent.map((a) => a.callId) } }, noMongoId).toArray();
  const byId = new Map(found.map((c) => [c.id, c]));
  const settings = await household();
  if (settings.recipientId !== recipientId) return [];
  return recent.flatMap((alert) => {
    const call = byId.get(alert.callId);
    return call
      ? [
          toSamAlert(
            { ...StoredAlert.parse(alert), ...withStatus(AlertRecord.parse(alert)) },
            CallRecord.parse(call),
            settings,
          ),
        ]
      : [];
  });
}
