import { connection } from 'next/server';
import CallScreen from './call-screen';

export default async function CallPage() {
  await connection();
  return <CallScreen localTranscription={process.env.HALO_LOCAL_TRANSCRIPTION === '1'} />;
}
