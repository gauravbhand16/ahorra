'use client';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { world, sseg, idle, KX } from '../../lib/world';
import { C } from '../../lib/palette';
import { cyl, mat } from '../../lib/geo';
import { Reveal, RBox, LineGrow, Person, Product, swing } from './parts';
import { KioskLite } from './models';

const OUT = [0.8, 0.835];

function Bob({ i, children }) {
  const g = useRef();
  useFrame(() => {
    if (g.current) g.current.position.y = Math.sin(idle() * 0.9 + i * 1.7) * 0.14 + Math.sin(world.p * 40 + i) * 0.08;
  });
  return <group ref={g}>{children}</group>;
}

function Platform({ tint = C.softMint }) {
  return (
    <>
      <mesh geometry={cyl(3.1, 3.3, 0.5, 40)} material={mat(tint)} position={[0, 0.25, 0]} castShadow receiveShadow />
      <mesh position={[0, 0.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.05, 0.06, 8, 60]} />
        <meshStandardMaterial color={C.mint} emissive={C.mint} emissiveIntensity={0.8} />
      </mesh>
    </>
  );
}

// For businesses: a building with a coin stack that grows = recovered value / an extra sales channel
function BusinessIsland({ a }) {
  const coins = useRef([]);
  useFrame(() => {
    const t = sseg(world.p, a + 0.012, a + 0.05);
    coins.current.forEach((c, k) => {
      if (!c) return;
      const s = Math.min(1, Math.max(0, t * 7 - k));
      c.visible = s > 0.01;
      c.scale.setScalar(Math.max(0.001, s));
    });
  });
  return (
    <>
      <Platform />
      <RBox pos={[-0.9, 1.9, -0.2]} size={[1.7, 2.8, 1.7]} color={C.deepGreen} r={0.08} />
      {[0, 1, 2].map((r) =>
        [0, 1].map((c) => <RBox key={`${r}${c}`} pos={[-1.2 + c * 0.6, 1.2 + r * 0.7, 0.67]} size={[0.38, 0.4, 0.05]} color={C.softMint} r={0.02} cast={false} />)
      )}
      <RBox pos={[-0.9, 3.4, -0.2]} size={[1.9, 0.18, 1.9]} color={C.mint} r={0.05} />
      {[0, 1, 2, 3, 4, 5, 6].map((k) => (
        <mesh key={k} ref={(el) => (coins.current[k] = el)} position={[1.3, 0.62 + k * 0.16, 0.3]} geometry={cyl(0.48, 0.48, 0.13, 24)} material={mat(C.amber, { roughness: 0.4, metalness: 0.2 })} castShadow />
      ))}
      <mesh position={[0.2, 0.62, 1.4]} geometry={cyl(0.4, 0.4, 0.13, 24)} material={mat(C.amber, { roughness: 0.4, metalness: 0.2 })} castShadow />
      <mesh position={[0.2, 0.78, 1.4]} geometry={cyl(0.4, 0.4, 0.13, 24)} material={mat(C.amber, { roughness: 0.4, metalness: 0.2 })} castShadow />
    </>
  );
}

// For consumers: shopper with a bag and a lower-price tag
function ConsumerIsland() {
  const rig = useMemo(() => ({}), []);
  useFrame(() => {
    if (rig.root) {
      rig.root.rotation.y = -0.4 + Math.sin(idle() * 0.7) * 0.15 + world.p * 6;
      swing(rig, 0, false, 0);
    }
  });
  return (
    <>
      <Platform />
      <group position={[0, 0.5, 0]}>
        <Person rig={rig} skin="#B98560" shirt={C.mint} pants={C.deepGreen} hair="#18110d" s={1.15} />
      </group>
      <RBox pos={[-1.1, 0.9, 0.9]} size={[0.8, 0.8, 0.5]} color={C.mint} r={0.08} />
      <RBox pos={[-1.1, 1.35, 0.9]} size={[0.5, 0.04, 0.04]} color={C.white} r={0.01} cast={false} />
      <Product kind="bottle" color={C.coral} pos={[1.3, 0.5, 0.7]} s={1.4} />
      <Product kind="can" color={C.amber} pos={[1.9, 0.5, 0.2]} s={1.4} />
      {/* price tag with a downward arrow */}
      <group position={[1.1, 2.7, 0]}>
        <RBox size={[1.2, 0.8, 0.12]} color={C.white} r={0.1} />
        <RBox pos={[0, 0.1, 0.07]} size={[0.14, 0.34, 0.03]} color={C.deepGreen} r={0.01} cast={false} />
        <mesh position={[0, -0.16, 0.07]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.2, 0.2, 3]} />
          <meshStandardMaterial color={C.deepGreen} />
        </mesh>
      </group>
    </>
  );
}

// For products: a box and an orbiting arrow ring = another opportunity to sell
function ProductIsland() {
  const ring = useRef();
  const items = useRef([]);
  useFrame(() => {
    if (ring.current) ring.current.rotation.y = world.p * 22 + idle() * 0.7;
    items.current.forEach((m, k) => {
      if (!m) return;
      const t = (world.p * 14 + idle() * 0.3 + k / 3) % 1;
      m.position.y = 1.5 + t * 1.3;
      m.scale.setScalar(Math.sin(Math.PI * t) + 0.001);
      m.rotation.y = t * 5;
    });
  });
  return (
    <>
      <Platform />
      <RBox pos={[0, 0.95, 0]} size={[1.9, 0.9, 1.5]} color={C.cardboard} r={0.07} />
      <RBox pos={[0, 1.42, 0]} size={[0.5, 0.06, 1.52]} color={C.tape} r={0.01} cast={false} />
      {[0, 1, 2].map((k) => (
        <group key={k} ref={(el) => (items.current[k] = el)} position={[(k - 1) * 0.5, 1.5, 0]}>
          <Product kind={['can', 'box', 'bottle'][k]} color={[C.mint, C.coral, C.amber][k]} s={0.9} />
        </group>
      ))}
      <group ref={ring} position={[0, 2.35, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.6, 0.07, 10, 60, Math.PI * 1.55]} />
          <meshStandardMaterial color={C.mint} emissive={C.mint} emissiveIntensity={0.7} />
        </mesh>
        <mesh position={[1.6, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.22, 0.4, 12]} />
          <meshStandardMaterial color={C.mint} emissive={C.mint} emissiveIntensity={0.7} />
        </mesh>
      </group>
    </>
  );
}

// For the environment: a healthy little tree with floating leaves = less wasted food, less strain
function EnvironmentIsland() {
  const leaves = useRef([]);
  const crown = useRef();
  useFrame(() => {
    if (crown.current) crown.current.scale.setScalar(1 + Math.sin(idle() * 1.4) * 0.025);
    leaves.current.forEach((m, k) => {
      if (!m) return;
      const t = (world.p * 10 + idle() * 0.25 + k / 5) % 1;
      m.position.set(Math.sin(t * 6 + k) * 1.5, 1.2 + t * 2.6, Math.cos(t * 6 + k) * 1.5);
      m.rotation.set(t * 5, t * 7, 0);
      m.scale.setScalar(Math.sin(Math.PI * t) * 0.9 + 0.001);
    });
  });
  return (
    <>
      <Platform tint="#CFE9C8" />
      <mesh position={[0, 1.3, 0]} material={mat('#9A6B4B')} castShadow geometry={cyl(0.22, 0.34, 1.6, 12)} />
      <group ref={crown} position={[0, 2.7, 0]}>
        <mesh material={mat('#4FB286')} castShadow>
          <sphereGeometry args={[1.25, 20, 16]} />
        </mesh>
        <mesh position={[0.8, -0.35, 0.3]} material={mat('#5CC595')} castShadow>
          <sphereGeometry args={[0.8, 16, 12]} />
        </mesh>
        <mesh position={[-0.75, -0.2, -0.2]} material={mat('#3E9E75')} castShadow>
          <sphereGeometry args={[0.85, 16, 12]} />
        </mesh>
      </group>
      {[-1.7, 1.8].map((x, i) => (
        <mesh key={i} position={[x, 0.85, 0.9 - i * 1.4]} material={mat('#5CC595')} castShadow>
          <sphereGeometry args={[0.38, 12, 10]} />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4].map((k) => (
        <mesh key={k} ref={(el) => (leaves.current[k] = el)} material={mat('#7BD6A4')}>
          <sphereGeometry args={[0.16, 8, 6]} />
        </mesh>
      ))}
    </>
  );
}

export default function Impact() {
  const spots = [
    { x: KX - 13.5, z: -6, a: 0.7, C: BusinessIsland },
    { x: KX - 4.8, z: -11.5, a: 0.72, C: ConsumerIsland },
    { x: KX + 4.8, z: -11.5, a: 0.74, C: ProductIsland },
    { x: KX + 13.5, z: -6, a: 0.76, C: EnvironmentIsland },
  ];
  return (
    <group>
      {spots.map((s, i) => {
        const Comp = s.C;
        return (
          <group key={i}>
            <Reveal a={s.a} b={s.a + 0.03} from={[0, -7, 0]} pos={[s.x, 0, s.z]} out={OUT}>
              <Bob i={i}>
                <Comp a={s.a} />
              </Bob>
            </Reveal>
            <LineGrow
              pts={[[KX, 3.2, -1.4], [(KX + s.x) / 2, 5.4, (-1.4 + s.z) / 2], [s.x, 2.2, s.z + 1.4]]}
              a={s.a - 0.004}
              b={s.a + 0.03}
              out={OUT}
              radius={0.08}
              pulses={2}
            />
          </group>
        );
      })}
    </group>
  );
}
