import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Clay-style rounded boxes with a uniform bevel, cached by size.
const boxCache = new Map();
export function boxGeo(w, h, d, r = 0.06) {
  const rr = Math.max(0.002, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
  const key = [w, h, d, rr].map((n) => n.toFixed(3)).join('|');
  if (!boxCache.has(key)) boxCache.set(key, new RoundedBoxGeometry(w, h, d, 2, rr));
  return boxCache.get(key);
}

const cylCache = new Map();
export function cyl(rt, rb, h, seg = 20) {
  const key = [rt, rb, h, seg].join('|');
  if (!cylCache.has(key)) cylCache.set(key, new THREE.CylinderGeometry(rt, rb, h, seg));
  return cylCache.get(key);
}

// Anime / cel shading: three flat light bands instead of smooth gradients.
let _grad = null;
export function toonGradient() {
  if (!_grad) {
    _grad = new THREE.DataTexture(new Uint8Array([120, 190, 255]), 3, 1, THREE.RedFormat);
    _grad.minFilter = _grad.magFilter = THREE.NearestFilter;
    _grad.needsUpdate = true;
  }
  return _grad;
}

const matCache = new Map();
export function mat(color, o = {}) {
  // physical-material options (roughness etc.) do not apply to toon materials
  const { roughness, metalness, ...rest } = o; // eslint-disable-line no-unused-vars
  const key = color + JSON.stringify(rest);
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshToonMaterial({ color, gradientMap: toonGradient(), ...rest }));
  }
  return matCache.get(key);
}

export const vcMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonGradient() });

// Merge many boxes/custom geometries into ONE draw call, using vertex colours.
export function buildMerged(items) {
  const geos = items.map((it) => {
    const src = it.geo ? it.geo : boxGeo(it.size[0], it.size[1], it.size[2], it.r ?? 0.05);
    // Normalise: de-index and keep only the attributes every part shares, so merging never fails.
    const g = src.index ? src.toNonIndexed() : src.clone();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (it.rot) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...it.rot)));
    g.translate(it.pos[0], it.pos[1], it.pos[2]);
    const c = new THREE.Color(it.color);
    const n = g.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    return g;
  });
  const merged = mergeGeometries(geos, false);
  geos.forEach((g) => g.dispose());
  return merged;
}
