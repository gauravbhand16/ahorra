'use client';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { world, sseg } from '../../lib/world';
import { Atmosphere, CameraRig, Ground, Clouds } from './Atmosphere';
import Warehouse from './Warehouse';
import Pipeline from './Pipeline';
import Kiosk from './Kiosk';
import Impact from './Impact';
import Future from './Future';
import Outlines from './Outlines';

function Ready({ onReady }) {
  const n = useRef(0);
  useFrame(() => {
    n.current++;
    if (n.current === 4) onReady && onReady();
  });
  return null;
}

// Story colour grade: the problem is told in black and white; colour floods in as ahorra arrives.
function ColorGrade() {
  useFrame(({ gl }) => {
    const g = 1 - sseg(world.p, 0.2, 0.3);
    const el = gl.domElement;
    const v = g > 0.002 ? `grayscale(${g.toFixed(3)}) contrast(${(1 + 0.1 * g).toFixed(3)})` : 'none';
    if (el.style.filter !== v) el.style.filter = v;
  });
  return null;
}

// Visibility culling by chapter keeps the draw-call count low on phones.
function Cull({ children }) {
  return children;
}

export default function World3D({ onReady }) {
  const dpr = world.mobile ? [1, 1.5] : [1, 2];
  return (
    <Canvas
      dpr={dpr}
      shadows={world.low ? false : 'soft'}
      camera={{ fov: 38, near: 0.1, far: 500, position: [-22.5, 2.4, 0.6] }}
      gl={{ antialias: !world.low, powerPreference: 'high-performance', toneMapping: THREE.NoToneMapping }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1;
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Suspense fallback={null}>
        <Atmosphere />
        <CameraRig />
        <Ground />
        <Clouds />
        <Cull>
          <Warehouse />
          <Pipeline />
          <Kiosk />
          <Impact />
          <Future />
        </Cull>
        <ColorGrade />
        <Outlines />
        <Ready onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
