'use client';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { world, sseg, seg, lerp, mulberry32, idle } from '../../lib/world';
import { C } from '../../lib/palette';
import { boxGeo, cyl, mat } from '../../lib/geo';
import { Merged, Reveal, RBox, Label3D, LineGrow, LogoSign, BoxBuddy } from './parts';
import { starGeo, heartGeo } from './Anime';
import { KioskLite } from './models';

const BELT_X0 = -19;
const BELT_X1 = 33;
const BELT_Y = 0.667;
const OUT_S6 = [0.79, 0.83];

// ------------------------------------------------------------------ belt
function makeBeltTexture() {
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 64;
  const g = cv.getContext('2d');
  g.fillStyle = '#27443f';
  g.fillRect(0, 0, 128, 64);
  g.fillStyle = '#34584f';
  for (let i = 0; i < 4; i++) g.fillRect(i * 32, 0, 14, 64);
  g.strokeStyle = '#7BC8A9';
  g.globalAlpha = 0.45;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(52, 20);
  g.lineTo(64, 32);
  g.lineTo(52, 44);
  g.stroke();
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const SEG_COUNT = 27;

function Belt() {
  const tex = useMemo(() => makeBeltTexture(), []);
  const topMat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }), [tex]);
  const frame = useMemo(
    () => [
      { pos: [0, 0.45, 0], size: [2, 0.42, 1.5], color: C.deepGreen, r: 0.05 },
      { pos: [0, 0.12, 0], size: [1.7, 0.24, 1.0], color: C.darkGreen, r: 0.03 },
      { pos: [0, 0.8, 0.72], size: [2, 0.14, 0.12], color: C.mint, r: 0.03 },
      { pos: [0, 0.8, -0.72], size: [2, 0.14, 0.12], color: C.mint, r: 0.03 },
    ],
    []
  );
  useEffect(() => {
    tex.repeat.set(2, 1);
  }, [tex]);
  useFrame(() => {
    tex.offset.x = -((world.p * 8 + idle() * 0.06) % 1);
  });
  return (
    <group>
      {Array.from({ length: SEG_COUNT }).map((_, i) => {
        const a = 0.14 + (i / SEG_COUNT) * 0.115;
        return (
          <Reveal key={i} a={a} b={a + 0.014} from={[0, -1.4, 0]} pos={[BELT_X0 + 1 + i * 2, 0, 0]} out={OUT_S6}>
            <Merged items={frame} />
            <mesh position={[0, 0.667, 0]} rotation={[-Math.PI / 2, 0, 0]} material={topMat} receiveShadow>
              <planeGeometry args={[2, 1.3]} />
            </mesh>
          </Reveal>
        );
      })}
    </group>
  );
}

// ------------------------------------------------------------------ box buddies riding the belt
// Worried before the quality check, cheering (with a sparkle) once approved.
const STAR_MAT = new THREE.MeshBasicMaterial({ color: '#ffd95c', side: THREE.DoubleSide });
function BeltBoxes() {
  const N = world.low ? 12 : 18;
  const items = useMemo(() => {
    const rnd = mulberry32(21);
    return Array.from({ length: N }).map((_, i) => ({
      w: 0.85 + rnd() * 0.25,
      h: 0.78 + rnd() * 0.2,
      d: 0.8 + rnd() * 0.2,
      c: [C.cardboard, C.cardboardDark, C.cardboardLight, C.cardboard][i % 4],
      reject: i % 5 === 4,
    }));
  }, [N]);
  const rigs = useMemo(() => items.map(() => ({ mood: 'sad' })), [items]);
  const refs = useRef([]);
  const stars = useRef([]);
  useFrame(() => {
    const p = world.p;
    const base = p * 9 + idle() * 0.012;
    const front = lerp(BELT_X0 - 1, 34, sseg(p, 0.14, 0.265));
    const fade = 1 - sseg(p, OUT_S6[0], OUT_S6[1]);
    for (let i = 0; i < N; i++) {
      const m = refs.current[i];
      if (!m) continue;
      const s = (base + i / N) % 1;
      const x = lerp(BELT_X0, BELT_X1, s);
      const it = items[i];
      let z = 0;
      let k = sseg(front - x, 0, 1.6) * Math.min(sseg(x, BELT_X0, BELT_X0 + 2), 1 - sseg(x, 30.5, 33)) * fade;
      if (it.reject) {
        z = 2.4 * sseg(x, 20.4, 23);
        k *= 1 - sseg(x, 23.5, 27);
      }
      if (k <= 0.001) {
        m.visible = false;
        continue;
      }
      m.visible = true;
      m.position.set(x, BELT_Y, z);
      m.scale.set(k, k, k);
      const ok = !it.reject && x > 20.4;
      rigs[i].mood = ok ? 'happy' : 'sad';
      const st = stars.current[i];
      if (st) {
        st.visible = ok;
        st.rotation.y = idle() * 2.2;
        st.position.y = it.h + 0.55 + Math.sin(idle() * 3 + i) * 0.06;
      }
    }
  });
  return (
    <group>
      {items.map((it, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} visible={false}>
          <BoxBuddy rig={rigs[i]} size={[it.w, it.h, it.d]} color={it.c} feet={false} wobble={false} />
          <mesh ref={(el) => (stars.current[i] = el)} geometry={starGeo()} material={STAR_MAT} scale={0.3} visible={false} />
        </group>
      ))}
    </group>
  );
}

// ------------------------------------------------------------------ the ground pathway that forms
function PathGlow() {
  const g = useRef();
  useFrame(() => {
    if (!g.current) return;
    const t = sseg(world.p, 0.2, 0.32);
    const o = sseg(world.p, OUT_S6[0], OUT_S6[1]);
    g.current.visible = t > 0 && o < 1;
    g.current.scale.set(Math.max(0.0001, t), 1, 1 - o);
  });
  return (
    <group ref={g} position={[2, 0.03, 0]}>
      <mesh position={[17, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[34, 3.6]} />
        <meshStandardMaterial color={C.mint} emissive={C.mint} emissiveIntensity={0.18} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------------ the ahorra gate (scene 2: ahorra as the connection)
function Gate() {
  return (
    <Reveal a={0.165} b={0.215} from={[0, 7, 0]} pos={[3, 0, 0]} out={[0.62, 0.7]}>
      {[-1.9, 1.9].map((z) => (
        <RBox key={z} pos={[0, 2.1, z]} size={[0.32, 4.2, 0.32]} color={C.deepGreen} />
      ))}
      <LogoSign pos={[0, 4.5, 0]} width={5.4} height={1.5} backFace />
      <RBox pos={[0, 3.75, 0]} size={[5.6, 0.18, 4.1]} color={C.mint} r={0.05} mo={{ emissive: C.mint, emissiveIntensity: 0.12 }} />
    </Reveal>
  );
}

// ------------------------------------------------------------------ stage 1: brands, distributors, retailers
function Brands() {
  const hq = useMemo(() => {
    const it = [{ pos: [0, 2.6, 0], size: [3, 5.2, 3], color: C.ivory, r: 0.08 }, { pos: [0, 5.3, 0], size: [3.2, 0.25, 3.2], color: C.deepGreen, r: 0.05 }];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) it.push({ pos: [-0.9 + c * 0.9, 1.2 + r * 1.0, 1.52], size: [0.5, 0.55, 0.06], color: C.softMint, r: 0.02 });
    it.push({ pos: [0, 0.55, 1.54], size: [0.8, 1.1, 0.06], color: C.mint, r: 0.02 });
    return it;
  }, []);
  const dist = useMemo(
    () => [
      { pos: [0, 1.3, 0], size: [4, 2.6, 3.2], color: C.beige, r: 0.08 },
      { geo: new THREE.CylinderGeometry(2, 2, 3.2, 20), rot: [Math.PI / 2, 0, 0], pos: [0, 2.6, 0], color: C.deepGreen },
      { pos: [0, 1, 1.62], size: [2.2, 1.9, 0.08], color: C.mint, r: 0.03 },
      { pos: [0, 1, 1.67], size: [2.2, 0.06, 0.04], color: C.white, r: 0.01 },
    ],
    []
  );
  const shop = useMemo(() => {
    const it = [
      { pos: [0, 1.1, 0], size: [3, 2.2, 2.6], color: C.white, r: 0.08 },
      { pos: [0, 2.3, 0], size: [3.2, 0.2, 2.8], color: C.deepGreen, r: 0.04 },
      { pos: [-0.7, 0.9, 1.32], size: [1.0, 1.7, 0.06], color: C.softMint, r: 0.02 },
      { pos: [0.85, 1.3, 1.32], size: [1.0, 0.9, 0.06], color: C.softMint, r: 0.02 },
    ];
    for (let k = 0; k < 6; k++) it.push({ pos: [-1.25 + k * 0.5, 2.0, 1.75], size: [0.5, 0.08, 0.9], rot: [-0.45, 0, 0], color: k % 2 ? C.ivory : C.mint, r: 0.02 });
    return it;
  }, []);
  const feeders = useRef([]);
  const fb = useRef([]);
  const spots = [
    { x: 4, mesh: hq, a: 0.165, label: 'Brands', h: 6.4 },
    { x: 9.5, mesh: dist, a: 0.173, label: 'Distributors', h: 4.4 },
    { x: 15, mesh: shop, a: 0.181, label: 'Retailers', h: 3.9 },
  ];
  const boxMats = useMemo(() => [mat(C.cardboard), mat(C.cardboardDark), mat(C.cardboardLight)], []);
  useFrame(() => {
    const base = world.p * 7 + idle() * 0.01;
    const f = 1 - sseg(world.p, OUT_S6[0], OUT_S6[1]);
    spots.forEach((s, si) => {
      for (let k = 0; k < 3; k++) {
        const m = fb.current[si * 3 + k];
        if (!m) continue;
        const u = (base + k / 3 + si * 0.21) % 1;
        const z = lerp(-6.4, -1.0, u);
        const kk = sseg(world.p, s.a + 0.03, s.a + 0.045) * Math.min(sseg(u, 0, 0.1), 1 - sseg(u, 0.88, 1)) * f;
        m.visible = kk > 0.01;
        m.position.set(s.x, BELT_Y + 0.2 * kk, z);
        m.scale.setScalar(kk);
      }
    });
  });
  return (
    <group>
      {spots.map((s, si) => (
        <group key={s.label}>
          <Reveal a={s.a} b={s.a + 0.04} from={[0, -5, 0]} pos={[s.x, 0, -9]} out={OUT_S6}>
            <Merged items={s.mesh} />
          </Reveal>
          <Reveal a={s.a + 0.02} b={s.a + 0.045} from={[0, -1, 0]} pos={[s.x, 0, -3.7]} out={OUT_S6}>
            <RBox pos={[0, 0.45, 0]} size={[1.1, 0.34, 5.6]} color={C.deepGreen} r={0.05} />
            <RBox pos={[0.5, 0.66, 0]} size={[0.08, 0.1, 5.6]} color={C.mint} r={0.02} />
            <RBox pos={[-0.5, 0.66, 0]} size={[0.08, 0.1, 5.6]} color={C.mint} r={0.02} />
            <mesh position={[0, 0.63, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.9, 5.4]} />
              <meshStandardMaterial color="#27443f" roughness={0.8} />
            </mesh>
          </Reveal>
          {[0, 1, 2].map((k) => (
            <mesh key={k} ref={(el) => (fb.current[si * 3 + k] = el)} geometry={boxGeo(0.5, 0.4, 0.5, 0.04)} material={boxMats[k]} castShadow visible={false} />
          ))}
          <Label3D pos={[s.x, s.h, -9]} a={s.a + 0.03} b={s.a + 0.05} out={[0.3, 0.33]}>
            {s.label}
          </Label3D>
        </group>
      ))}
    </group>
  );
}


// ------------------------------------------------------------------ scene 2: they reach out to ahorra and dispatch
function Contact() {
  const env = useRef();
  useFrame(() => {
    const e = env.current;
    if (!e) return;
    const u = seg(world.p, 0.2, 0.26);
    e.visible = u > 0 && u < 1;
    const x = lerp(9.5, 3.2, u);
    e.position.set(x, lerp(6.4, 5.2, u) + Math.sin(Math.PI * u) * 2.2, lerp(-9, 0, u));
    e.rotation.y = u * 0.8;
    e.rotation.z = Math.sin(u * 14) * 0.15;
  });
  return (
    <group>
      <group ref={env} visible={false}>
        <RBox size={[0.7, 0.46, 0.08]} color={C.white} r={0.03} />
        <mesh geometry={heartGeo()} material={STAR_MAT} position={[0, 0, 0.06]} scale={0.22} />
      </group>
      <Label3D pos={[9.5, 8.8, -9]} a={0.2} b={0.22} out={[0.285, 0.3]} kind="chat">
        We have surplus &amp; near-expiry stock. Can ahorra help?
      </Label3D>
      <Label3D pos={[3, 7.4, 0]} a={0.235} b={0.255} out={[0.285, 0.3]} kind="chat green">
        Yes! Dispatch it to us.
      </Label3D>
      <Label3D pos={[-3, 3.4, 0]} a={0.235} b={0.26} out={[0.3, 0.34]} kind="good">
        Surplus dispatched to ahorra
      </Label3D>
    </group>
  );
}

// ------------------------------------------------------------------ stage 3: ahorra's quality check
// floating magnifying glass above the scanner: every product is looked at
function Lens() {
  const g = useRef();
  useFrame(() => {
    if (g.current) {
      g.current.position.z = Math.sin(idle() * 1.4 + world.p * 40) * 0.9;
      g.current.rotation.z = Math.sin(idle() * 1.4 + world.p * 40) * 0.2;
    }
  });
  return (
    <group ref={g}>
      <mesh rotation={[0, 0, 0]} material={mat(C.deepGreen)} castShadow>
        <torusGeometry args={[0.6, 0.12, 10, 32]} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[0.55, 24]} />
        <meshBasicMaterial color="#DDEFE5" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <mesh position={[-0.56, -0.56, 0]} rotation={[0, 0, Math.PI / 4]} geometry={cyl(0.1, 0.1, 0.8, 10)} material={mat(C.darkGreen)} castShadow />
    </group>
  );
}

function Scanner() {
  const beam = useRef();
  useFrame(() => {
    if (beam.current) beam.current.position.y = 1.9 + 1.15 * Math.sin(world.p * 70 + idle() * 2.2);
  });
  return (
    <Reveal a={0.36} b={0.405} from={[0, 5, 0]} pos={[20, 0, 0]} out={OUT_S6}>
      {[-1.3, 1.3].map((z) => (
        <RBox key={z} pos={[0, 1.8, z]} size={[0.32, 3.6, 0.32]} color={C.deepGreen} />
      ))}
      <RBox pos={[0, 3.65, 0]} size={[0.5, 0.42, 3.2]} color={C.deepGreen} />
      <mesh position={[0, 3.38, 0]}>
        <boxGeometry args={[0.12, 0.08, 2.6]} />
        <meshBasicMaterial color={C.mint} />
      </mesh>
      <mesh ref={beam} position={[0, 2, 0]}>
        <boxGeometry args={[0.04, 0.05, 2.5]} />
        <meshBasicMaterial color="#C9FFE6" />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <boxGeometry args={[0.02, 3.2, 2.5]} />
        <meshBasicMaterial color={C.mint} transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <group position={[0, 5.0, 0]}>
        <Lens />
      </group>
      <Label3D pos={[0, 6.6, 0]} a={0.385} b={0.41} out={[0.5, 0.54]}>
        ahorra quality check
      </Label3D>
      <Label3D pos={[4, 2.6, 0]} a={0.41} b={0.43} out={[0.5, 0.54]} kind="good">
        ✓ Eligible
      </Label3D>
      <Label3D pos={[3.4, 1.8, 2.8]} a={0.41} b={0.43} out={[0.5, 0.54]} kind="bad">
        ✗ Not eligible
      </Label3D>
    </Reveal>
  );
}

// ------------------------------------------------------------------ stage 3: the ahorra network hub
function Hub() {
  const ring = useRef();
  useFrame(() => {
    if (ring.current) ring.current.rotation.z = world.p * 6 + idle() * 0.25;
  });
  const nodes = [
    [8.5, 0, -8],
    [12.5, 0, -2.6],
    [11.5, 0, 4.4],
  ];
  return (
    <group>
      <Reveal a={0.39} b={0.435} from={[0, -4, 0]} pos={[37, 0, 0]}>
        <mesh geometry={cyl(4.4, 4.5, 0.5, 40)} material={mat(C.ivory)} position={[0, 0.25, 0]} receiveShadow castShadow />
        <mesh ref={ring} position={[0, 0.58, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[4.35, 0.1, 10, 80]} />
          <meshStandardMaterial color={C.mint} emissive={C.mint} emissiveIntensity={0.9} />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow material={mat(C.mint)}>
          <sphereGeometry args={[2.3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <RBox pos={[-2.9, 1.2, 0]} size={[2.6, 2.4, 2.9]} color={C.softMint} r={0.08} />
        <RBox pos={[-2.9, 2.55, 0]} size={[3.0, 0.3, 3.3]} color={C.deepGreen} r={0.06} />
        <mesh position={[-4.22, 1.1, 0]}>
          <boxGeometry args={[0.04, 1.7, 2.1]} />
          <meshBasicMaterial color="#0b2f29" />
        </mesh>
        <RBox pos={[0, 4.9, 0]} size={[0.2, 3.0, 0.2]} color={C.deepGreen} />
        <LogoSign pos={[0, 6.3, 0]} width={4.4} height={1.3} backFace />
      </Reveal>
      <Label3D pos={[37, 4.9, 3.2]} a={0.42} b={0.45} out={[0.54, 0.58]}>
        Enters the ahorra network
      </Label3D>
      {nodes.map((n, i) => (
        <group key={i}>
          <Reveal a={0.43 + i * 0.008} b={0.46 + i * 0.008} from={[0, -2, 0]} pos={[37 + n[0], 0, n[2]]} out={[0.76, 0.8]}>
            <mesh geometry={cyl(1.3, 1.35, 0.25, 24)} material={mat(C.softMint)} position={[0, 0.12, 0]} receiveShadow />
            <group position={[0, 0.24, 0]} scale={0.38}>
              <KioskLite />
            </group>
          </Reveal>
          <LineGrow
            pts={[[37 + 3.4 * Math.sign(n[0]) * 0.8, 1.0, n[2] * 0.3], [37 + n[0] * 0.55, 2.2, n[2] * 0.6], [37 + n[0], 1.0, n[2]]]}
            a={0.43 + i * 0.008}
            b={0.47 + i * 0.008}
            out={[0.76, 0.8]}
            radius={0.07}
            pulses={2}
          />
        </group>
      ))}
    </group>
  );
}

// ------------------------------------------------------------------ road + truck to the kiosk
function Road() {
  const dashes = useMemo(() => Array.from({ length: 6 }, (_, i) => i), []);
  return (
    <Reveal a={0.43} b={0.5} from={[0, 0, 0]} pos={[41.5, 0.0, 0]} out={OUT_S6} s0={0.001}>
      <RBox pos={[7.5, 0.04, 0]} size={[15, 0.08, 3.2]} color="#3b4f4a" r={0.02} cast={false} />
      {dashes.map((i) => (
        <RBox key={i} pos={[1.2 + i * 2.5, 0.1, 0]} size={[1.2, 0.02, 0.14]} color={C.mint} r={0.005} cast={false} mo={{ emissive: C.mint, emissiveIntensity: 0.3 }} />
      ))}
    </Reveal>
  );
}

function Truck() {
  const g = useRef();
  const wheels = useRef([]);
  useFrame(() => {
    const p = world.p;
    const x = lerp(40.5, 51.5, sseg(p, 0.455, 0.525));
    const vis = seg(p, 0.445, 0.455);
    const o = sseg(p, OUT_S6[0], OUT_S6[1]);
    if (!g.current) return;
    g.current.visible = vis > 0 && o < 1;
    g.current.position.set(x, 0, 0);
    g.current.scale.setScalar(Math.max(0.001, Math.min(vis * 3, 1) * (1 - o)));
    wheels.current.forEach((w) => w && (w.rotation.y = -x * 2.6));
  });
  const wp = [
    [-1.7, 0.4, 0.95],
    [-1.7, 0.4, -0.95],
    [-0.35, 0.4, 0.95],
    [-0.35, 0.4, -0.95],
    [1.55, 0.4, 0.95],
    [1.55, 0.4, -0.95],
  ];
  return (
    <group ref={g} visible={false}>
      <RBox pos={[-1.0, 1.65, 0]} size={[3.6, 2.1, 1.9]} color={C.white} r={0.1} />
      <RBox pos={[-1.0, 1.35, 0]} size={[3.62, 0.32, 1.92]} color={C.mint} r={0.04} />
      <RBox pos={[1.55, 1.15, 0]} size={[1.4, 1.5, 1.8]} color={C.deepGreen} r={0.1} />
      <RBox pos={[2.23, 1.5, 0]} size={[0.05, 0.62, 1.5]} color={C.softMint} r={0.02} />
      <RBox pos={[-0.3, 0.45, 0]} size={[5.4, 0.2, 1.7]} color={C.darkGreen} r={0.04} />
      {wp.map((w, i) => (
        <group key={i} position={w} rotation={[Math.PI / 2, 0, 0]}>
          <mesh ref={(el) => (wheels.current[i] = el)} geometry={cyl(0.4, 0.4, 0.3, 16)} material={mat('#1d2f2b')} castShadow />
        </group>
      ))}
    </group>
  );
}

export default function Pipeline() {
  return (
    <group>
      <PathGlow />
      <Belt />
      <BeltBoxes />
      <Gate />
      <Brands />
      <Scanner />
      <Contact />
      <Hub />
      <Road />
      <Truck />
      <Label3D pos={[51.5, 4.6, 0]} a={0.485} b={0.505} out={[0.56, 0.59]} kind="good">
        Eligible products head to ahorra kiosks
      </Label3D>
    </group>
  );
}
