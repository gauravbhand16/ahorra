'use client';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { world, sseg, mulberry32, idle } from '../../lib/world';
import { C } from '../../lib/palette';
import { Merged, Reveal, RBox, Label3D, BoxBuddy } from './parts';
import { cyl, mat } from '../../lib/geo';

const BOX_COLORS = [C.cardboard, C.cardboardDark, C.cardboardLight, C.cardboard, C.cardboardDark, C.ivory, C.softMint];

const BUDDIES = [
  { x: -19.6, z: 1.5, size: [1.0, 0.9, 0.9], c: C.cardboard, ry: -1.3 },
  { x: -17.4, z: 2.5, size: [0.85, 0.78, 0.8], c: C.cardboardLight, ry: -1.8 },
  { x: -15.8, z: 1.1, size: [1.05, 0.95, 0.95], c: C.cardboardDark, ry: -1.45 },
  { x: -14.2, z: 2.6, size: [0.8, 0.75, 0.75], c: C.cardboard, ry: -1.6 },
  { x: -12.6, z: 1.3, size: [0.95, 0.85, 0.85], c: C.cardboardLight, ry: -1.35 },
  { x: -11.2, z: 2.3, size: [0.85, 0.8, 0.8], c: C.cardboardDark, ry: -1.7 },
];

// Scene 1 characters: the unsold boxes look worried (sweat drops) because their expiry date is near.
function SadBuddies() {
  const rigs = useMemo(() => BUDDIES.map(() => ({ mood: 'sad' })), []);
  return (
    <Reveal a={-1} b={0} out={[0.15, 0.19]} from={[0, 0, 0]}>
      {BUDDIES.map((b, i) => (
        <group key={i} position={[b.x, 0.08, b.z]} rotation={[0, b.ry, 0]}>
          <BoxBuddy rig={rigs[i]} size={b.size} color={b.c} mood="sad" />
        </group>
      ))}
    </Reveal>
  );
}

// A dumpster overflowing with perfectly good food: what happens when surplus never sells.
function Apple({ pos, s = 1 }) {
  return (
    <group position={pos} scale={s}>
      <mesh material={mat('#e0483f')} castShadow>
        <sphereGeometry args={[0.2, 14, 12]} />
      </mesh>
      <mesh position={[0, 0.2, 0]} material={mat('#5b3a29')}>
        <cylinderGeometry args={[0.02, 0.02, 0.1, 6]} />
      </mesh>
      <mesh position={[0.07, 0.24, 0]} rotation={[0, 0, -0.6]} material={mat('#4caf79')} scale={[1, 0.4, 0.6]}>
        <sphereGeometry args={[0.1, 8, 6]} />
      </mesh>
    </group>
  );
}
function Dumpster() {
  return (
    <Reveal a={-1} b={0} out={[0.12, 0.19]} from={[0, 0, 0]} pos={[-8.2, 0, 3.4]} rot={[0, -0.5, 0]}>
      <RBox pos={[0, 0.85, 0]} size={[2.6, 1.5, 1.5]} color={C.darkGreen} r={0.08} />
      <RBox pos={[0, 1.62, 0]} size={[2.75, 0.16, 1.65]} color={C.deepGreen} r={0.05} />
      <RBox pos={[-0.2, 1.95, -0.86]} size={[2.6, 0.12, 1.5]} color={C.deepGreen} r={0.05} rot={[-0.75, 0, 0]} />
      {[-1, 1].map((x) => (
        <mesh key={x} position={[x * 1.0, 0.2, 0.55]} rotation={[0, 0, Math.PI / 2]} geometry={cyl(0.2, 0.2, 0.18, 12)} material={mat('#1d2f2b')} castShadow />
      ))}
      <Apple pos={[-0.6, 1.9, 0.1]} s={1.1} />
      <Apple pos={[0.1, 2.0, -0.1]} />
      <Apple pos={[0.7, 1.85, 0.3]} s={1.2} />
      <mesh position={[0.2, 1.88, 0.45]} rotation={[0.2, 0.4, 1.57]} material={mat('#e8b86b')} castShadow>
        <capsuleGeometry args={[0.16, 0.5, 4, 10]} />
      </mesh>
      <mesh position={[-0.2, 1.92, -0.35]} rotation={[0.3, 0.2, 0.3]} material={mat('#ffe27a')} castShadow>
        <torusGeometry args={[0.28, 0.07, 8, 14, Math.PI * 0.85]} />
      </mesh>
      <RBox pos={[1.0, 1.82, -0.3]} size={[0.34, 0.5, 0.3]} color={C.white} r={0.04} rot={[0, 0.5, 0.3]} />
      <Apple pos={[1.7, 0.2, 0.9]} s={1} />
      <Apple pos={[-1.8, 0.2, 1.1]} s={0.9} />
    </Reveal>
  );
}

// Scene 1: a quiet warehouse full of unsold inventory. Scene 2 lowers the walls and lifts the lid.
export default function Warehouse() {
  const wallRef = useRef();
  const dustRef = useRef();
  const dustMat = useRef();

  const stock = useMemo(() => {
    const rnd = mulberry32(11);
    const items = [];
    const unitX = [-33, -27, -21, -15, -9, -3];
    const L = 5.4;
    const D = 2.0;
    const H = 5.4;
    for (const z of [-5.6, 5.6]) {
      for (const cx of unitX) {
        for (const dx of [-L / 2, L / 2])
          for (const dz of [-D / 2, D / 2]) items.push({ pos: [cx + dx, H / 2, z + dz], size: [0.14, H, 0.14], color: C.deepGreen, r: 0.04 });
        [0.5, 2.2, 3.9].forEach((y) => {
          items.push({ pos: [cx, y, z], size: [L, 0.12, D], color: C.beige, r: 0.04 });
          let x = cx - L / 2 + 0.45;
          while (x < cx + L / 2 - 0.45) {
            const w = 0.7 + rnd() * 0.6;
            const h = 0.5 + rnd() * 0.9;
            const d = 0.9 + rnd() * 0.7;
            if (rnd() < 0.1) {
              x += w;
              continue;
            }
            const tilt = rnd() < 0.1 ? (rnd() - 0.5) * 0.28 : 0;
            const col = BOX_COLORS[Math.floor(rnd() * BOX_COLORS.length)];
            const bx = x + w / 2;
            const bz = z + (rnd() - 0.5) * 0.2;
            items.push({ pos: [bx, y + 0.06 + h / 2, bz], size: [w, h, d], rot: [0, 0, tilt], color: col, r: 0.05 });
            if (rnd() < 0.5 && col !== C.ivory && col !== C.softMint)
              items.push({ pos: [bx, y + 0.06 + h + 0.004, bz], size: [w * 0.22, 0.012, d * 0.98], rot: [0, 0, tilt], color: C.tape, r: 0.004 });
            x += w + 0.06 + rnd() * 0.12;
          }
        });
      }
    }
    // pallet piles at the aisle edges: surplus that has been sitting
    const rnd2 = mulberry32(5);
    const pileCount = world.low ? 7 : 12;
    for (let i = 0; i < pileCount; i++) {
      const z = i % 2 ? 3.1 : -3.1;
      const px = -33 + (i / pileCount) * 31 + rnd2() * 1.2;
      items.push({ pos: [px, 0.08, z], size: [1.5, 0.16, 1.5], color: C.cardboardDark, r: 0.03 });
      const layers = 2 + Math.floor(rnd2() * 3);
      for (let ly = 0; ly < layers; ly++)
        for (let k = 0; k < 4; k++) {
          const ox = (k % 2 ? 0.37 : -0.37) + (rnd2() - 0.5) * 0.06;
          const oz = (k < 2 ? 0.37 : -0.37) + (rnd2() - 0.5) * 0.06;
          items.push({
            pos: [px + ox, 0.16 + 0.36 + ly * 0.74, z + oz],
            size: [0.7, 0.7, 0.7],
            rot: [0, (rnd2() - 0.5) * 0.12, 0],
            color: BOX_COLORS[Math.floor(rnd2() * 5)],
            r: 0.05,
          });
        }
    }
    return items;
  }, []);

  const walls = useMemo(
    () => [
      { pos: [-18, 3.25, -9], size: [36, 6.5, 0.3], color: C.ivory, r: 0.05 },
      { pos: [-18, 0.45, -8.82], size: [36, 0.9, 0.1], color: C.deepGreen, r: 0.03 },
      { pos: [-18, 3.25, 9], size: [36, 6.5, 0.3], color: C.ivory, r: 0.05 },
      { pos: [-18, 0.45, 8.82], size: [36, 0.9, 0.1], color: C.deepGreen, r: 0.03 },
      { pos: [0.15, 3.25, -5.7], size: [0.3, 6.5, 6.6], color: C.ivory, r: 0.05 },
      { pos: [0.15, 3.25, 5.7], size: [0.3, 6.5, 6.6], color: C.ivory, r: 0.05 },
      { pos: [0.15, 5.3, 0], size: [0.3, 2.4, 4.8], color: C.ivory, r: 0.05 },
      { pos: [0.3, 4.05, 0], size: [0.12, 0.2, 4.9], color: C.mint, r: 0.03 },
    ],
    []
  );

  const dustGeo = useMemo(() => {
    const n = world.low ? 160 : 380;
    const rnd = mulberry32(3);
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      a[i * 3] = -34 + rnd() * 34;
      a[i * 3 + 1] = 0.4 + rnd() * 5.5;
      a[i * 3 + 2] = -8 + rnd() * 16;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(a, 3));
    return g;
  }, []);

  useFrame(() => {
    const p = world.p;
    const lower = sseg(p, 0.145, 0.225);
    if (wallRef.current) {
      wallRef.current.scale.y = Math.max(0.05, 1 - 0.95 * lower);
      wallRef.current.visible = p < 0.5;
    }
    if (dustRef.current) {
      dustRef.current.visible = p < 0.26;
      dustRef.current.position.y = Math.sin(idle() * 0.3) * 0.15;
      dustRef.current.rotation.y = idle() * 0.01;
    }
    if (dustMat.current) dustMat.current.opacity = 0.55 * (1 - sseg(p, 0.1, 0.2));
  });

  return (
    <group>
      {/* warehouse floor slab */}
      <RBox pos={[-18, 0.04, 0]} size={[37, 0.08, 18.4]} color={C.ivory} r={0.03} cast={false} />
      <Merged items={stock} />
      <group ref={wallRef}>
        <Merged items={walls} />
      </group>
      {/* gantry + hanging lamps: lifted away when the lid comes off */}
      <Reveal a={-1} b={0} out={[0.13, 0.2]} from={[0, 8, 0]}>
        {[-33, -27, -21, -15, -9, -3].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <RBox pos={[0, 6.3, 0]} size={[0.3, 0.3, 18]} color={C.darkGreen} r={0.05} />
            {[-3, 3].map((z) => (
              <group key={z} position={[0, 0, z]}>
                <mesh position={[0, 5.9, 0]}>
                  <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
                  <meshBasicMaterial color={C.darkGreen} />
                </mesh>
                <mesh position={[0, 5.4, 0]}>
                  <coneGeometry args={[0.55, 0.45, 20, 1, true]} />
                  <meshStandardMaterial color={C.deepGreen} side={THREE.DoubleSide} roughness={0.6} />
                </mesh>
                <mesh position={[0, 5.28, 0]}>
                  <sphereGeometry args={[0.16, 12, 12]} />
                  <meshBasicMaterial color="#FFF3D6" />
                </mesh>
              </group>
            ))}
          </group>
        ))}
      </Reveal>
      <SadBuddies />
      <Dumpster />
      <Label3D pos={[-17.4, 2.7, 2.5]} a={-0.06} b={-0.02} out={[0.11, 0.14]} kind="bad">
        Unsold
      </Label3D>
      <Label3D pos={[-15.8, 2.8, 1.1]} a={-0.05} b={-0.01} out={[0.11, 0.14]} kind="bad">
        Near expiry
      </Label3D>
      <Label3D pos={[-8.2, 3.7, 3.4]} a={0.015} b={0.045} out={[0.11, 0.14]} kind="bad">
        Total loss &amp; food waste
      </Label3D>
      <points ref={dustRef} geometry={dustGeo}>
        <pointsMaterial ref={dustMat} size={0.07} color={C.ivory} transparent opacity={0.55} depthWrite={false} sizeAttenuation />
      </points>
    </group>
  );
}
