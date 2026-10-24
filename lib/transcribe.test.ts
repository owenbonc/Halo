import { afterEach, describe, expect, it, vi } from 'vitest';

const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));
vi.mock('./gemini', () => ({
  TRANSCRIBE_MODEL: 'gemini-3.8-flash',
  gemini: () => ({ models: { generateContent } }),
}));

import { transcribe } from './transcribe';

afterEach(() => generateContent.mockReset());

describe('transcribe', () => {
  it.each(['audio/wav', 'audio/webm;codecs=opus'])(
    'sends %s audio with the bare MIME type and returns the transcript',
    async (type) => {
      const text = 'A courier will collect my cash. Do not tell my family.';
      generateContent.mockResolvedValue({ text: `  ${text}\n` });
      const audio = new Blob(['synthetic-audio'], { type });

      expect(await transcribe(audio)).toBe(text);
      expect(generateContent).toHaveBeenCalledWith({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: type.split(';')[0],
                  data: Buffer.from('synthetic-audio').toString('base64'),
                },
              },
              { text: expect.stringContaining('word for word') },
            ],
          },
        ],
        config: { temperature: 0 },
      });
    },
  );

  it('propagates provider failures instead of reporting an empty recording', async () => {
    const error = new Error('synthetic provider failure');
    generateContent.mockRejectedValue(error);
    await expect(transcribe(new Blob(['synthetic-audio']))).rejects.toBe(error);
  });

  it('bounds transcripts and preserves silence as empty text', async () => {
    generateContent.mockResolvedValueOnce({ text: 'a'.repeat(20_001) }).mockResolvedValueOnce({});
    expect(await transcribe(new Blob(['synthetic-audio']))).toHaveLength(20_000);
    expect(await transcribe(new Blob(['synthetic-audio']))).toBe('');
  });
});
