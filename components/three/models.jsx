'use client';
import * as THREE from 'three';
import { buildMerged, cyl, mat, vcMat } from '../../lib/geo';
import { C } from '../../lib/palette';
import { LogoSign } from './parts';

// Small, cheap models reused across the network scenes. Geometry is built once and shared.
let kioskGeo = null;
let storeGeo = null;

function getKioskGeo() {
  if (kioskGeo) return kioskGeo;
  const it = [
    { pos: [0, 0.06, 0], size: [2.9, 0.12, 2.1], color: C.ivory, r: 0.04 },
    { pos: [0, 0.9, -0.75], size: [2.5, 1.6, 0.1], color: C.deepGreen, r: 0.03 },
    { pos: [-1.3, 0.9, -0.3], size: [0.1, 1.6, 0.9], color: C.darkGreen, r: 0.03 },
    { pos: [1.3, 0.9, -0.3], size: [0.1, 1.6, 0.9], color: C.darkGreen, r: 0.03 },
    { pos: [0, 1.82, 0], size: [3.0, 0.13, 1.9], color: C.deepGreen, r: 0.04 },
    { pos: [0, 1.7, 0.92], size: [3.0, 0.2, 0.05], color: C.mint, r: 0.02 },
  ];
  [0.55, 0.95, 1.35].forEach((y, li) => {
    it.push({ pos: [0, y, -0.52], size: [2.3, 0.05, 0.34], color: C.beige, r: 0.02 });
    for (let k = 0; k < 6; k++)
      it.push({
        pos: [-0.95 + k * 0.38, y + 0.15, -0.52],
        size: [0.2, 0.26, 0.2],
        color: [C.mint, C.ivory, C.amber, C.coral, C.softMint, C.white][(k + li * 2) % 6],
        r: 0.03,
      });
  });
  kioskGeo = buildMerged(it);
  return kioskGeo;
}

function getStoreGeo() {
  if (storeGeo) return storeGeo;
  const roof = new THREE.CylinderGeometry(1.5, 1.5, 2.2, 22);
  roof.scale(1, 0.42, 1);
  const it = [
    { pos: [0, 0.07, 0], size: [3.6, 0.14, 2.8], color: C.softMint, r: 0.05 },
    { pos: [0, 0.89, 0], size: [3.0, 1.5, 2.2], color: C.ivory, r: 0.07 },
    { geo: roof, rot: [Math.PI / 2, 0, 0], pos: [0, 1.76, 0], color: C.deepGreen },
    { pos: [0, 0.65, 1.12], size: [1.0, 1.1, 0.05], color: C.mint, r: 0.02 },
    { pos: [-1.0, 1.0, 1.12], size: [0.7, 0.7, 0.05], color: C.softMint, r: 0.02 },
    { pos: [1.0, 1.0, 1.12], size: [0.7, 0.7, 0.05], color: C.softMint, r: 0.02 },
    { pos: [0, 1.5, 1.28], size: [3.1, 0.1, 0.5], rot: [0.0, 0, 0], color: C.mint, r: 0.03 },
    // leafy roof garden
    { pos: [-0.7, 2.18, 0], size: [0.6, 0.18, 0.7], color: C.mint, r: 0.08 },
    { pos: [0.3, 2.2, 0.2], size: [0.7, 0.2, 0.7], color: C.mint, r: 0.08 },
    { pos: [0.95, 2.1, -0.2], size: [0.5, 0.16, 0.6], color: '#5fb08e', r: 0.07 },
  ];
  storeGeo = buildMerged(it);
  return storeGeo;
}

// ~3 units wide, origin at ground centre
export function KioskLite({ logo = false }) {
  return (
    <group>
      <mesh geometry={getKioskGeo()} material={vcMat} castShadow receiveShadow />
      {logo && <LogoSign pos={[0, 2.38, 0]} width={1.9} height={0.5} depth={0.08} />}
    </group>
  );
}

// A dedicated Green Store (FUTURE VISION only)
export function GreenStore() {
  return (
    <group>
      <mesh geometry={getStoreGeo()} material={vcMat} castShadow receiveShadow />
      <mesh position={[0, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.95, 0.05, 8, 48]} />
        <meshStandardMaterial color={C.mint} emissive={C.mint} emissiveIntensity={1.2} />
      </mesh>
      {[[-1.9, 0.9], [2.0, 0.7]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh geometry={cyl(0.07, 0.09, 0.5, 6)} material={mat(C.cardboardDark)} position={[0, 0.25, 0]} />
          <mesh position={[0, 0.85, 0]} material={mat(C.mint)} castShadow>
            <sphereGeometry args={[0.45, 12, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
