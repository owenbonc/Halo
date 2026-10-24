import type { SamAlert } from '@/lib/types';

// The first poll returns nothing, so opening the app never rings for an alert Sam has already seen.
export function arrivals(previous: SamAlert[] | null, next: SamAlert[]): SamAlert[] {
  if (previous === null) return [];
  const seen = new Set(previous.map((a) => a.id));
  return next.filter((a) => a.status !== 'acknowledged' && !seen.has(a.id));
}
