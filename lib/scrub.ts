// Spoken numbers: two or more of these tokens in a row, so "one of the two" is not a number.
const NUMBER_TOKEN =
  'zero|oh|nought|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|double|triple';
const URL = /\b(?:https?:\/\/|www\.)\S+|\b[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}\b\S*/giu;
const SPOKEN_DOMAIN = /(?:\b[\w-]+\s+)?(?:\bdot\s+(?:com|co|uk|org|net|info|help|app)\b\s*)+/gi;
const DIGITS = /\p{Nd}[\p{Nd}\s().-]*/gu;
const NUMBER_WORDS = new RegExp(
  `\\b(?:${NUMBER_TOKEN})\\b(?:(?:[\\s,.-]+|\\s+and\\s+)(?:${NUMBER_TOKEN})\\b)+`,
  'gi',
);

/** Removes every digit run, link and spoken phone number, leaving `mark` where each was. */
export function scrub(text: string, mark = ' '): string {
  return text
    .replace(URL, ` ${mark} `)
    .replace(SPOKEN_DOMAIN, ` ${mark} `)
    .replace(DIGITS, ` ${mark} `)
    .replace(NUMBER_WORDS, ` ${mark} `)
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .trim();
}

export const REMOVED = '[number removed]';

/** The transcript Mum may read: line by line, so "Caller:" and "Assistant:" turns stay apart. */
export function scrubTranscript(transcript: string): string {
  return transcript
    .split('\n')
    .map((line) => scrub(line, REMOVED))
    .filter(Boolean)
    .join('\n');
}
