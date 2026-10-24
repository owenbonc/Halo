import { z } from 'zod';
import { carriesNumberOrLink, scrub } from './scrub';
import {
  type Analysis,
  type Band,
  type CallRecord,
  type GuidanceId,
  type Pattern,
  ScamFamily,
} from './types';

export const Signals = z.object({
  claimsAuthority: z.boolean(),
  secrecy: z.boolean(),
  urgency: z.boolean(),
  moneyMovement: z.boolean(),
  remoteAccess: z.boolean(),
  asksForDetails: z.boolean(),
  givesNumber: z.boolean(),
  instructsScreener: z.boolean(),
  unclear: z.boolean(),
});
export type Signals = z.infer<typeof Signals>;

// What Argon returns. It only describes the call; the band is decided here, by fixed rules.
export const ModelVerdict = z.object({
  family: ScamFamily,
  signals: Signals,
  cues: z.array(z.string()),
  summary: z.string(),
});
export type ModelVerdict = z.infer<typeof ModelVerdict>;

// Green means no concern signal at all, so this is true whenever it is shown.
export const NONE_FALLBACK_SUMMARY =
  "The caller didn't ask for money, bank details or access to a device.";
export const UNCLEAR_SUMMARY = "I couldn't make out enough of the call to check it.";
export const DEGRADED_SUMMARY =
  "The full check didn't finish, so this is based on simple word checks only.";
export const FALLBACK_SUMMARY = 'This call matches a common scam pattern.';

const QUIET: Signals = {
  claimsAuthority: false,
  secrecy: false,
  urgency: false,
  moneyMovement: false,
  remoteAccess: false,
  asksForDetails: false,
  givesNumber: false,
  instructsScreener: false,
  unclear: false,
};
const CONCERNS = Object.keys(QUIET).filter((key) => key !== 'unclear') as (keyof Signals)[];

// The deterministic floor: the model can add warning signs but never remove these.
const WORD_RULES: Record<Exclude<keyof Signals, 'unclear'>, RegExp> = {
  claimsAuthority:
    /\b(police|detective|constable|sergeant|inspector|officer|fraud (team|department|squad)|security team|from (your|the|my|her) bank|microsoft|amazon|bt|hmrc)\b/i,
  secrecy:
    /\b(don't|do not|not to|mustn't|must not) (tell|discuss|mention)\b|\bkeep (this|it) (quiet|secret|between us)\b|\bongoing investigation\b|\bmay be involved\b|\bstaff (at|in) (your|her|the) (bank|branch) (are|is) involved\b/i,
  urgency: /\b(right now|straight away|immediately|today|within the hour|act now)\b/i,
  moneyMovement:
    /\b(withdraw|safe account|(move|transfer) (your|her|the) money|send (the |your |her )?money|buy gold|gold bars|gift cards?|vouchers?|itunes|google play|bitcoin|crypto(currency)?|bank transfer|jewell?er'?s?|courier (will|is going to|would|to) (collect|pick|come)|hand (it )?over)\b/i,
  remoteAccess:
    /\b(anydesk|teamviewer|remote access|share (your|her) screen|(install|download) (an |this |the )?(app|software|program))\b/i,
  asksForDetails:
    /\b(pin|card details|card number|one[- ]time (code|passcode)|security code|verification code|password|read (me )?the codes?)\b/i,
  givesNumber: /\b(ring|call) (me|him|us|them) (back )?on\b|\b(ring|call)\b.{0,40}\d/i,
  instructsScreener:
    /\bignore (all |your |the |previous )*(rules|instructions)\b|\b(tell|say|mark)\b.{0,30}\b(is|it's|as) (safe|genuine|legit|legitimate)\b|\byou are now\b|\b(note|message) (to|for) the (ai|assistant|screener)\b/i,
};
// Single words like "police" or "today" make poor quotes; these signals still count, they just aren't quoted.
const QUOTABLE = new Set<keyof Signals>([
  'secrecy',
  'moneyMovement',
  'remoteAccess',
  'asksForDetails',
]);

const CLAIMS_SAFE =
  /\bsafe\b(?! account\b)|\b(?:genuine|legit|legitimate|real|trusted|trustworthy|fine|ok|okay)\b|\bnothing to worry\b|\bnot a scam\b/i;

const straightQuotes = (text: string) => text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
const norm = (text: string) => straightQuotes(text).toLowerCase().replace(/\s+/g, ' ').trim();

// Screener transcripts label each turn; only the caller's words count as evidence.
export function callerText(transcript: string): string {
  const turns = transcript.split('\n').map((line) => line.trim());
  const caller = turns.filter((line) => /^caller:/i.test(line));
  if (caller.length === 0) return straightQuotes(transcript);
  return straightQuotes(caller.map((line) => line.slice('caller:'.length).trim()).join('\n'));
}

// The caller's clause around a match reads better on the card than a bare keyword.
function clauseAround(text: string, index: number): string {
  const stops = ['.', '!', '?', ',', ';', '\n'];
  const start = Math.max(...stops.map((stop) => text.lastIndexOf(stop, index - 1))) + 1;
  const ends = stops.map((stop) => text.indexOf(stop, index)).filter((at) => at !== -1);
  return text.slice(start, ends.length > 0 ? Math.min(...ends) : text.length).trim();
}

export function wordSignals(transcript: string): { signals: Signals; phrases: string[] } {
  const text = callerText(transcript);
  const signals = { ...QUIET };
  const phrases: string[] = [];
  for (const [key, rule] of Object.entries(WORD_RULES) as [keyof typeof WORD_RULES, RegExp][]) {
    const match = rule.exec(text);
    if (!match) continue;
    signals[key] = true;
    if (QUOTABLE.has(key)) phrases.push(clauseAround(text, match.index));
  }
  return { signals, phrases };
}

// The band is set here, never by the model's own judgement.
export function bandFor(signals: Signals, family: ScamFamily, corroborated: boolean): Band {
  const handover = signals.moneyMovement || signals.remoteAccess || signals.asksForDetails;
  const signs = CONCERNS.filter((key) => signals[key]).length;
  // Trying to steer the screener is itself a scam tell.
  if (signals.instructsScreener) return 'strong';
  // Asking for money, access or details under pressure is the core of every coached scam.
  if (handover && (signals.secrecy || signals.claimsAuthority || signals.urgency)) return 'strong';
  // "Tell no one" from someone claiming authority: the police and courier scripts.
  if (signals.secrecy && signals.claimsAuthority) return 'strong';
  // Argon and the Atlas library agree on the scam family, and there is more than one sign.
  if (family !== 'none' && corroborated && signs >= 2) return 'strong';
  if (handover || signals.secrecy || signals.givesNumber || signals.unclear || family !== 'none') {
    return 'some';
  }
  return 'none';
}

// Only phrases the caller really said, and none that carry a number or a link.
export function quotedCues(candidates: string[], transcript: string): string[] {
  const said = norm(callerText(transcript));
  const kept: string[] = [];
  for (const candidate of candidates) {
    const cue = candidate.trim().replace(/^["'“‘]+|["'”’.,]+$/g, '');
    const key = norm(cue);
    if (key.length < 3 || !said.includes(key) || carriesNumberOrLink(cue)) continue;
    if (kept.some((done) => norm(done).includes(key) || key.includes(norm(done)))) continue;
    kept.push(cue);
    if (kept.length === 4) break;
  }
  return kept;
}

const STRONG_STEPS: Record<ScamFamily, GuidanceId[]> = {
  courier: ['dont_call_back', 'different_phone', 'call_159'],
  police_impersonation: ['dont_call_back', 'different_phone', 'call_159'],
  bank_impersonation: ['dont_call_back', 'different_phone', 'call_159'],
  remote_access: ['hang_up', 'dont_call_back', 'call_159'],
  investment: ['dont_call_back', 'call_back_known_number', 'report_fraud'],
  other: ['dont_call_back', 'different_phone', 'call_159'],
  none: ['dont_call_back', 'different_phone', 'call_159'],
};

export function nextStepsFor(
  band: Band,
  family: ScamFamily,
  source: CallRecord['source'],
): GuidanceId[] {
  if (band === 'none') return ['call_back_known_number'];
  if (band === 'some') return ['call_back_known_number', 'call_159'];
  // The screener took the call, so no line of hers was ever held open.
  if (source === 'screener') return STRONG_STEPS[family].filter((id) => id !== 'different_phone');
  return [...STRONG_STEPS[family]];
}

function familyFor(
  verdict: ModelVerdict | null,
  signals: Signals,
  concern: boolean,
  patterns: Pattern[],
): ScamFamily {
  // Never guess a scam type from a mumble.
  if (signals.unclear && !concern) return 'none';
  const said = verdict?.family ?? 'none';
  if (said !== 'none' || !concern) return said;
  // The model saw nothing but the word rules did: name the closest library family.
  return patterns[0]?.family ?? 'other';
}

function summaryFor(verdict: ModelVerdict | null, signals: Signals, concern: boolean): string {
  if (!verdict) return DEGRADED_SUMMARY;
  if (signals.unclear && !concern) return UNCLEAR_SUMMARY;
  const cleaned = scrub(verdict.summary).slice(0, 200);
  return cleaned && !CLAIMS_SAFE.test(cleaned) ? cleaned : FALLBACK_SUMMARY;
}

// The card title already says no warning signs, so the summary says what the call was about.
function greenSummary(verdict: ModelVerdict | null): string {
  const cleaned = scrub(verdict?.summary ?? '').slice(0, 200);
  const usable = cleaned && !CLAIMS_SAFE.test(cleaned) && !/\bwarning signs?\b/i.test(cleaned);
  return usable ? cleaned : NONE_FALLBACK_SUMMARY;
}

export function decide(
  transcript: string,
  verdict: ModelVerdict | null,
  patterns: Pattern[],
  source: CallRecord['source'],
): Analysis {
  const words = wordSignals(transcript);
  const signals = Object.fromEntries(
    Object.keys(QUIET).map((key) => {
      const name = key as keyof Signals;
      return [name, words.signals[name] || (verdict?.signals[name] ?? false)];
    }),
  ) as Signals;
  // Without the model's read, nothing counts as clear, so the card is at least amber.
  if (!verdict) signals.unclear = true;
  const concern = CONCERNS.some((key) => signals[key]);
  const family = familyFor(verdict, signals, concern, patterns);
  const corroborated = patterns.slice(0, 3).some((pattern) => pattern.family === family);
  const band = bandFor(signals, family, corroborated);
  if (band === 'none') {
    return {
      band,
      family: 'none',
      cues: [],
      summary: greenSummary(verdict),
      nextSteps: nextStepsFor(band, 'none', source),
      matchedPatternIds: [],
    };
  }
  return {
    band,
    family,
    cues: quotedCues([...(verdict?.cues ?? []), ...words.phrases], transcript),
    summary: summaryFor(verdict, signals, concern),
    nextSteps: nextStepsFor(band, family, source),
    matchedPatternIds: patterns
      .filter((pattern) => pattern.family === family)
      .slice(0, 3)
      .map((pattern) => pattern.id),
  };
}
