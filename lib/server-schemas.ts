import { z } from 'zod';
import { AlertRecord, Analysis, Settings } from './types';

export const DeviceRole = z.enum(['grandma', 'caretaker', 'caller']);
export const Device = z.object({
  id: z.string(),
  tokenHash: z.string(),
  name: z.string().trim().min(1).max(40),
  role: DeviceRole,
  recipientId: z.string().nullable(),
  createdAt: z.string(),
  expiresAt: z.date(),
});
export type Device = z.infer<typeof Device>;
export const Invitation = z.object({
  _id: z.string(),
  recipientId: z.string(),
  expiresAt: z.date(),
});
export const StoredSettings = Settings.extend({
  id: z.literal('household'),
  recipientId: z.string(),
  revision: z.number().int().nonnegative(),
  alertSequence: z.number().int().nonnegative(),
});
export type StoredSettings = z.infer<typeof StoredSettings>;
export const StoredAlert = AlertRecord.extend({
  recipientId: z.string().optional(),
  sharedSummary: z.string().nullable().default(null),
});
export type StoredAlert = z.infer<typeof StoredAlert>;
export const CallSession = z.object({
  id: z.string(),
  ownerId: z.string(),
  status: z.enum(['open', 'processing', 'completed']),
  createdAt: z.string(),
  expiresAt: z.date(),
  cleanupAt: z.date(),
  payloadHash: z.string().optional(),
  leaseUntil: z.date().optional(),
  analysis: Analysis.optional(),
  resultId: z.string().optional(),
  audioHash: z.string().optional(),
  transcriptionLeaseUntil: z.date().optional(),
  transcript: z.string().optional(),
});
export type CallSession = z.infer<typeof CallSession>;
