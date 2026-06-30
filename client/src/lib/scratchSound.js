/* ── Scratch Card sound effects ───────────────────────────────────
   Every sound here is synthesized in-browser with the Web Audio API
   instead of loaded from an .mp3/.wav file. That means:
     • Zero bytes to download → nothing to wait for, ever, on any
       connection (the literal fastest possible "lightweight audio").
     • No licensing risk from a third-party sound asset.
     • Works instantly offline / on first paint.
   If real licensed audio files are ever supplied, drop them in
   client/public/sounds/ and swap the implementations below for plain
   <audio> elements — every call site (start/nudge/stop/celebrate) is
   already isolated here as a small, swappable API.                */

let sharedCtx = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!sharedCtx) sharedCtx = new AudioCtor();
  if (sharedCtx.state === 'suspended') sharedCtx.resume().catch(() => {});
  return sharedCtx;
}

function makeNoiseBuffer(audioCtx, seconds = 2) {
  const length = Math.floor(audioCtx.sampleRate * seconds);
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/* A reusable "scratch" sound player: filtered, looping white noise
   whose volume we ramp up/down so it starts and stops the instant a
   finger touches/lifts off the foil — just like a real lottery card.
   Call start() on touch/mouse-down, nudge() on every move for a bit
   of organic texture variance, and stop() on touch/mouse-up. */
export function createScratchPlayer() {
  let source = null;
  let filter = null;
  let gain = null;
  let playing = false;

  function ensureGraph() {
    const audioCtx = getCtx();
    if (!audioCtx) return null;
    if (!source) {
      source = audioCtx.createBufferSource();
      source.buffer = makeNoiseBuffer(audioCtx, 2);
      source.loop = true;

      filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 0.6;

      gain = audioCtx.createGain();
      gain.gain.value = 0;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      source.start(0);
    }
    return audioCtx;
  }

  return {
    start() {
      const audioCtx = ensureGraph();
      if (!audioCtx || playing) return;
      playing = true;
      const now = audioCtx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.04);
    },
    // Tiny random filter-frequency wobble per scratch stroke — keeps the
    // loop from sounding like a flat, robotic tone while dragging.
    nudge() {
      if (!playing || !filter) return;
      const audioCtx = getCtx();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const target = 1300 + Math.random() * 1300;
      filter.frequency.cancelScheduledValues(now);
      filter.frequency.linearRampToValueAtTime(target, now + 0.05);
    },
    stop() {
      const audioCtx = getCtx();
      if (!audioCtx || !gain || !playing) return;
      playing = false;
      const now = audioCtx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.08);
    },
    dispose() {
      try { source && source.stop(); } catch { /* already stopped */ }
      source = null;
      filter = null;
      gain = null;
      playing = false;
    },
  };
}

/* Short celebratory rising chime — plays once when the reward is revealed. */
export function playCelebrationChime() {
  const audioCtx = getCtx();
  if (!audioCtx) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  const start = audioCtx.currentTime + 0.02;
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const noteGain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const t = start + i * 0.09;
    noteGain.gain.setValueAtTime(0, t);
    noteGain.gain.linearRampToValueAtTime(0.22, t + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(noteGain);
    noteGain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

/* Light haptic buzz on supported mobile devices — silently does
   nothing where the Vibration API isn't available (desktop, iOS Safari). */
export function vibrateSuccess() {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate([40, 30, 60]);
  }
}
