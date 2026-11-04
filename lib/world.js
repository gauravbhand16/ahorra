// Shared, mutable "world" state. Scroll writes it, every 3D scene and overlay reads it.
// Everything in the film is a pure function of world.p (0..1), so scrolling backwards
// reverses the animation exactly.
import * as THREE from 'three';

export const KX = 60; // x position of the ahorra kiosk (Indore on the future map)

export const world = {
  p: 0, // smoothed scroll progress 0..1
  target: 0, // raw scroll progress
  vel: 0, // progress velocity (per second)
  time: 0, // seconds since start (idle motion only)
  reduced: false,
  mobile: false,
  low: false,
  aspect: 1.6,
  look: new THREE.Vector3(),
};

export const idle = () => (world.reduced ? 0 : world.time);

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (p, a, b) => clamp((p - a) / (b - a));
export const smooth = (t) => t * t * (3 - 2 * t);
export const sseg = (p, a, b) => smooth(seg(p, a, b));
export const outBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
// 0 -> 1 between a..b, 1 -> 0 between c..d
export const win = (p, a, b, c, d) => sseg(p, a, b) * (1 - sseg(p, c, d));

export function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Story structure -----------------------------------------------------------
export const CHAPTERS = [
  { id: 'problem', name: 'The problem', a: 0.0, b: 0.14 },
  { id: 'opportunity', name: 'The opportunity', a: 0.14, b: 0.3 },
  { id: 'how', name: 'How ahorra works', a: 0.3, b: 0.52 },
  { id: 'retail', name: 'The retail experience', a: 0.52, b: 0.68 },
  { id: 'impact', name: 'The impact', a: 0.68, b: 0.8 },
  { id: 'future', name: 'The future', a: 0.8, b: 0.94 },
  { id: 'closing', name: 'Closing', a: 0.94, b: 1.0 },
];

export function chapterAt(p) {
  for (let i = CHAPTERS.length - 1; i >= 0; i--) if (p >= CHAPTERS[i].a) return i;
  return 0;
}

// Where the nav links take the visitor on the timeline
export const NAV_TARGETS = {
  home: 0,
  about: 0.19,
  how: 0.33,
  brands: 0.715,
  contact: 1,
};
