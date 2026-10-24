'use client';

export async function sessionFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  if (response.status === 401 || response.status === 403) {
    window.dispatchEvent(new Event('halo:disconnected'));
    const role = location.pathname.startsWith('/caretaker')
      ? 'caretaker'
      : location.pathname.startsWith('/call')
        ? 'caller'
        : 'grandma';
    location.replace(`/pair?role=${role}`);
  }
  return response;
}
