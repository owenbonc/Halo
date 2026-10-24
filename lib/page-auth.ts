import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireDevice } from './auth';
import { HttpError } from './http';
import type { Device } from './server-schemas';

export async function requirePage(role: Device['role']) {
  const request = new Request('http://internal', { headers: await headers() });
  try {
    await requireDevice(request, [role]);
  } catch (error) {
    if (error instanceof HttpError && [401, 403].includes(error.status))
      redirect(`/pair?role=${role}`);
    throw error;
  }
}
