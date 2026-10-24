import { createAlert, toSamAlert, withStatus } from './alerts';
import { analyse } from './analyse';
import { collections, noMongoId } from './db';
import { SEED_SETTINGS } from './seed';
import type { CallRecord, CallView, SamAlert, Settings } from './types';

export async function getSettings(): Promise<Settings> {
  const { settings } = await collections();
  const doc = await settings.findOne({ id: 'household' }, noMongoId);
  if (!doc) return SEED_SETTINGS;
  const { id: _id, ...rest } = doc;
  return rest;
}

export async function saveSettings(next: Settings) {
  const { settings } = await collections();
  await settings.replaceOne({ id: 'household' }, { id: 'household', ...next }, { upsert: true });
}

// Every call, from the screener or a voice note, lands here: analyse, save, and alert if Grandma chose that.
export async function recordCall(
  source: CallRecord['source'],
  transcript: string,
  callerLabel: string,
): Promise<CallRecord> {
  const call: CallRecord = {
    id: crypto.randomUUID(),
    source,
    createdAt: new Date().toISOString(),
    callerLabel,
    transcript,
    analysis: await analyse(transcript, source),
  };
  const { calls } = await collections();
  await calls.insertOne({ ...call });
  const settings = await getSettings();
  if (settings.alertMode === 'auto_strong' && call.analysis.band === 'strong' && !settings.paused) {
    await createAlert(call.id, 'auto_strong');
  }
  return call;
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
  const byCall = new Map(found.map((a) => [a.callId, withStatus(a)]));
  return recent.map((call) => ({ ...call, alert: byCall.get(call.id) ?? null }));
}

export async function listSamAlerts(limit = 20): Promise<SamAlert[]> {
  const { calls, alerts } = await collections();
  const recent = await alerts.find({}, noMongoId).sort({ createdAt: -1 }).limit(limit).toArray();
  const found = await calls.find({ id: { $in: recent.map((a) => a.callId) } }, noMongoId).toArray();
  const byId = new Map(found.map((c) => [c.id, c]));
  const settings = await getSettings();
  return recent.flatMap((alert) => {
    const call = byId.get(alert.callId);
    return call ? [toSamAlert(withStatus(alert), call, settings)] : [];
  });
}
