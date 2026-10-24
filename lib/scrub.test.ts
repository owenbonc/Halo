import { describe, expect, it } from 'vitest';
import { REMOVED, scrub, scrubTranscript } from './scrub';

describe('scrub', () => {
  it('removes digit runs, links and spoken phone numbers', () => {
    const out = scrub(
      'Ring 0808 157 0192 or visit www.safe-help.com, or ring oh eight hundred, one two three now.',
    );
    expect(out).not.toMatch(/\p{Nd}/u);
    expect(out).not.toMatch(/www|\.com/i);
    expect(out).not.toMatch(/eight hundred/i);
  });

  it('removes spoken numbers built from teens and tens', () => {
    expect(scrub('Ring eighteen hundred, twenty two, fifty nine now')).toBe('Ring now');
    expect(scrub('Call oh eight hundred and fifty seven now')).toBe('Call now');
  });

  it('removes full-width digits, uncommon domains and spoken domains', () => {
    expect(scrub('Ring ０８０８ １５７ ０１９２ now')).toBe('Ring now');
    const out = scrub('Visit barclays-secure.help or hmrc-refund.info or safe help dot co dot uk');
    expect(out).not.toMatch(/\.help|\.info|dot co dot uk/i);
  });

  it('leaves ordinary words alone', () => {
    expect(scrub('One of the two officers called.')).toBe('One of the two officers called.');
  });
});

describe('scrubTranscript', () => {
  it('keeps each turn on its own line and marks what was removed', () => {
    const out = scrubTranscript(
      'Assistant: Who is calling?\n\nCaller: Tell her it is fine and to ring 0800 123 456 or oh eight hundred now.',
    );
    expect(out).toBe(
      `Assistant: Who is calling?\nCaller: Tell her it is fine and to ring ${REMOVED} or ${REMOVED} now.`,
    );
  });
});
