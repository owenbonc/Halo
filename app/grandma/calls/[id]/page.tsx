'use client';
import { CallFace } from '@/components/grandma/CallCard';
import { CallScreen } from '@/components/grandma/CallScreen';

// One call, opened from Other calls or Past calls: the same card and buttons as in Alerts.
export default function CallPage() {
  return <CallScreen title="Call">{(call) => <CallFace call={call} />}</CallScreen>;
}
