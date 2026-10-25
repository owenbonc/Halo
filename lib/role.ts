'use client';

export type Role = 'loved-one' | 'caregiver';
const KEY = 'hang-up-and-check.role';

// localStorage can throw in private browsing; the picker still works without it.
export function savedRole(): Role | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'loved-one' || value === 'caregiver' ? value : null;
  } catch {
    return null;
  }
}

export function saveRole(role: Role) {
  try {
    localStorage.setItem(KEY, role);
  } catch {}
}
