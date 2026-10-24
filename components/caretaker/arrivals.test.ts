import { describe, expect, it } from 'vitest';
import type { SamAlert } from '@/lib/types';
import { arrivals } from './arrivals';

const alert = (id: string, status: SamAlert['status'] = 'sent'): SamAlert => ({
  id,
  createdAt: '2026-10-24T10:00:00.000Z',
  status,
  elderName: 'Margaret',
  band: 'strong',
  family: 'courier',
  summary: null,
});

describe('arrivals', () => {
  it('rings for nothing on the first poll, so opening the app is quiet', () => {
    expect(arrivals(null, [alert('a1')])).toEqual([]);
  });

  it('returns an alert that appeared since the last poll', () => {
    expect(arrivals([alert('a1')], [alert('a2'), alert('a1')]).map((a) => a.id)).toEqual(['a2']);
  });

  it('never returns the same alert twice', () => {
    expect(arrivals([alert('a1')], [alert('a1', 'escalated')])).toEqual([]);
  });

  it('ignores a new alert that is already acknowledged', () => {
    expect(arrivals([], [alert('a3', 'acknowledged')])).toEqual([]);
  });
});
