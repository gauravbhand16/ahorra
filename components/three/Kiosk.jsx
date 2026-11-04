'use client';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { world, sseg, seg, lerp, win, idle, KX } from '../../lib/world';
import { C } from '../../lib/palette';
import { boxGeo, cyl, mat } from '../../lib/geo';
import { Reveal, RBox, Product, Person, LogoSign, Label3D, makePath, swing, applyMood } from './parts';

const SHELF_Y = [0.95, 1.85, 2.75];
const KINDS = ['can', 'bottle', 'box', 'pouch', 'jar'];
const PCOL = [C.mint, C.ivory, C.amber, C.coral, C.softMint, C.white, C.deepGreen];
const HIDE = [0.775, 0.81]; // customers/props leave before the map rises
const HERO = { li: 0, j: 1 };
const slotX = (j) => -3.1 + j * 1.03;

// -------------------------------------------------------------- kiosk body, built progressively
function KioskBody() {
  const group = useRef();
  useFrame(() => {
    // in scene 6 the kiosk shrinks into one marker of the future network
    const s = 1 - 0.78 * sseg(world.p, 0.8, 0.86);
    const out = sseg(world.p, 0.9, 0.93);
    if (group.current) {
      group.current.scale.setScalar(Math.max(0.0001, s * (1 - out)));
      group.current.position.y = 0.75 * sseg(world.p, 0.8, 0.86); // sits on top of the rising map
      group.current.visible = out < 1;
    }
  });

  const shelfProducts = useMemo(() => {
    const out = [];
    SHELF_Y.forEach((y, li) => {
      for (let j = 0; j < 7; j++) {
        if (li === HERO.li && j === HERO.j) continue;
        out.push({
          li,
          j,
          x: slotX(j),
          y: y + 0.06,
          kind: KINDS[(li * 3 + j * 2) % 5],
          color: PCOL[(li * 2 + j * 3) % PCOL.length],
        });
      }
    });
    return out;
  }, []);

  return (
    <group ref={group} position={[KX, 0, 0]}>
      <Reveal a={0.525} b={0.55} from={[0, -0.8, 0]}>
        <RBox pos={[0, 0.15, 0.3]} size={[10.4, 0.3, 6.2]} color={C.ivory} r={0.1} />
        <RBox pos={[0, 0.32, 0.2]} size={[7.6, 0.04, 3.2]} color={C.softMint} r={0.02} cast={false} />
      </Reveal>
      <Reveal a={0.54} b={0.566} from={[0, -4.5, 0]}>
        <RBox pos={[0, 2.4, -1.85]} size={[8.4, 4.2, 0.3]} color={C.deepGreen} r={0.08} />
      </Reveal>
      <Reveal a={0.55} b={0.576} from={[-3, 0, 0]}>
        <RBox pos={[-4.05, 2.4, -0.1]} size={[0.3, 4.2, 3.6]} color={C.darkGreen} r={0.08} />
      </Reveal>
      <Reveal a={0.552} b={0.578} from={[3, 0, 0]}>
        <RBox pos={[4.05, 2.4, -0.1]} size={[0.3, 4.2, 3.6]} color={C.darkGreen} r={0.08} />
      </Reveal>
      <Reveal a={0.565} b={0.592} from={[0, 4, 0]}>
        <RBox pos={[0, 4.6, 0.2]} size={[8.8, 0.35, 4.6]} color={C.deepGreen} r={0.08} />
        <RBox pos={[0, 4.4, 0.2]} size={[8.4, 0.05, 4.2]} color={C.softMint} r={0.02} cast={false} mo={{ emissive: C.softMint, emissiveIntensity: 0.4 }} />
        <RBox pos={[0, 4.15, 2.5]} size={[8.8, 0.5, 0.1]} color={C.mint} r={0.04} />
        {[-3.6, -1.2, 1.2, 3.6].map((x) => (
          <mesh key={x} position={[x, 4.3, 0.2]}>
            <sphereGeometry args={[0.12, 10, 10]} />
            <meshBasicMaterial color="#FFF3D6" />
          </mesh>
        ))}
      </Reveal>
      <Reveal a={0.578} b={0.604} s0={0.001} from={[0, 0, 0]} pos={[0, 5.55, 0.2]}>
        {[-2.8, 2.8].map((x) => (
          <RBox key={x} pos={[x, -0.55, 0]} size={[0.16, 0.9, 0.16]} color={C.deepGreen} />
        ))}
        <RBox pos={[0, 0, 0]} size={[6.4, 1.4, 0.3]} color={C.deepGreen} r={0.1} />
        <LogoSign pos={[0, 0, 0.17]} width={5.6} height={1.1} depth={0.1} />
        <MarqueeBulbs />
      </Reveal>

      {SHELF_Y.map((y, li) => (
        <Reveal key={li} a={0.585 + li * 0.008} b={0.605 + li * 0.008} from={[0, 0, -2]}>
          <RBox pos={[0, y, -1.2]} size={[7.4, 0.1, 0.9]} color={C.beige} r={0.03} />
        </Reveal>
      ))}

      {shelfProducts.map((pr, i) => {
        const a = 0.603 + pr.li * 0.006 + pr.j * 0.0016;
        return (
          <Reveal key={i} a={a} b={a + 0.011} from={[0, 0.6, 0.4]} pos={[pr.x, pr.y, -1.2]}>
            <Product kind={pr.kind} color={pr.color} />
          </Reveal>
        );
      })}

      {/* price tags along the shelf edges: a wave of mint "better price" tags */}
      {SHELF_Y.map((y, li) =>
        Array.from({ length: 7 }).map((_, j) => {
          const a = 0.628 + li * 0.004 + j * 0.0022;
          return (
            <Reveal key={`${li}-${j}`} a={a} b={a + 0.01} from={[0, 0.2, 0]} pos={[slotX(j), y - 0.0, -0.74]}>
              <RBox size={[0.52, 0.13, 0.03]} color={C.mint} r={0.012} cast={false} mo={{ emissive: C.mint, emissiveIntensity: 0.25 }} />
              <RBox pos={[-0.17, 0, 0.02]} size={[0.07, 0.07, 0.01]} color={C.white} r={0.003} cast={false} />
            </Reveal>
          );
        })
      )}

      <Reveal a={0.6} b={0.625} from={[3, 0, 0]} pos={[3.1, 0, 0.4]}>
        <RBox pos={[0, 0.8, 0]} size={[1.6, 1.0, 1.2]} color={C.ivory} r={0.06} />
        <RBox pos={[0, 1.32, 0]} size={[1.7, 0.06, 1.3]} color={C.mint} r={0.02} />
        <RBox pos={[0, 1.6, -0.1]} size={[0.6, 0.45, 0.06]} color={C.text} r={0.02} rot={[-0.25, 0, 0]} />
      </Reveal>
    </group>
  );
}

// -------------------------------------------------------------- retro cinema-hall marquee bulbs around the sign
const BULB_ON = new THREE.MeshBasicMaterial({ color: '#FFE08A' });
const BULB_OFF = new THREE.MeshBasicMaterial({ color: '#F2A93B' });
const BULBS = (() => {
  const out = [];
  for (let x = -3.0; x <= 3.01; x += 0.5) {
    out.push([x, 0.8]);
    out.push([x, -0.8]);
  }
  out.push([-3.3, 0], [3.3, 0]);
  return out;
})();
function MarqueeBulbs() {
  const refs = useRef([]);
  useFrame(() => {
    const t = Math.floor(idle() * 3);
    refs.current.forEach((m, i) => {
      if (m) m.material = (i + t) % 2 === 0 ? BULB_ON : BULB_OFF;
    });
  });
  return (
    <group position={[0, 0, 0.2]}>
      {BULBS.map((b, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} position={[b[0], b[1], 0]} material={BULB_ON}>
          <sphereGeometry args={[0.085, 8, 8]} />
        </mesh>
      ))}
    </group>
  );
}

// -------------------------------------------------------------- restock: boxes hop from the truck into the kiosk
function DeliveryBoxes() {
  const refs = useRef([]);
  const mats = useMemo(() => [mat(C.cardboard), mat(C.cardboardDark), mat(C.cardboardLight), mat(C.cardboard)], []);
  useFrame(() => {
    const p = world.p;
    for (let i = 0; i < 4; i++) {
      const m = refs.current[i];
      if (!m) continue;
      const a = 0.54 + i * 0.011;
      const b = a + 0.022;
      const t = seg(p, a, b);
      const vanish = sseg(p, b, b + 0.008);
      if (t <= 0 || vanish >= 1) {
        m.visible = false;
        continue;
      }
      m.visible = true;
      const sx = 50.9;
      const ex = KX - 1.6 + i * 1.1;
      m.position.set(lerp(sx, ex, t), lerp(2.7, 0.75, t) + Math.sin(Math.PI * t) * 2.4, lerp(0, 1.6, t));
      m.rotation.y = t * 1.6;
      m.scale.setScalar(Math.max(0.001, 1 - vanish));
    }
  });
  return (
    <group>
      {mats.map((m, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} geometry={boxGeo(0.8, 0.6, 0.7, 0.05)} material={m} castShadow visible={false} />
      ))}
    </group>
  );
}

// -------------------------------------------------------------- customers
const FIGURES = [
  { skin: '#E5B890', shirt: C.mint, pants: C.text, hair: '#2f2118', glasses: true, mustache: true, flare: true, path: makePath([[0.6, 50, 5.4], [0.625, 56.4, 5.4], [0.64, KX + slotX(HERO.j), 0.55], [0.67, KX + slotX(HERO.j), 0.55], [0.695, 70, 3.4]]), face: Math.PI },
  { skin: '#B98560', shirt: C.amber, pants: C.deepGreen, hair: '#18110d', flare: true, path: makePath([[0.605, 72, 4.8], [0.7, 47, 4.8]]), face: Math.PI },
  { skin: '#8A5A3C', shirt: C.coral, pants: C.darkGreen, hair: '#120c09', glasses: true, flare: true, path: makePath([[0.615, 71, 3.2], [0.64, KX + 1.3, 2.4], [0.648, KX + 1.3, 0.55], [0.69, KX + 1.3, 0.55], [0.72, 76, 5.4]]), face: Math.PI },
];

function Customers() {
  const rigs = useMemo(() => FIGURES.map(() => ({})), []);
  const hero = useRef();
  const heroPos = useMemo(() => new THREE.Vector3(), []);
  const hand = useMemo(() => new THREE.Vector3(), []);
  const angles = useRef(FIGURES.map(() => Math.PI));
  const shelfStart = useMemo(() => new THREE.Vector3(KX + slotX(HERO.j), SHELF_Y[HERO.li] + 0.06, -1.2), []);
  const rootRef = useRef();

  useFrame((_, dt) => {
    const p = world.p;
    const vis = p > 0.598 && p < HIDE[1];
    if (rootRef.current) rootRef.current.visible = vis;
    if (!vis) {
      if (hero.current) hero.current.visible = false;
      return;
    }
    const k = 1 - sseg(p, HIDE[0], HIDE[1]);
    FIGURES.forEach((f, i) => {
      const rig = rigs[i];
      if (!rig.root) return;
      const s = f.path(p);
      const moving = s.active && Math.abs(s.dx) + Math.abs(s.dz) > 0;
      // facing: direction of travel while walking, towards the shelves while standing at the kiosk
      const targetAng = moving ? Math.atan2(s.dx, s.dz) : f.face;
      let d = targetAng - angles.current[i];
      d = Math.atan2(Math.sin(d), Math.cos(d));
      angles.current[i] += d * Math.min(1, dt * 9);
      const lift = i === 0 ? win(p, 0.646, 0.656, 0.662, 0.672) * 1.5 : i === 2 ? win(p, 0.655, 0.662, 0.672, 0.682) * 1.25 : 0;
      const onPlatform = s.z < 3.1 && s.x > KX - 5.1 && s.x < KX + 5.1;
      rig.root.position.set(s.x, onPlatform ? 0.3 : 0, s.z);
      rig.root.rotation.y = angles.current[i];
      rig.root.scale.setScalar(0.9 * Math.max(0.001, k));
      // right arm reaches forward to the shelf (rotate about x: negative = forward when facing -z)
      // after paying: big smile, hearts and a little hop
      rig.cheer = i === 0 ? win(p, 0.664, 0.672, 0.69, 0.7) : i === 2 ? win(p, 0.674, 0.682, 0.7, 0.71) : 0;
      applyMood(rig, rig.cheer > 0.05 ? 'happy' : 'smile');
      swing(rig, s.dist, moving, lift);
    });

    // the picked product: shelf -> hand
    const m = hero.current;
    if (m) {
      const rig = rigs[0];
      const t = sseg(p, 0.65, 0.66);
      m.visible = p > 0.598 && k > 0.01;
      if (rig.armR) {
        rig.armR.updateWorldMatrix(true, false);
        hand.set(0, -0.78, 0.05);
        rig.armR.localToWorld(hand);
      }
      heroPos.copy(shelfStart).lerp(hand, t);
      m.position.copy(heroPos);
      m.scale.setScalar(Math.max(0.001, (p < 0.603 ? sseg(p, 0.597, 0.606) : 1) * k));
    }
  });

  return (
    <group>
      <group ref={rootRef} visible={false}>
        {FIGURES.map((f, i) => (
          <Person key={i} rig={rigs[i]} skin={f.skin} shirt={f.shirt} pants={f.pants} hair={f.hair} glasses={f.glasses} mustache={f.mustache} flare={f.flare} />
        ))}
      </group>
      <group ref={hero} visible={false}>
        <Product kind="bottle" color={C.mint} />
      </group>
    </group>
  );
}

// -------------------------------------------------------------- "better prices" cue
function PriceBadge() {
  const ring = useRef();
  useFrame(() => {
    if (ring.current) {
      ring.current.rotation.y = Math.sin(idle() * 1.2 + world.p * 30) * 0.25;
      ring.current.position.y = Math.sin(idle() * 1.6 + world.p * 20) * 0.1;
    }
  });
  return (
    <>
      <Reveal a={0.652} b={0.672} from={[0, -1, 0]} pos={[KX + slotX(HERO.j), 3.55, 0.9]} out={HIDE}>
        <group ref={ring}>
          <mesh rotation={[Math.PI / 2, 0, 0]} geometry={cyl(0.62, 0.62, 0.12, 36)} material={mat(C.mint, { emissive: C.mint, emissiveIntensity: 0.35 })} castShadow />
          <RBox pos={[0, 0.12, 0.07]} size={[0.2, 0.46, 0.06]} color={C.white} r={0.02} cast={false} />
          <mesh position={[0, -0.22, 0.07]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.26, 0.28, 3]} />
            <meshStandardMaterial color={C.white} />
          </mesh>
        </group>
      </Reveal>
      <Label3D pos={[KX + slotX(HERO.j), 2.75, 0.9]} a={0.66} b={0.676} out={HIDE}>
        Better prices
      </Label3D>
      <Label3D pos={[KX + slotX(HERO.j) - 0.4, 1.7, 1.6]} a={0.67} b={0.684} out={[0.7, 0.72]} kind="good">
        Bought at a discounted price!
      </Label3D>
    </>
  );
}

export default function Kiosk() {
  return (
    <group>
      <KioskBody />
      <DeliveryBoxes />
      <Customers />
      <PriceBadge />
    </group>
  );
}
