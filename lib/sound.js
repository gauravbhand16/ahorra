// Retro-Bollywood inspired generative sound (Web Audio, no files, all original).
// Harmonium-style drone + tabla-like keherwa rhythm + sitar-like plucked melody, plus small effects.
// Never autoplays: the AudioContext is only created after the visitor presses the sound button.
let ctx = null;
let master = null;
let musicBus = null;
let fxBus = null;
let noiseGain = null;
let droneOscs = [];
let timer = null;
let enabled = false;
let chapter = 0;
let step = 0;
let nextTime = 0;
let degree = 0;

const TONIC = 220; // A3
// semitone scales: sad & open for the problem, bright for the rest (Bhairavi-ish -> Bhoopali-ish)
const SCALE_SAD = [0, 1, 3, 5, 7, 8, 10, 12];
const SCALE_BRIGHT = [0, 2, 4, 7, 9, 12, 14, 16];
const BPM = [78, 88, 96, 100, 104, 108, 100];
const DENSITY = [0.35, 0.55, 0.7, 0.8, 0.9, 0.9, 0.6]; // how busy the rhythm and melody are

const hz = (semi, oct = 0) => TONIC * Math.pow(2, (semi + 12 * oct) / 12);

export function soundOn() {
  return enabled;
}

// ---------------------------------------------------------------- building blocks
function noiseBuffer(sec = 1) {
  const len = Math.floor(ctx.sampleRate * sec);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

// tabla-like hits: low "dha/ge" (pitch-dropping sine) and high "na/ti" (short filtered click)
function hitLow(t, vel = 1) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(190, t);
  o.frequency.exponentialRampToValueAtTime(78, t + 0.18);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5 * vel, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  o.connect(g).connect(musicBus);
  o.start(t);
  o.stop(t + 0.4);
}
function hitHigh(t, vel = 1) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(0.2);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2400;
  bp.Q.value = 6;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.32 * vel, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  src.connect(bp).connect(g).connect(musicBus);
  src.start(t);
  src.stop(t + 0.15);
  const o = ctx.createOscillator();
  const g2 = ctx.createGain();
  o.type = 'triangle';
  o.frequency.value = 520;
  g2.gain.setValueAtTime(0.0001, t);
  g2.gain.exponentialRampToValueAtTime(0.1 * vel, t + 0.005);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  o.connect(g2).connect(musicBus);
  o.start(t);
  o.stop(t + 0.15);
}

// sitar-like pluck: bright sawtooth through a quickly closing low-pass, with a little pitch bend
function pluck(t, freq, vel = 1, len = 0.9) {
  const o = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  const lp = ctx.createBiquadFilter();
  const g = ctx.createGain();
  o.type = 'sawtooth';
  o2.type = 'square';
  o.frequency.setValueAtTime(freq * 1.02, t);
  o.frequency.exponentialRampToValueAtTime(freq, t + 0.05);
  o2.frequency.value = freq * 2.003;
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(4200, t);
  lp.frequency.exponentialRampToValueAtTime(700, t + len * 0.7);
  lp.Q.value = 5;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.11 * vel, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  const g2 = ctx.createGain();
  g2.gain.value = 0.25;
  o.connect(lp);
  o2.connect(g2).connect(lp);
  lp.connect(g).connect(musicBus);
  o.start(t);
  o2.start(t);
  o.stop(t + len + 0.05);
  o2.stop(t + len + 0.05);
}

// ---------------------------------------------------------------- scheduler
// keherwa-style 8 beat cycle: Dha Ge Na Ti | Na Ka Dhi Na
const PATTERN = ['LL', 'l', 'H', 'h', 'H', 'h', 'L', 'H'];

function scheduleStep(t, s) {
  const dens = DENSITY[chapter] ?? 0.6;
  const p = PATTERN[s];
  if (p === 'LL') hitLow(t, 1);
  else if (p === 'L') hitLow(t, 0.8 * (dens > 0.5 ? 1 : 0.4));
  else if (p === 'l') {
    if (dens > 0.45) hitLow(t, 0.45);
  } else if (p === 'H') {
    if (dens > 0.5) hitHigh(t, 0.9);
  } else if (p === 'h') {
    if (dens > 0.6) hitHigh(t, 0.5);
  }
  // melody: random walk on the scale, mostly on even steps
  if (s % 2 === 0 && Math.random() < 0.35 + dens * 0.5) {
    const scale = chapter === 0 ? SCALE_SAD : SCALE_BRIGHT;
    degree = Math.max(0, Math.min(scale.length - 1, degree + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)]));
    if (s === 0 && Math.random() < 0.5) degree = 0;
    pluck(t, hz(scale[degree], 1), 0.7 + dens * 0.4);
  }
}

function tick() {
  if (!ctx || !enabled) return;
  const spb = 60 / (BPM[chapter] ?? 96);
  const stepLen = spb / 2;
  if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
  while (nextTime < ctx.currentTime + 0.25) {
    scheduleStep(nextTime, step);
    nextTime += stepLen;
    step = (step + 1) % 8;
  }
}

// ---------------------------------------------------------------- public api
export function enableSound() {
  if (typeof window === 'undefined') return;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);

    musicBus = ctx.createGain();
    musicBus.gain.value = 0.8;
    musicBus.connect(master);
    fxBus = ctx.createGain();
    fxBus.gain.value = 0.9;
    fxBus.connect(master);

    // harmonium-style drone with a gentle tremolo
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 650;
    const trem = ctx.createGain();
    trem.gain.value = 0.7;
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 5.2;
    lfoG.gain.value = 0.25;
    lfo.connect(lfoG).connect(trem.gain);
    lfo.start();
    lp.connect(trem).connect(musicBus);
    droneOscs = [0, 7, -12].map((semi, i) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = hz(semi, -0.0);
      o.detune.value = (i - 1) * 7;
      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.05 : 0.028;
      o.connect(g).connect(lp);
      o.start();
      return o;
    });

    // soft "belt hum" that follows scroll speed
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 280;
    noiseGain = ctx.createGain();
    noiseGain.gain.value = 0;
    src.connect(bp).connect(noiseGain).connect(master);
    src.start();
  }
  if (ctx.state === 'suspended') ctx.resume();
  enabled = true;
  nextTime = 0;
  step = 0;
  if (!timer) timer = setInterval(tick, 40);
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.4);
}

export function disableSound() {
  enabled = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (!ctx || !master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
}

export function setChapterSound(i) {
  chapter = Math.max(0, Math.min(BPM.length - 1, i));
  if (!ctx || !enabled) return;
  // drone follows the mood: sad chapter sits on the minor third, later chapters on the fifth
  const shift = chapter === 0 ? [0, 3, -12] : [0, 7, -12];
  droneOscs.forEach((o, k) => o.frequency.setTargetAtTime(hz(shift[k]), ctx.currentTime, 0.8));
}

export function updateSound(vel, p) {
  if (!ctx || !enabled || !noiseGain) return;
  const beltZone = p > 0.14 && p < 0.58 ? 1 : 0.35;
  const level = Math.min(0.2, Math.abs(vel) * 1.4) * beltZone;
  noiseGain.gain.setTargetAtTime(level, ctx.currentTime, 0.15);
}

// small effects: 'ting' (step reached / eligible), 'chime' (happy customer), 'pop'
export function playFx(name) {
  if (!ctx || !enabled) return;
  const t = ctx.currentTime + 0.01;
  const tone = (f, at, dur, vol, type = 'sine') => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(fxBus);
    o.start(at);
    o.stop(at + dur + 0.05);
  };
  if (name === 'ting') {
    tone(1318.5, t, 0.5, 0.22);
    tone(1976, t + 0.02, 0.45, 0.12);
  } else if (name === 'chime') {
    [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(f, t + i * 0.09, 0.7, 0.2, 'triangle'));
    hitLow(t, 0.9);
  } else if (name === 'pop') {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(300, t);
    o.frequency.exponentialRampToValueAtTime(900, t + 0.08);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g).connect(fxBus);
    o.start(t);
    o.stop(t + 0.15);
  }
}
