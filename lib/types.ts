// The contracts between slices (SPEC.md, Contracts). One keeper: request changes in docs/status/.
import { z } from 'zod';

export const Band = z.enum(['strong', 'some', 'none']);
export type Band = z.infer<typeof Band>;

export const ScamFamily = z.enum([
  'courier',
  'bank_impersonation',
  'police_impersonation',
  'remote_access',
  'investment',
  'other',
  'none',
]);
export type ScamFamily = z.infer<typeof ScamFamily>;

export const GuidanceId = z.enum([
  'dont_call_back',
  'different_phone',
  'call_159',
  'hang_up',
  'report_fraud',
  'call_back_known_number',
]);
export type GuidanceId = z.infer<typeof GuidanceId>;

export const Analysis = z.object({
  band: Band,
  family: ScamFamily,
  cues: z.array(z.string()).max(4),
  summary: z.string(),
  nextSteps: z.array(GuidanceId),
  matchedPatternIds: z.array(z.string()),
});
export type Analysis = z.infer<typeof Analysis>;

export const CallRecord = z.object({
  id: z.string(),
  source: z.enum(['screener', 'voice_note']),
  createdAt: z.string(),
  callerLabel: z.string(),
  transcript: z.string(),
  analysis: Analysis,
});
export type CallRecord = z.infer<typeof CallRecord>;

export const Settings = z.object({
  elderName: z.string().min(1).max(40),
  contact: z.object({ name: z.string().min(1).max(40), verified: z.boolean() }),
  backupContact: z.object({ name: z.string().min(1).max(40) }).nullable(),
  alertMode: z.enum(['ask_first', 'auto_strong']),
  paused: z.boolean(),
});
export type Settings = z.infer<typeof Settings>;

export const AlertStatus = z.enum(['sent', 'acknowledged', 'escalated']);

export const AlertRecord = z.object({
  id: z.string(),
  callId: z.string(),
  createdAt: z.string(),
  trigger: z.enum(['user_tap', 'auto_strong']),
  status: AlertStatus,
  acknowledgedAt: z.string().nullable(),
});
export type AlertRecord = z.infer<typeof AlertRecord>;

// The caretaker's view of an alert: no transcript, no cues.
export type SamAlert = {
  id: string;
  createdAt: string;
  status: AlertRecord['status'];
  elderName: string;
  band: Band;
  family: ScamFamily;
  summary: string | null;
};

// Grandma's view of a call: everything but the transcript, plus its latest alert.
export type CallView = Omit<CallRecord, 'transcript'> & { alert: AlertRecord | null };

export type Pattern = {
  id: string;
  family: ScamFamily;
  title: string;
  description: string;
  phrases: string[];
  source: string;
};

export const PostCallBody = z.object({
  callSessionId: z.string().min(1).max(100),
  transcript: z.string().trim().min(1).max(20_000),
  callerLabel: z.string().trim().min(1).max(80),
});

export const PostAlertBody = z.object({ callId: z.string().min(1).max(100) });

export type LiveToken = {
  token: string | null;
  callSessionId: string;
  model: string | null;
  recordedFixture: boolean;
};
