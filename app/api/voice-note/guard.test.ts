import { describe, expect, it } from 'vitest';
import { allowVoiceNote, MAX_UPLOAD_BYTES, uploadSizeError } from './guard';

describe('uploadSizeError', () => {
  it('refuses a request with no length, before reading the body', () => {
    expect(uploadSizeError(null)?.status).toBe(411);
    expect(uploadSizeError('abc')?.status).toBe(411);
    expect(uploadSizeError('0')?.status).toBe(411);
  });

  it('refuses an upload over the cap', () => {
    expect(uploadSizeError(String(MAX_UPLOAD_BYTES + 1))?.status).toBe(413);
  });

  it('accepts a normal recording', () => {
    expect(uploadSizeError('480000')).toBeNull();
  });
});

describe('allowVoiceNote', () => {
  it('allows five notes a minute per client, then refuses until the minute passes', () => {
    const start = 1_000_000;
    for (let i = 0; i < 5; i++) expect(allowVoiceNote('grandma', start + i)).toBe(true);
    expect(allowVoiceNote('grandma', start + 10)).toBe(false);
    expect(allowVoiceNote('someone-else', start + 10)).toBe(true);
    expect(allowVoiceNote('grandma', start + 60_001)).toBe(true);
  });
});
