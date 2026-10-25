export function startSpeech(text: string, ended: () => void, failed: () => void): () => void {
  let active = true;
  let synth: SpeechSynthesis | undefined;
  const finish = (callback: () => void) => {
    if (!active) return;
    active = false;
    callback();
  };
  try {
    if (
      typeof window === 'undefined' ||
      !window.speechSynthesis ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      finish(failed);
    } else {
      synth = window.speechSynthesis;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-GB';
      utterance.rate = 0.9;
      utterance.onend = () => finish(ended);
      utterance.onerror = () => finish(failed);
      synth.speak(utterance);
    }
  } catch {
    finish(failed);
  }
  return () => {
    // Cancelled or replaced speech must not change the next reading's status.
    active = false;
    try {
      synth?.cancel();
    } catch {
      /* Cleanup must also work when browser speech fails. */
    }
  };
}
