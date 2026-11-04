'use client';
import { useState } from 'react';

// ahorra logo: the supplied artwork with its background removed (transparent PNG, same shapes and colour).
// The untouched original stays in public/brand/ahorra-logo.png.
const SRC = '/brand/ahorra-logo-transparent.png';
export const LOGO_ASPECT = 1195 / 300;

export default function Logo({ height = 28 }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="logo-fallback" style={{ fontSize: height * 0.9 }} aria-label="ahorra">
        ahorra
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={SRC} alt="ahorra" draggable={false} onError={() => setFailed(true)} style={{ height, width: height * LOGO_ASPECT, display: 'block' }} />;
}
