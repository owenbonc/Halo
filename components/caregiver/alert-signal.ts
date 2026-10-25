'use client';

// Browsers only allow sound after a tap, so the context is made inside that tap and kept until reload.
let context: AudioContext | null = null;
const listeners = new Set<() => void>();
const notify = () => {
  for (const listener of listeners) listener();
};

export function unlockSound() {
  if (!context) {
    context = new AudioContext();
    context.addEventListener('statechange', notify);
    // Safari 17+ then plays through the ring/silent switch.
    if ('audioSession' in navigator)
      (navigator as Navigator & { audioSession: { type: string } }).audioSession.type = 'playback';
  }
  void context.resume();
}

// Safari suspends the context on lock, calls and backgrounding, so "on" means running right now.
export const soundOn = () => context?.state === 'running';

export function onSoundChange(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

// Two falling tones, like a doorbell. Vibration works on Android; iPhones ignore it.
export function ring() {
  navigator.vibrate?.([300, 150, 300]);
  if (!context) return;
  const ctx = context;
  const play = () => {
    const start = ctx.currentTime;
    [880, 660].forEach((frequency, i) => {
      const tone = ctx.createOscillator();
      const gain = ctx.createGain();
      const at = start + i * 0.35;
      tone.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.4, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
      tone.connect(gain).connect(ctx.destination);
      tone.start(at);
      tone.stop(at + 0.32);
    });
  };
  if (ctx.state === 'running') play();
  else
    ctx
      .resume()
      .then(play)
      .catch(() => {});
}
