import type { Analysis } from './types';

// shortcut: keyword stub so the demo path runs end to end; slice B replaces it with Argon + Atlas.
const STUB_CUES = [
  'courier',
  'cash',
  'safe account',
  "don't tell",
  'police',
  'bank',
  'urgent',
  'install',
];

export async function analyse(transcript: string): Promise<Analysis> {
  const text = transcript.toLowerCase();
  const cues = STUB_CUES.filter((cue) => text.includes(cue)).slice(0, 4);
  if (cues.length === 0) {
    return {
      band: 'none',
      family: 'none',
      cues: [],
      summary: 'No common warning signs found.',
      nextSteps: ['call_back_known_number'],
      matchedPatternIds: [],
    };
  }
  return {
    band: cues.length >= 2 ? 'strong' : 'some',
    family: 'courier',
    cues,
    summary: 'The caller asked for money and to keep it secret.',
    nextSteps: ['dont_call_back', 'different_phone', 'call_159'],
    matchedPatternIds: [],
  };
}
