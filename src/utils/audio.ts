let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

const PENTATONIC_SCALE = [
  523.25,
  587.33,
  659.25,
  783.99,
  880.00,
  1046.50,
  1174.66,
  1318.51,
];

export function playTactileClick(noteIndex: number = 0): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseFreq = PENTATONIC_SCALE[Math.abs(noteIndex) % PENTATONIC_SCALE.length];

    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    const thudFilter = ctx.createBiquadFilter();

    thudFilter.type = 'lowpass';
    thudFilter.frequency.setValueAtTime(800, now);

    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(180, now);
    thudOsc.frequency.exponentialRampToValueAtTime(60, now + 0.035);

    thudGain.gain.setValueAtTime(0.06, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    thudOsc.connect(thudFilter);
    thudFilter.connect(thudGain);
    thudGain.connect(ctx.destination);

    thudOsc.start(now);
    thudOsc.stop(now + 0.04);

    const toneOsc = ctx.createOscillator();
    const toneGain = ctx.createGain();
    const toneFilter = ctx.createBiquadFilter();

    toneFilter.type = 'lowpass';
    toneFilter.frequency.setValueAtTime(2400, now);

    toneOsc.type = 'sine';
    toneOsc.frequency.setValueAtTime(baseFreq, now);

    toneGain.gain.setValueAtTime(0.04, now);
    toneGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.14);

    toneOsc.connect(toneFilter);
    toneFilter.connect(toneGain);
    toneGain.connect(ctx.destination);

    toneOsc.start(now);
    toneOsc.stop(now + 0.15);
  } catch {}
}

export function playCopySuccess(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [587.33, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);

      gain.gain.setValueAtTime(0, now + i * 0.04);
      gain.gain.linearRampToValueAtTime(0.04, now + i * 0.04 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.2);
    });
  } catch {}
}
