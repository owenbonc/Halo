'use client';

// Browsers only allow sound after a tap, so the context is made inside that tap and kept until reload.
let context: AudioContext | null = null;

export function unlockSound() {
  context ??= new AudioContext();
  void context.resume();
}

export const soundOn = () => context !== null;

// Two falling tones, like a doorbell. Vibration works on Android; iPhones ignore it.
export function ring() {
  navigator.vibrate?.([300, 150, 300]);
  if (context?.state !== 'running') return;
  const start = context.currentTime;
  [880, 660].forEach((frequency, i) => {
    if (!context) return;
    const tone = context.createOscillator();
    const gain = context.createGain();
    const at = start + i * 0.35;
    tone.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.4, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
    tone.connect(gain).connect(context.destination);
    tone.start(at);
    tone.stop(at + 0.32);
  });
}
