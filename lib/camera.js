// Camera path. Keyframes are positioned by scroll progress; the path is a Catmull-Rom spline
// so the camera never "cuts" between scenes.
import { clamp } from './world';

export const KEYS = [
  // Scene 1 - inside the warehouse
  { p: 0.0, pos: [-22.5, 2.4, 0.6], look: [-10, 1.8, 0] },
  { p: 0.07, pos: [-17, 2.7, -0.4], look: [-5, 1.6, 0] },
  { p: 0.14, pos: [-12.5, 5.4, 9.5], look: [-3, 1.3, 0] },
  // Scene 2 - warehouse transforms, camera rises
  { p: 0.2, pos: [-8, 7.5, 11], look: [-6, 0.5, 0] },
  { p: 0.26, pos: [-3, 11, 15], look: [2, 0, 0] },
  { p: 0.3, pos: [4, 10, 13], look: [8, 0.5, 0] },
  // Scene 3 - follow the products through the network
  { p: 0.35, pos: [6, 8.5, 12], look: [10, 0.5, -1] },
  { p: 0.4, pos: [16, 8.5, 12], look: [20, 0.8, 0] },
  { p: 0.45, pos: [31, 9.5, 14], look: [36, 1.8, 0] },
  { p: 0.5, pos: [46, 8, 11], look: [52, 0.5, 0] },
  { p: 0.52, pos: [53, 7.5, 13], look: [60, 1.5, 0] },
  // Scene 4 - the kiosk
  { p: 0.56, pos: [55, 7, 15], look: [60, 2.4, 0] },
  { p: 0.6, pos: [67, 6.5, 14], look: [60, 2.4, 0] },
  { p: 0.64, pos: [60, 5.2, 13.5], look: [60, 2.4, 0] },
  { p: 0.68, pos: [55, 6.5, 14], look: [60, 2.4, 0] },
  // Scene 5 - impact islands
  { p: 0.7, pos: [60, 11, 19], look: [60, 1.5, -3] },
  { p: 0.76, pos: [68, 13, 17], look: [60, 1, -4] },
  { p: 0.8, pos: [74, 16, 18], look: [62, 0, -4] },
  // Scene 6 - pull away, India network
  { p: 0.85, pos: [62, 34, 30], look: [62, 0, -3] },
  { p: 0.92, pos: [66, 56, 40], look: [64, 0, -4] },
  // Scene 7 - final composition
  { p: 0.97, pos: [70, 50, 42], look: [64, 0, -3] },
  { p: 1.0, pos: [78, 40, 44], look: [64, 0, -2] },
];

function cr(a, b, c, d, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
}

export function sampleCamera(p, pos, look) {
  let i = 0;
  while (i < KEYS.length - 2 && p >= KEYS[i + 1].p) i++;
  const k0 = KEYS[Math.max(0, i - 1)];
  const k1 = KEYS[i];
  const k2 = KEYS[i + 1];
  const k3 = KEYS[Math.min(KEYS.length - 1, i + 2)];
  const t = clamp((p - k1.p) / (k2.p - k1.p));
  for (let j = 0; j < 3; j++) {
    pos[j] = cr(k0.pos[j], k1.pos[j], k2.pos[j], k3.pos[j], t);
    look[j] = cr(k0.look[j], k1.look[j], k2.look[j], k3.look[j], t);
  }
}
