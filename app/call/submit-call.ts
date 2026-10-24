import { CallRecord, PostCallBody } from '@/lib/types';
import { CallError, callRequest } from './request';

const DELIVERY_UNCERTAIN =
  'We could not confirm delivery. Check the recipient’s Alerts screen before making another call.';

export async function submitCall(
  call: { finish(): Promise<string> },
  callSessionId: string,
  signal: AbortSignal,
) {
  let transcript: string;
  try {
    transcript = await call.finish();
  } catch (error) {
    if (error instanceof CallError || signal.aborted) throw error;
    throw new CallError('The call could not finish. No summary was sent. Please try again.');
  }
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  const body = PostCallBody.safeParse({
    callSessionId,
    transcript,
    callerLabel: 'Unknown caller (demo)',
  });
  if (!body.success)
    throw new CallError('The call could not be prepared. Nothing was sent. Please try again.');
  try {
    const response = await callRequest(
      '/api/calls',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body.data),
      },
      30_000,
      signal,
    );
    if (!response.ok) throw new Error('Delivery not confirmed');
    return CallRecord.parse(response.data);
  } catch {
    // The server may have saved the call before the response failed; never retry automatically.
    throw new CallError(DELIVERY_UNCERTAIN);
  }
}
