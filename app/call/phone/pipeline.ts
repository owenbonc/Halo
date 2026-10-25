import { REMOVED, scrub } from '@/lib/scrub';
import type { CallRecord } from '@/lib/types';
import type { Stage } from './screener';

const color = !process.env.NO_COLOR && process.stdout.isTTY;
const paint = (code: number, text: string) => (color ? `\x1b[${code}m${text}\x1b[0m` : text);

const LABELS = {
  phone: ['☎  phone', 36],
  halo: ['🔑 halo', 36],
  gemini: ['⚡ gemini', 35],
  assistant: ['🔊 assistant', 34],
  listening: ['👂 listening', 2],
  caller: ['🎙  caller', 33],
  noise: ['·  noise', 2],
  drafting: ['💭 drafting', 35],
  drafted: ['✍  drafted', 35],
  checked: ['✅ checked', 32],
  fallback: ['↩  fallback', 33],
  stopped: ['■  ended', 36],
  transcript: ['📝 transcript', 36],
  analysis: ['🧠 analysis', 1],
  alert: ['📲 alert', 1],
} satisfies Record<Stage | string, [string, number]>;
export type PipelineStage = keyof typeof LABELS;

// The terminal is projected on stage, so words from a caller or a model lose their numbers.
const UNTRUSTED = new Set<PipelineStage>(['caller', 'drafted', 'assistant']);

const BANDS: Record<CallRecord['analysis']['band'], [string, number]> = {
  strong: ['STRONG warning signs', 31],
  some: ['SOME warning signs', 33],
  none: ['no warning signs', 32],
};

/** Prints one call's journey through Halo, stage by stage, for the audience to follow. */
export function pipeline(callNumber: number) {
  const began = Date.now();
  console.log(`\n${paint(1, `━━━ Call ${callNumber} ${'━'.repeat(44)}`)}`);
  const log = (stage: PipelineStage, detail: string, code?: number) => {
    const [label, labelCode] = LABELS[stage];
    const time = paint(2, `+${((Date.now() - began) / 1000).toFixed(1).padStart(5)}s`);
    const text = UNTRUSTED.has(stage) ? scrub(detail, REMOVED) : detail;
    console.log(
      `${time}  ${paint(labelCode, label.padEnd(13))} ${code ? paint(code, text) : text}`,
    );
  };
  return {
    log,
    analysis(record: CallRecord) {
      const { band, family, matchedPatternIds, summary } = record.analysis;
      const [words, code] = BANDS[band];
      log('analysis', `${words} · ${family.replaceAll('_', ' ')}`, code);
      log(
        'analysis',
        matchedPatternIds.length
          ? `matched ${matchedPatternIds.length} scam pattern(s) in Atlas: ${matchedPatternIds.join(', ')}`
          : 'no Atlas pattern matched',
      );
      log('analysis', scrub(summary, REMOVED));
    },
  };
}
