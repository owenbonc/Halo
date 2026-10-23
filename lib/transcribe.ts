// shortcut: canned transcript so the recorded line runs end to end; slice B wires Gemini.
const STUB_TRANSCRIPT =
  "[stub transcript] Hello, this is Detective Harris from the police. We've arrested someone using your bank card. A courier will collect your cash this afternoon. Don't tell your family, it's an ongoing investigation.";

export async function transcribe(_audio: Blob): Promise<string> {
  return STUB_TRANSCRIPT;
}
