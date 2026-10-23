'use client';

export type Role = 'grandma' | 'caretaker';
const KEY = 'hang-up-and-check.role';

// localStorage can throw in private browsing; the picker still works without it.
export function savedRole(): Role | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'grandma' || value === 'caretaker' ? value : null;
  } catch {
    return null;
  }
}

export function saveRole(role: Role) {
  try {
    localStorage.setItem(KEY, role);
  } catch {}
}
