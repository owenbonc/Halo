import { z } from 'zod';
import { AlertRecord, Band, CallRecord, ScamFamily } from './types';

export const CallViews = z.array(
  CallRecord.omit({ transcript: true }).extend({ alert: AlertRecord.nullable() }),
);
export const SamAlerts = z.array(
  z.object({
    id: z.string(),
    createdAt: z.string(),
    status: AlertRecord.shape.status,
    elderName: z.string(),
    band: Band,
    family: ScamFamily,
    summary: z.string().nullable(),
  }),
);
