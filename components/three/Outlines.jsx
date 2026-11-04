'use client';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { world } from '../../lib/world';

// Anime-style ink outlines: every toon-shaded mesh gets an inverted "hull" copy that is pushed out
// by a constant number of screen pixels, so lines keep the same weight near and far.
// Hulls fade into the fog colour so distant objects do not keep hard black lines.
const vert = /* glsl */ `
uniform vec2 uRes;
uniform float uPx;
varying float vDepth;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDepth = -mv.z;
  vec4 clip = projectionMatrix * mv;
  vec3 n = normalize(normalMatrix * normal);
  vec2 d = (projectionMatrix * vec4(n, 0.0)).xy * uRes;
  d = d / max(length(d), 1e-4);
  float s = length(modelMatrix[0].xyz);          // objects that are scaled to ~0 lose their line too
  float k = smoothstep(0.02, 0.2, s);
  clip.xy += d * (uPx * 2.0 / uRes) * clip.w * k;
  gl_Position = clip;
}`;
const frag = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
varying float vDepth;
void main() {
  float f = smoothstep(uFogNear, uFogFar, vDepth);
  gl_FragColor = vec4(mix(uColor, uFogColor, f), 1.0);
  #include <colorspace_fragment>
}`;

export default function Outlines() {
  const { scene, size, gl } = useThree();
  const frames = useRef(0);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        side: THREE.BackSide,
        uniforms: {
          uColor: { value: new THREE.Color('#1b2a25') },
          uRes: { value: new THREE.Vector2(1, 1) },
          uPx: { value: 2 },
          uFogColor: { value: new THREE.Color('#ffffff') },
          uFogNear: { value: 10 },
          uFogFar: { value: 100 },
        },
      }),
    []
  );

  useFrame(() => {
    const dpr = gl.getPixelRatio();
    const u = material.uniforms;
    u.uRes.value.set(size.width * dpr, size.height * dpr);
    u.uPx.value = (world.mobile ? 1.5 : 2.1) * dpr;
    if (scene.fog) {
      u.uFogColor.value.copy(scene.fog.color);
      u.uFogNear.value = scene.fog.near;
      u.uFogFar.value = scene.fog.far;
    }
    // attach hulls once every scene component has mounted
    if (frames.current < 6) {
      frames.current++;
      if (frames.current === 5) {
        const list = [];
        scene.traverse((o) => {
          if (o.isMesh && o.material && o.material.isMeshToonMaterial && !o.userData.noOutline && !o.userData.hull) list.push(o);
        });
        list.forEach((m) => {
          const h = new THREE.Mesh(m.geometry, material);
          h.userData.hull = true;
          h.castShadow = false;
          h.receiveShadow = false;
          h.raycast = () => {};
          m.add(h);
        });
      }
    }
  });
  return null;
}
