'use client';
// Original anime-style characters for the ahorra film: chibi people and little "box buddies"
// (cardboard boxes with faces). Flat colours, big shiny eyes, blush, and moods that change with the story.
import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { idle } from '../../lib/world';
import { mat, boxGeo } from '../../lib/geo';
import { C } from '../../lib/palette';

// ---------------------------------------------------------------- shared flat (unlit) bits for faces
const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });
const INK = basic('#2a1c17');
const WHITE = basic('#ffffff');
const BLUSH = basic('#ff7f9a', { transparent: true, opacity: 0.62, depthWrite: false });
const MOUTH_IN = basic('#8a2a35', { side: THREE.DoubleSide });
const SWEAT = basic('#8fd3ff', { side: THREE.DoubleSide });
const GOLD = basic('#ffd95c');
const PINK = basic('#ff6f91');

const G = {
  circle: new THREE.CircleGeometry(1, 20),
  half: new THREE.CircleGeometry(1, 18, Math.PI, Math.PI), // lower half-disc (open smile)
  smile: new THREE.RingGeometry(0.78, 1, 18, 1, Math.PI, Math.PI), // ∪
  frown: new THREE.RingGeometry(0.78, 1, 18, 1, 0, Math.PI), // ∩
  plane: new THREE.PlaneGeometry(1, 1),
};

let _heart = null;
function heartGeo() {
  if (_heart) return _heart;
  const s = new THREE.Shape();
  s.moveTo(0.25, 0.25);
  s.bezierCurveTo(0.25, 0.25, 0.2, 0, 0, 0);
  s.bezierCurveTo(-0.3, 0, -0.3, 0.35, -0.3, 0.35);
  s.bezierCurveTo(-0.3, 0.55, -0.1, 0.77, 0.25, 0.95);
  s.bezierCurveTo(0.6, 0.77, 0.8, 0.55, 0.8, 0.35);
  s.bezierCurveTo(0.8, 0.35, 0.8, 0, 0.5, 0);
  s.bezierCurveTo(0.35, 0, 0.25, 0.25, 0.25, 0.25);
  _heart = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false });
  _heart.translate(-0.25, -0.45, -0.06);
  return _heart;
}
let _star = null;
function starGeo() {
  if (_star) return _star;
  const s = new THREE.Shape();
  const pts = 8;
  for (let i = 0; i < pts; i++) {
    const r = i % 2 ? 0.2 : 1;
    const a = (i / pts) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  _star = new THREE.ShapeGeometry(s);
  return _star;
}

// ---------------------------------------------------------------- moods
// 'smile' (calm), 'happy' (^ ^ + open mouth), 'sad' (worried face + sweat drop)
export function applyMood(rig, mood) {
  if (!rig || rig._mood === mood) return;
  rig._mood = mood;
  const v = (k, on) => rig[k] && (rig[k].visible = on);
  v('eyesOpen', mood !== 'happy');
  v('eyesHappy', mood === 'happy');
  v('mSmile', mood === 'smile');
  v('mOpen', mood === 'happy');
  v('mFrown', mood === 'sad');
  v('sweat', mood === 'sad');
  v('blush', mood !== 'sad');
}

// A face laid flat on a plane (box buddies) or draped on a sphere of radius R (people, the earth).
export function FlatFace({ rig, f = 1, R = 0, z = 0, yoff = 0, style = 'big', brows = false, mood = 'smile' }) {
  const place = (x, y, lift = 0.004) => {
    const X = x * f;
    const Y = y * f + yoff;
    if (!R) return { position: [X, Y, z + lift], rotation: [0, 0, 0] };
    const zz = Math.sqrt(Math.max(0.0001, R * R - X * X - Y * Y)) + lift;
    return { position: [X, Y, zz], rotation: [-Math.atan2(Y, zz), Math.atan2(X, zz), 0] };
  };
  const big = style === 'big';
  const ex = 0.24;
  const ey = 0.1;
  const sc = (x, y = x) => [x * f, y * f, 1];
  // initial mood is applied after refs are attached
  const init = (r) => {
    if (r) setTimeout(() => applyMood(rig, mood), 0);
  };
  return (
    <group ref={(el) => (rig.face = el, init(el))}>
      {/* open eyes */}
      <group ref={(el) => (rig.eyesOpen = el)}>
        {[-1, 1].map((sx) => (
          <group key={sx} {...place(sx * ex, ey)}>
            <mesh geometry={G.circle} material={INK} scale={big ? sc(0.1, 0.135) : sc(0.045, 0.06)} />
            {big && <mesh geometry={G.circle} material={WHITE} position={[0.03 * f, 0.05 * f, 0.002]} scale={sc(0.036)} />}
            {big && <mesh geometry={G.circle} material={WHITE} position={[-0.032 * f, -0.045 * f, 0.002]} scale={sc(0.017)} />}
          </group>
        ))}
      </group>
      {/* happy eyes: ^ ^ */}
      <group ref={(el) => (rig.eyesHappy = el)} visible={false}>
        {[-1, 1].map((sx) => (
          <mesh key={sx} geometry={G.frown} material={INK} {...place(sx * ex, ey - 0.03)} scale={sc(0.095)} />
        ))}
      </group>
      {brows &&
        [-1, 1].map((sx) => (
          <mesh key={sx} geometry={G.plane} material={INK} {...place(sx * ex, ey + 0.2)} scale={sc(0.17, 0.045)} rotation-z={sx * -0.12} />
        ))}
      {/* cheeks */}
      <group ref={(el) => (rig.blush = el)}>
        {[-1, 1].map((sx) => (
          <mesh key={sx} geometry={G.circle} material={BLUSH} {...place(sx * 0.4, -0.1, 0.003)} scale={sc(0.085, 0.05)} />
        ))}
      </group>
      {/* mouths */}
      <mesh ref={(el) => (rig.mSmile = el)} geometry={G.smile} material={INK} {...place(0, -0.1)} scale={sc(0.1)} />
      <mesh ref={(el) => (rig.mOpen = el)} geometry={G.half} material={MOUTH_IN} {...place(0, -0.07)} scale={sc(0.12, 0.13)} visible={false} />
      <mesh ref={(el) => (rig.mFrown = el)} geometry={G.frown} material={INK} {...place(0, -0.2)} scale={sc(0.085)} visible={false} />
      {/* sweat drop */}
      <group ref={(el) => (rig.sweat = el)} visible={false}>
        <mesh geometry={G.circle} material={SWEAT} {...place(0.5, 0.18, 0.006)} scale={sc(0.05)} />
        <mesh geometry={G.plane} material={SWEAT} {...place(0.5, 0.26, 0.006)} scale={sc(0.05, 0.08)} rotation-z={0.8} />
      </group>
    </group>
  );
}

// ---------------------------------------------------------------- sparkles + hearts (happy reactions)
export function Cheer({ rig, y = 2.5, spread = 0.55 }) {
  const items = useMemo(() => [0, 1, 2, 3], []);
  useFrame(() => {
    const g = rig.fx;
    if (!g) return;
    const a = rig.cheer || 0;
    g.visible = a > 0.01;
    if (!g.visible) return;
    const t = idle() * 1.6;
    g.children.forEach((c, i) => {
      const ph = (t + i * 0.55) % 1;
      c.position.set((i - 1.5) * spread * 0.7, y - 2.2 + 0.2 + ph * 0.9, 0.2);
      const s = Math.sin(Math.PI * ph) * a * (i % 2 ? 0.28 : 0.34);
      c.scale.setScalar(Math.max(0.0001, s));
      c.rotation.z = i % 2 ? ph * 2 : 0;
    });
  });
  return (
    <group ref={(el) => (rig.fx = el)} position={[0, 2.2, 0]} visible={false}>
      {items.map((i) => (
        <mesh key={i} geometry={i % 2 ? starGeo() : heartGeo()} material={i % 2 ? GOLD : PINK} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------- people (chibi, face +z)
export function Person({
  rig,
  skin = '#F2C9A5',
  shirt = C.deepGreen,
  pants = C.text,
  hair = '#2b1d16',
  hairStyle = 'cap',
  eyeStyle = 'big',
  brows = false,
  accessory = null,
  glasses = false,
  mustache = false,
  flare = false,
  s = 0.9,
}) {
  const skinM = mat(skin);
  const hairM = mat(hair);
  return (
    <group ref={(el) => (rig.root = el)} scale={s}>
      {/* legs */}
      {[-1, 1].map((sx) => (
        <group key={sx} ref={(el) => (rig[sx < 0 ? 'legL' : 'legR'] = el)} position={[sx * 0.13, 0.66, 0]}>
          <mesh position={[0, -0.27, 0]} material={mat(pants)} castShadow>
            <capsuleGeometry args={[0.115, 0.3, 4, 8]} />
          </mesh>
          {flare && (
            <mesh position={[0, -0.37, 0]} material={mat(pants)} castShadow>
              <cylinderGeometry args={[0.12, 0.22, 0.34, 10]} />
            </mesh>
          )}
          <mesh position={[0, -0.55, 0.05]} material={mat('#fdfdf8')} castShadow scale={[1, 0.62, 1.35]}>
            <sphereGeometry args={[0.14, 12, 8]} />
          </mesh>
        </group>
      ))}
      {/* body */}
      <group ref={(el) => (rig.body = el)} position={[0, 0.98, 0]}>
        <mesh material={mat(shirt)} castShadow>
          <capsuleGeometry args={[0.27, 0.3, 4, 12]} />
        </mesh>
        {accessory === 'apron' && (
          <mesh position={[0, -0.05, 0.215]} material={mat(C.white)} castShadow>
            <boxGeometry args={[0.36, 0.5, 0.12]} />
          </mesh>
        )}
        {accessory === 'lanyard' && (
          <>
            <mesh position={[0, 0.06, 0.265]} material={mat(C.mint)}>
              <boxGeometry args={[0.07, 0.4, 0.03]} />
            </mesh>
            <mesh position={[0, -0.18, 0.28]} material={mat(C.white)}>
              <boxGeometry args={[0.17, 0.22, 0.03]} />
            </mesh>
          </>
        )}
        {accessory === 'backpack' && (
          <mesh position={[0, 0.02, -0.32]} material={mat(C.coral)} castShadow>
            <boxGeometry args={[0.46, 0.55, 0.22]} />
          </mesh>
        )}
      </group>
      {/* arms */}
      {[-1, 1].map((sx) => (
        <group key={sx} ref={(el) => (rig[sx < 0 ? 'armL' : 'armR'] = el)} position={[sx * 0.35, 1.2, 0]}>
          <mesh position={[0, -0.22, 0]} material={mat(shirt)} castShadow>
            <capsuleGeometry args={[0.075, 0.26, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.47, 0]} material={skinM} castShadow>
            <sphereGeometry args={[0.085, 10, 8]} />
          </mesh>
        </group>
      ))}
      {/* head */}
      <group ref={(el) => (rig.head = el)} position={[0, 1.62, 0]}>
        <mesh material={skinM} castShadow scale={[1, 0.94, 1]}>
          <sphereGeometry args={[0.45, 24, 18]} />
        </mesh>
        <FlatFace rig={rig} f={0.78} R={0.45} yoff={-0.01} style={eyeStyle} brows={brows} />
        {/* retro filmi extras: big round glasses and a moustache */}
        {glasses && (
          <group position={[0, 0.07, 0.425]}>
            {[-1, 1].map((sx) => (
              <mesh key={sx} position={[sx * 0.19, 0, 0]} material={mat('#2a1c17')}>
                <torusGeometry args={[0.115, 0.024, 8, 22]} />
              </mesh>
            ))}
            <mesh material={mat('#2a1c17')}>
              <boxGeometry args={[0.1, 0.025, 0.025]} />
            </mesh>
          </group>
        )}
        {mustache && (
          <mesh position={[0, -0.045, 0.435]} rotation={[0, 0, Math.PI / 2]} material={mat('#2a1c17')} scale={[0.7, 1, 0.7]}>
            <capsuleGeometry args={[0.028, 0.2, 4, 8]} />
          </mesh>
        )}
        {/* ears */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.44, -0.02, 0]} material={skinM} scale={[0.6, 1, 0.8]}>
            <sphereGeometry args={[0.07, 8, 8]} />
          </mesh>
        ))}
        {/* hair */}
        <mesh material={hairM} castShadow position={[0, 0.02, -0.02]} rotation={[-0.15, 0, 0]}>
          <sphereGeometry args={[0.475, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        </mesh>
        {/* fringe */}
        {[-0.26, -0.1, 0.07, 0.23].map((x, i) => (
          <mesh key={i} material={hairM} position={[x, 0.3 - Math.abs(x) * 0.12, 0.31]} rotation={[0.9, 0, x * -1.6]} scale={[1, 1.5, 0.6]} castShadow>
            <coneGeometry args={[0.1, 0.19, 8]} />
          </mesh>
        ))}
        {hairStyle === 'spiky' &&
          [0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2;
            return (
              <mesh key={i} material={hairM} position={[Math.cos(a) * 0.2, 0.46, Math.sin(a) * 0.2 - 0.04]} rotation={[Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]} castShadow>
                <coneGeometry args={[0.09, 0.28, 6]} />
              </mesh>
            );
          })}
        {hairStyle === 'bun' && (
          <mesh material={hairM} position={[0, 0.5, -0.05]} castShadow>
            <sphereGeometry args={[0.17, 14, 12]} />
          </mesh>
        )}
        {hairStyle === 'bob' &&
          [-1, 1].map((sx) => (
            <mesh key={sx} material={hairM} position={[sx * 0.41, -0.12, -0.06]} castShadow scale={[0.8, 1.5, 0.9]}>
              <sphereGeometry args={[0.15, 12, 10]} />
            </mesh>
          ))}
      </group>
      <Cheer rig={rig} y={2.7} />
    </group>
  );
}

// Walk cycle + idle breathing.
export function swing(rig, dist, moving, armLift = 0) {
  const amp = moving ? 0.75 : 0;
  const ph = dist * 3.2;
  const bob = moving ? Math.abs(Math.sin(ph)) * 0.04 : Math.sin(idle() * 1.6) * 0.008;
  const hop = (rig.cheer || 0) * Math.abs(Math.sin(idle() * 5)) * 0.18;
  if (rig.legL) rig.legL.rotation.x = Math.sin(ph) * amp;
  if (rig.legR) rig.legR.rotation.x = -Math.sin(ph) * amp;
  if (rig.armL) rig.armL.rotation.x = -Math.sin(ph) * amp * 0.8 - (rig.cheer || 0) * 2.4;
  if (rig.armR) rig.armR.rotation.x = Math.sin(ph) * amp * 0.8 - armLift - (rig.cheer || 0) * 2.4;
  if (rig.body) rig.body.position.y = 0.98 + bob + hop;
  if (rig.head) {
    rig.head.position.y = 1.62 + bob * 1.4 + hop;
    rig.head.rotation.z = moving ? Math.sin(ph) * 0.04 : Math.sin(idle() * 1.1) * 0.025;
  }
}

// ---------------------------------------------------------------- box buddies
export function BoxBuddy({ rig, size = [0.9, 0.8, 0.8], color = C.cardboard, mood = 'sad', feet = true, tape = true, wobble = true }) {
  const [w, h, d] = size;
  const geo = useMemo(() => boxGeo(w, h, d, 0.07), [w, h, d]);
  useFrame(() => {
    const m = rig.mood || mood;
    applyMood(rig, m);
    const g = rig.root;
    if (!g || !wobble) return;
    const t = idle();
    if (m === 'sad') {
      g.rotation.z = Math.sin(t * 9 + w * 7) * 0.025; // nervous shiver
      g.position.y = 0;
    } else if (m === 'happy') {
      g.rotation.z = Math.sin(t * 3 + w * 5) * 0.05;
      g.position.y = Math.abs(Math.sin(t * 3.2 + w * 5)) * 0.08;
    } else {
      g.rotation.z = 0;
      g.position.y = 0;
    }
  });
  return (
    <group ref={(el) => (rig.root = el)}>
      <group position={[0, feet ? 0.1 : 0, 0]}>
        <mesh geometry={geo} material={mat(color)} position={[0, h / 2, 0]} castShadow receiveShadow />
        {tape && (
          <mesh material={mat(C.tape)} position={[0, h + 0.004, 0]}>
            <boxGeometry args={[w * 0.22, 0.012, d * 0.99]} />
          </mesh>
        )}
        <group position={[0, h / 2, 0]}>
          <FlatFace rig={rig} f={Math.min(w, h) * 1.05} z={d / 2} yoff={0.02} mood={mood} />
        </group>
        {feet &&
          [-1, 1].map((sx) => (
            <mesh key={sx} position={[sx * w * 0.25, -0.02, 0.02]} material={mat(C.cardboardDark)} scale={[1, 0.6, 1.3]} castShadow>
              <sphereGeometry args={[0.1, 10, 8]} />
            </mesh>
          ))}
        {feet &&
          [-1, 1].map((sx) => (
            <mesh key={sx} position={[sx * (w / 2 + 0.05), h * 0.42, 0]} material={mat(C.cardboardDark)} castShadow>
              <sphereGeometry args={[0.075, 10, 8]} />
            </mesh>
          ))}
      </group>
    </group>
  );
}

// small spinning sparkle used for "approved / eligible" moments
export function Sparkle({ position = [0, 0, 0], s = 0.4, speed = 1 }) {
  useFrame(() => {});
  return (
    <group position={position} scale={s}>
      <mesh geometry={starGeo()} material={GOLD} />
    </group>
  );
}

export { starGeo, heartGeo };
