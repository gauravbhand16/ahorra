'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { world, seg, sseg, outBack, lerp, idle } from '../../lib/world';
import { boxGeo, cyl, mat, vcMat, buildMerged } from '../../lib/geo';
import { C } from '../../lib/palette';

// ---------------------------------------------------------------- basic box
export function RBox({ pos = [0, 0, 0], size = [1, 1, 1], color = C.ivory, r = 0.06, rot, cast = true, receive = true, mo }) {
  return (
    <mesh
      position={pos}
      rotation={rot}
      geometry={boxGeo(size[0], size[1], size[2], r)}
      material={mat(color, mo)}
      castShadow={cast}
      receiveShadow={receive}
    />
  );
}

// ---------------------------------------------------------------- merged static meshes
export function Merged({ items, cast = true, receive = true, innerRef }) {
  const geo = useMemo(() => buildMerged(items), [items]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh ref={innerRef} geometry={geo} material={vcMat} castShadow={cast} receiveShadow={receive} />;
}

// ---------------------------------------------------------------- scroll-driven reveal
// Group that rises / pops in between p=a..b and (optionally) shrinks away between out[0]..out[1].
export function Reveal({ a, b, from = [0, -3, 0], pos = [0, 0, 0], s0 = 0.001, out, children, rot }) {
  const ref = useRef();
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const p = world.p;
    const t = seg(p, a, b);
    const o = out ? sseg(p, out[0], out[1]) : 0;
    if (t <= 0 || o >= 1) {
      g.visible = false;
      return;
    }
    g.visible = true;
    const e = outBack(t);
    const k = (1 - o) * lerp(s0, 1, e);
    g.scale.setScalar(Math.max(0.0001, k));
    g.position.set(pos[0] + from[0] * (1 - e), pos[1] + from[1] * (1 - e), pos[2] + from[2] * (1 - e));
  });
  return (
    <group ref={ref} position={pos} rotation={rot} visible={false}>
      {children}
    </group>
  );
}

// ---------------------------------------------------------------- HTML label pinned in 3D
export function Label3D({ pos, children, a, b, out, kind = '' }) {
  const ref = useRef();
  useFrame(() => {
    const el = ref.current;
    if (!el) return;
    const t = sseg(world.p, a, b) * (out ? 1 - sseg(world.p, out[0], out[1]) : 1);
    el.style.opacity = t.toFixed(3);
    el.style.transform = `translateY(${((1 - t) * 10).toFixed(1)}px) scale(${(0.9 + 0.1 * t).toFixed(3)})`;
  });
  return (
    <Html position={pos} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
      <div ref={ref} className={`tag3d ${kind}`} style={{ opacity: 0 }}>
        {children}
      </div>
    </Html>
  );
}

// ---------------------------------------------------------------- glowing tube that draws itself
export function LineGrow({ pts, a, b, out, radius = 0.07, color = C.mint, intensity = 0.9, pulses = 0, segs = 48 }) {
  const { geo, curve, count } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q)));
    const geo = new THREE.TubeGeometry(curve, segs, radius, 6, false);
    return { geo, curve, count: geo.index.count };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.4 }),
    [color, intensity]
  );
  const grp = useRef();
  const pulseRefs = useRef([]);
  const pulseGeo = useMemo(() => new THREE.SphereGeometry(radius * 2.3, 10, 10), [radius]);
  const pulseMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff' }), []);
  useFrame(() => {
    const g = grp.current;
    if (!g) return;
    const p = world.p;
    const t = sseg(p, a, b);
    const o = out ? sseg(p, out[0], out[1]) : 0;
    if (t <= 0 || o >= 1) {
      g.visible = false;
      return;
    }
    g.visible = true;
    g.scale.setScalar(Math.max(0.0001, 1 - o));
    geo.setDrawRange(0, Math.floor((t * count) / 3) * 3);
    for (let i = 0; i < pulses; i++) {
      const m = pulseRefs.current[i];
      if (!m) continue;
      const u = ((world.reduced ? p * 4 : world.time * 0.22 + p * 2) + i / pulses) % 1;
      curve.getPoint(u * t, m.position);
      m.visible = t > 0.98 || u * t < t;
    }
  });
  return (
    <group ref={grp} visible={false}>
      <mesh geometry={geo} material={material} />
      {Array.from({ length: pulses }).map((_, i) => (
        <mesh key={i} ref={(el) => (pulseRefs.current[i] = el)} geometry={pulseGeo} material={pulseMat} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------- products (FMCG-style)
export function Product({ kind = 'box', color = C.mint, pos = [0, 0, 0], rot, s = 1 }) {
  const body = mat(color);
  const label = mat(C.white);
  const dark = mat(C.deepGreen);
  let inner = null;
  switch (kind) {
    case 'can':
      inner = (
        <>
          <mesh position={[0, 0.275, 0]} geometry={cyl(0.2, 0.2, 0.55)} material={body} castShadow />
          <mesh position={[0, 0.28, 0]} geometry={cyl(0.205, 0.205, 0.2)} material={label} castShadow />
          <mesh position={[0, 0.56, 0]} geometry={cyl(0.17, 0.2, 0.04)} material={mat(C.ivory)} />
        </>
      );
      break;
    case 'bottle':
      inner = (
        <>
          <mesh position={[0, 0.24, 0]} geometry={cyl(0.19, 0.19, 0.48)} material={body} castShadow />
          <mesh position={[0, 0.24, 0]} geometry={cyl(0.195, 0.195, 0.18)} material={label} />
          <mesh position={[0, 0.56, 0]} geometry={cyl(0.08, 0.1, 0.16)} material={body} castShadow />
          <mesh position={[0, 0.68, 0]} geometry={cyl(0.09, 0.09, 0.07)} material={dark} />
        </>
      );
      break;
    case 'pouch':
      inner = (
        <>
          <mesh position={[0, 0.37, 0]} geometry={boxGeo(0.6, 0.74, 0.14, 0.05)} material={body} castShadow />
          <mesh position={[0, 0.37, 0.075]} geometry={boxGeo(0.36, 0.26, 0.01, 0.004)} material={label} />
        </>
      );
      break;
    case 'jar':
      inner = (
        <>
          <mesh position={[0, 0.21, 0]} geometry={cyl(0.3, 0.3, 0.42)} material={body} castShadow />
          <mesh position={[0, 0.21, 0]} geometry={cyl(0.305, 0.305, 0.16)} material={label} />
          <mesh position={[0, 0.46, 0]} geometry={cyl(0.31, 0.31, 0.1)} material={dark} castShadow />
        </>
      );
      break;
    default:
      inner = (
        <>
          <mesh position={[0, 0.35, 0]} geometry={boxGeo(0.5, 0.7, 0.28, 0.04)} material={body} castShadow />
          <mesh position={[0, 0.38, 0.145]} geometry={boxGeo(0.32, 0.26, 0.01, 0.004)} material={label} />
        </>
      );
  }
  return (
    <group position={pos} rotation={rot} scale={s}>
      {inner}
    </group>
  );
}

// people + box buddies live in Anime.jsx
export { Person, swing, BoxBuddy, applyMood } from './Anime';

// Walk cycle + placement helper. points = [[p, x, z], ...]
export function makePath(points) {
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    const [, x0, z0] = points[i - 1];
    const [, x1, z1] = points[i];
    cum.push(cum[i - 1] + Math.hypot(x1 - x0, z1 - z0));
  }
  return function at(p) {
    if (p <= points[0][0]) return { x: points[0][1], z: points[0][2], dist: 0, dx: 0, dz: 0, active: false };
    const last = points.length - 1;
    if (p >= points[last][0]) return { x: points[last][1], z: points[last][2], dist: cum[last], dx: 0, dz: 0, active: p < points[last][0] + 0.001 };
    let i = 0;
    while (i < last - 1 && p >= points[i + 1][0]) i++;
    const [p0, x0, z0] = points[i];
    const [p1, x1, z1] = points[i + 1];
    const t = (p - p0) / (p1 - p0);
    const e = t; // linear: constant walking speed
    return {
      x: lerp(x0, x1, e),
      z: lerp(z0, z1, e),
      dist: cum[i] + (cum[i + 1] - cum[i]) * e,
      dx: x1 - x0,
      dz: z1 - z0,
      active: true,
    };
  };
}


// ---------------------------------------------------------------- logo handling
// The real ahorra logo is NOT recreated here. Drop the original file in /public/brand/
// as ahorra-logo.svg (or .png). Until it exists, a plain lowercase text stand-in is shown.
const LOGO_SOURCES = ['/brand/ahorra-logo-transparent.png'];
let logoState = null;
const logoListeners = new Set();

function fallbackTexture() {
  const cv = document.createElement('canvas');
  cv.width = 768;
  cv.height = 256;
  const g = cv.getContext('2d');
  g.fillStyle = C.deepGreen;
  g.font = '700 150px ui-rounded, "Segoe UI", system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('ahorra', 384, 140);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function loadLogo(i = 0) {
  if (i >= LOGO_SOURCES.length) return;
  const img = new Image();
  img.onload = () => {
    const w = img.naturalWidth || 300;
    const h = img.naturalHeight || 100;
    const cv = document.createElement('canvas');
    const scale = Math.min(2, 2000 / Math.max(w, h));
    cv.width = Math.round(w * scale);
    cv.height = Math.round(h * scale);
    try {
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    } catch (e) {
      return;
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    logoState = { tex: t, aspect: w / h, real: true };
    logoListeners.forEach((fn) => fn());
  };
  img.onerror = () => loadLogo(i + 1);
  img.src = LOGO_SOURCES[i];
}

export function useLogoTexture() {
  const [, force] = useState(0);
  useEffect(() => {
    if (!logoState) {
      logoState = { tex: fallbackTexture(), aspect: 3, real: false };
      loadLogo(0);
    }
    const fn = () => force((n) => n + 1);
    logoListeners.add(fn);
    force((n) => n + 1);
    return () => logoListeners.delete(fn);
  }, []);
  return logoState || { tex: null, aspect: 3, real: false };
}

// White backing panel + logo plane, facing +z. Never recolours or reshapes the logo.
export function LogoSign({ width = 4, height = 1.2, pos = [0, 0, 0], rot, depth = 0.16, backFace = false }) {
  const { tex, aspect } = useLogoTexture();
  const lh = height * 0.62;
  const lw = Math.min(width * 0.8, lh * aspect);
  const lh2 = lw / aspect;
  const planeMat = useMemo(
    () => (tex ? new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }) : null),
    [tex]
  );
  return (
    <group position={pos} rotation={rot}>
      <RBox size={[width, height, depth]} color={C.white} r={0.07} />
      {planeMat && (
        <mesh position={[0, 0, depth / 2 + 0.004]} material={planeMat}>
          <planeGeometry args={[lw, lh2]} />
        </mesh>
      )}
      {planeMat && backFace && (
        <mesh position={[0, 0, -depth / 2 - 0.004]} rotation={[0, Math.PI, 0]} material={planeMat}>
          <planeGeometry args={[lw, lh2]} />
        </mesh>
      )}
    </group>
  );
}
