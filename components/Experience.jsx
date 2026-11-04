'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { world } from '../lib/world';
import { initScroll } from '../lib/scroll';
import Nav from './ui/Nav';
import Overlay from './ui/Overlay';
import SoundToggle from './ui/SoundToggle';
import Logo from './ui/Logo';
import Fallback from './ui/Fallback';
import ContactModal from './ui/ContactModal';

// The 3D world is loaded lazily, client-side only.
const World3D = dynamic(() => import('./three/World3D'), { ssr: false });

function detectWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

export default function Experience() {
  const scrollRef = useRef(null);
  const [env, setEnv] = useState(null);
  const [ready, setReady] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const mobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    world.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    world.mobile = mobile;
    world.low = mobile || (navigator.hardwareConcurrency || 8) <= 4;
    setEnv({ mobile, webgl: detectWebGL() });
  }, []);

  useEffect(() => {
    if (!env || !env.webgl || !scrollRef.current) return;
    const cleanup = initScroll(scrollRef.current);
    return cleanup;
  }, [env]);

  if (!env) return <div className="boot" />;
  if (!env.webgl) return <Fallback />;

  return (
    <>
      <Nav onOpenForm={() => setFormOpen(true)} />
      {/* tall scroll track; the stage inside is pinned (sticky) and the film plays against scroll progress */}
      <div ref={scrollRef} className="track" style={{ height: `${env.mobile ? 800 : 1000}vh` }}>
        <div className="stage">
          <World3D onReady={() => setReady(true)} />
          <Overlay onOpenForm={() => setFormOpen(true)} />
        </div>
      </div>
      <SoundToggle />
      <ContactModal open={formOpen} onClose={() => setFormOpen(false)} />
      <AnimatePresence>
        {!ready && (
          <motion.div className="loader" exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
            <Logo height={42} />
            <div className="loader-bar">
              <i />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
