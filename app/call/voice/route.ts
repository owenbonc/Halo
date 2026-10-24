import clips from './clips.json';

export const dynamic = 'force-static';

export function GET() {
  const audio = Object.fromEntries(
    Object.entries(clips).map(([id, { text, pcmHex }]) => [
      id,
      { text, pcm: Buffer.from(pcmHex, 'hex').toString('base64') },
    ]),
  );
  return Response.json(audio, {
    headers: { 'Cache-Control': 'public, max-age=0, must-revalidate' },
  });
}
