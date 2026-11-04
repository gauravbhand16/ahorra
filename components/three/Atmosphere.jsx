'use client';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { sampleCamera } from '../../lib/camera';
import { world, clamp, idle } from '../../lib/world';
import { C } from '../../lib/palette';
import { mat } from '../../lib/geo';
import { win } from '../../lib/world';

function makeStops(list) {
  return list.map(([p, v]) => [p, typeof v === 'string' ? new THREE.Color(v) : v]);
}
function at(stops, p, out) {
  if (p <= stops[0][0]) return typeof out === 'number' ? stops[0][1] : out.copy(stops[0][1]);
  for (let i = 1; i < stops.length; i++) {
    if (p <= stops[i][0]) {
      const [p0, v0] = stops[i - 1];
      const [p1, v1] = stops[i];
      const t = (p - p0) / (p1 - p0);
      if (typeof v0 === 'number') return v0 + (v1 - v0) * t;
      return out.copy(v0).lerp(v1, t);
    }
  }
  const last = stops[stops.length - 1][1];
  return typeof last === 'number' ? last : out.copy(last);
}

const BG = makeStops([
  [0, '#F7EBD3'],
  [0.14, '#F8EDD6'],
  [0.22, '#BDE6F2'],
  [0.78, '#BDE6F2'],
  [0.86, '#B5E4DA'],
  [0.94, '#9ED9C4'],
  [0.985, C.darkGreen],
]);
const GROUND = makeStops([
  [0, '#EFE3C9'],
  [0.14, '#F2E7CF'],
  [0.26, '#E9F8D8'],
  [0.8, '#E2F5D0'],
  [0.9, '#DDF1DD'],
  [0.96, '#0B6153'],
  [1, C.deepGreen],
]);
const HEMI = makeStops([[0, 1.0], [0.14, 1.1], [0.3, 1.25], [0.9, 1.2], [1, 0.7]]);
const SUN = makeStops([[0, 1.0], [0.14, 1.1], [0.3, 1.15], [0.9, 1.1], [1, 0.8]]);
const SUNCOL = makeStops([[0, '#FFF4E0'], [0.2, '#FFF4E0'], [0.9, '#FFF6E8'], [1, '#CFE9DD']]);
const FOGN = makeStops([[0, 14], [0.14, 22], [0.3, 50], [0.7, 80], [0.85, 140], [1, 170]]);
const FOGF = makeStops([[0, 90], [0.14, 120], [0.3, 160], [0.7, 210], [0.85, 340], [1, 400]]);

export function Ground() {
  const m = useRef();
  const c = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    if (m.current) m.current.color.copy(at(GROUND, world.p, c));
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[20, -0.01, 0]} receiveShadow>
      <planeGeometry args={[600, 400]} />
      <meshStandardMaterial ref={m} color="#B9B09E" roughness={1} />
    </mesh>
  );
}

export function Atmosphere() {
  const { scene } = useThree();
  const sun = useRef();
  const hemi = useRef();
  const bg = useMemo(() => new THREE.Color(), []);
  const sc = useMemo(() => new THREE.Color(), []);
  const shadowSize = world.low ? 1024 : 2048;

  useEffect(() => {
    scene.background = new THREE.Color(BG[0][1]);
    scene.fog = new THREE.Fog(BG[0][1], 8, 60);
    if (sun.current) scene.add(sun.current.target);
    return () => {
      if (sun.current) scene.remove(sun.current.target);
    };
  }, [scene]);

  useFrame(() => {
    const p = world.p;
    at(BG, p, bg);
    scene.background.copy(bg);
    if (scene.fog) {
      scene.fog.color.copy(bg);
      scene.fog.near = at(FOGN, p, 0);
      scene.fog.far = at(FOGF, p, 0);
    }
    if (hemi.current) hemi.current.intensity = at(HEMI, p, 0);
    if (sun.current) {
      sun.current.intensity = at(SUN, p, 0);
      sun.current.color.copy(at(SUNCOL, p, sc));
      const l = world.look;
      sun.current.target.position.copy(l);
      sun.current.position.set(l.x + 14, l.y + 24, l.z + 12);
    }
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={['#ffffff', '#F6F8EA', 0.9]} />
      <directionalLight
        ref={sun}
        castShadow={!world.low}
        intensity={1}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
    </>
  );
}

export function CameraRig() {
  const pos = useMemo(() => [0, 0, 0], []);
  const look = useMemo(() => [0, 0, 0], []);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame((state) => {
    const cam = state.camera;
    const p = clamp(world.p);
    sampleCamera(p, pos, look);
    const aspect = state.size.width / state.size.height;
    world.aspect = aspect;
    // portrait screens: wider field of view and a little extra distance so the world still fits
    const f = clamp(1 / aspect - 1, 0, 1.2);
    const fov = 38 + f * 16;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    const dolly = 1 + f * 0.35;
    const t = idle();
    const sway = world.reduced ? 0 : 1;
    v.set(look[0], look[1], look[2]);
    cam.position.set(
      look[0] + (pos[0] - look[0]) * dolly + Math.sin(t * 0.35) * 0.12 * sway,
      look[1] + (pos[1] - look[1]) * dolly + Math.sin(t * 0.27 + 1) * 0.08 * sway,
      look[2] + (pos[2] - look[2]) * dolly
    );
    cam.lookAt(v);
    world.look.copy(v);
  });
  return null;
}

// Soft anime clouds drifting across the sky once the story leaves the warehouse.
const CLOUDS = Array.from({ length: 14 }, (_, i) => ({
  x: -20 + i * 9.5 + (i % 3) * 3,
  y: 17 + (i % 4) * 4,
  z: -34 - (i % 5) * 7,
  s: 1.6 + (i % 3) * 0.7,
}));

export function Clouds() {
  const g = useRef();
  const white = useMemo(() => mat('#FFFFFF'), []);
  useFrame(() => {
    if (!g.current) return;
    const v = win(world.p, 0.17, 0.24, 0.9, 0.96);
    g.current.visible = v > 0.01;
    g.current.position.x = Math.sin(idle() * 0.05) * 3;
    g.current.position.y = (1 - v) * 10;
  });
  return (
    <group ref={g}>
      {CLOUDS.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
          <mesh material={white} userData={{ noOutline: false }}>
            <sphereGeometry args={[2, 14, 10]} />
          </mesh>
          <mesh material={white} position={[2.1, -0.4, 0]}>
            <sphereGeometry args={[1.5, 14, 10]} />
          </mesh>
          <mesh material={white} position={[-2.2, -0.5, 0.2]}>
            <sphereGeometry args={[1.4, 14, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
