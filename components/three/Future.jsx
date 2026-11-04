'use client';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { world, sseg, mulberry32, KX, lerp } from '../../lib/world';
import { C } from '../../lib/palette';
import { Reveal, LineGrow } from './parts';
import { KioskLite, GreenStore } from './models';

// Future vision only: an illustrative, stylised map of India. Green Stores are NOT existing stores.
const K = 1.7; // world units per degree
const LON0 = 75.86; // Indore = the original kiosk
const LAT0 = 22.72;
const proj = (lon, lat) => [(lon - LON0) * K, -(lat - LAT0) * K]; // [x, z]

const OUTLINE = [
  [74.3, 34.8], [75.6, 36.0], [77.8, 35.5], [78.9, 34.3], [79.2, 32.6], [78.4, 31.1], [79.0, 30.3], [80.2, 30.2], [80.6, 28.9], [81.9, 27.8],
  [83.6, 27.4], [85.2, 26.7], [87.0, 26.5], [88.1, 26.4], [88.8, 27.3], [89.7, 26.8], [91.6, 27.0], [92.4, 27.8], [94.2, 28.5], [95.8, 29.2],
  [97.3, 28.2], [96.2, 27.2], [95.2, 26.1], [94.6, 24.6], [93.4, 23.0], [92.6, 22.3], [92.3, 23.7], [91.6, 24.2], [91.0, 25.2], [89.9, 25.3],
  [89.1, 26.2], [88.8, 25.0], [88.9, 23.2], [89.0, 22.2], [88.2, 21.7], [86.8, 21.1], [86.4, 20.0], [85.2, 19.6], [84.0, 18.3], [82.4, 16.6],
  [81.2, 16.0], [80.3, 15.2], [80.2, 13.3], [79.9, 11.7], [79.4, 10.3], [78.3, 9.0], [77.5, 8.1], [76.6, 8.8], [76.2, 10.2], [75.4, 11.8],
  [74.7, 13.0], [74.1, 14.8], [73.6, 16.5], [72.9, 18.8], [72.8, 20.4], [72.2, 21.2], [71.0, 20.7], [70.0, 21.0], [69.0, 22.3], [68.5, 23.4],
  [69.8, 24.2], [70.3, 25.3], [69.7, 26.8], [70.6, 28.0], [72.2, 29.1], [73.8, 29.9], [74.6, 31.0], [74.6, 32.4], [74.0, 33.4],
];

// illustrative network locations, ordered roughly outward from Indore
const CITIES = [
  ['Bhopal', 77.4, 23.26], ['Ahmedabad', 72.6, 23.0], ['Nagpur', 79.1, 21.1], ['Pune', 73.9, 18.5], ['Jaipur', 75.8, 26.9],
  ['Mumbai', 72.9, 19.1], ['Hyderabad', 78.5, 17.4], ['Delhi', 77.2, 28.6], ['Lucknow', 80.9, 26.85], ['Bengaluru', 77.6, 12.97],
  ['Kolkata', 88.4, 22.6], ['Chennai', 80.3, 13.1], ['Chandigarh', 76.8, 30.7], ['Guwahati', 91.7, 26.2], ['Kochi', 76.3, 10.0],
];

function inside(lon, lat) {
  let c = false;
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const [xi, yi] = OUTLINE[i];
    const [xj, yj] = OUTLINE[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function IndiaLand() {
  const land = useRef();
  const trees = useRef();
  const group = useRef();
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    OUTLINE.forEach(([lon, lat], i) => {
      const x = (lon - LON0) * K;
      const y = (lat - LAT0) * K;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.16, bevelSegments: 2 });
    g.rotateX(-Math.PI / 2); // shape y (north) -> -z, extrusion -> +y
    return g;
  }, []);
  const mapMat = useMemo(() => new THREE.MeshStandardMaterial({ color: C.mint, roughness: 0.8, emissive: C.mint, emissiveIntensity: 0 }), []);

  const treeCount = world.low ? 70 : 150;
  useEffect(() => {
    const rnd = mulberry32(9);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    let n = 0;
    let guard = 0;
    while (n < treeCount && guard++ < 6000) {
      const lon = 68.5 + rnd() * 28;
      const lat = 8.2 + rnd() * 27;
      if (!inside(lon, lat)) continue;
      const [x, z] = proj(lon, lat);
      if (Math.hypot(x, z) < 2.2) continue;
      if (CITIES.some(([, cl, ct]) => Math.hypot(proj(cl, ct)[0] - x, proj(cl, ct)[1] - z) < 1.6)) continue;
      const s = 0.6 + rnd() * 0.7;
      m.compose(new THREE.Vector3(x, 0.7 + 0.6 * s, z), q, new THREE.Vector3(s, s, s));
      trees.current.setMatrixAt(n++, m);
    }
    trees.current.count = n;
    trees.current.instanceMatrix.needsUpdate = true;
  }, [treeCount]);

  useFrame(() => {
    const p = world.p;
    const t = sseg(p, 0.79, 0.85);
    const g = group.current;
    if (!g) return;
    g.visible = t > 0;
    g.scale.set(1, Math.max(0.0001, t), 1);
    mapMat.emissiveIntensity = 0.45 * sseg(p, 0.95, 0.99);
  });

  return (
    <group ref={group} position={[KX, 0.02, 0]} visible={false}>
      <mesh ref={land} geometry={geo} material={mapMat} receiveShadow castShadow />
      <instancedMesh ref={trees} args={[null, null, treeCount]} castShadow>
        <coneGeometry args={[0.5, 1.3, 6]} />
        <meshStandardMaterial color={C.deepGreen} roughness={0.9} />
      </instancedMesh>
    </group>
  );
}

function Marker({ x, z, a, swapAt, i }) {
  return (
    <>
      <Reveal a={a} b={a + 0.02} from={[0, 3, 0]} pos={[KX + x, 0.75, z]} out={[swapAt, swapAt + 0.02]} s0={0.01}>
        <group scale={0.62}>
          <KioskLite />
        </group>
      </Reveal>
      <Reveal a={swapAt} b={swapAt + 0.025} from={[0, 0, 0]} pos={[KX + x, 0.75, z]} s0={0.01}>
        <group scale={0.78}>
          <GreenStore />
        </group>
      </Reveal>
    </>
  );
}

export default function Future() {
  const markers = useMemo(
    () =>
      CITIES.map(([name, lon, lat], i) => {
        const [x, z] = proj(lon, lat);
        return { name, x, z, a: 0.825 + i * 0.0045, swapAt: 0.885 + i * 0.0028 };
      }),
    []
  );
  const sparkles = useRef();
  useFrame(() => {
    if (sparkles.current) sparkles.current.visible = world.p > 0.93;
  });
  return (
    <group>
      <IndiaLand />
      {/* the original kiosk (Indore) becomes the first Green Store */}
      <Reveal a={0.885} b={0.91} from={[0, 0, 0]} pos={[KX, 0.75, 0]} s0={0.01}>
        <group scale={0.95}>
          <GreenStore />
        </group>
      </Reveal>
      {markers.map((m, i) => (
        <group key={m.name}>
          <Marker x={m.x} z={m.z} a={m.a} swapAt={m.swapAt} i={i} />
          <LineGrow
            pts={[
              [KX + 0, 1.4, 0],
              [KX + m.x * 0.5, 1.4 + Math.hypot(m.x, m.z) * 0.16, m.z * 0.5],
              [KX + m.x, 1.4, m.z],
            ]}
            a={m.a - 0.006}
            b={m.a + 0.014}
            radius={0.1}
            pulses={1}
            intensity={1.1}
          />
        </group>
      ))}
      <group ref={sparkles} visible={false} position={[KX + 6, 6, -2]}>
        <Sparkles count={world.low ? 50 : 110} scale={[60, 12, 50]} size={5} speed={0.25} color={C.mint} opacity={0.8} />
      </group>
    </group>
  );
}
