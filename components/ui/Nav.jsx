'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Logo from './Logo';
import ContactModal from './ContactModal';
import { NAV, MAILTO } from '../../lib/content';
import { NAV_TARGETS } from '../../lib/world';
import { scrollToP } from '../../lib/scroll';

export default function Nav({ onOpenForm }) {
  const [open, setOpen] = useState(false);
  const go = (key) => (e) => {
    e.preventDefault();
    setOpen(false);
    if (key === 'contact') { onOpenForm(); return; }
    scrollToP(NAV_TARGETS[key]);
  };
  return (
    <header className="nav">
      <a href="#home" className="nav-logo" onClick={go('home')} aria-label="ahorra - back to the start">
        <Logo height={26} />
      </a>

      <nav className="nav-links" aria-label="Primary">
        {NAV.map((n) => (
          <a key={n.key} href={`#${n.key}`} onClick={go(n.key)}>
            {n.label}
          </a>
        ))}
      </nav>

      <motion.button type="button" className="btn btn-nav" onClick={onOpenForm} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
        Partner with us
      </motion.button>

      <button className="burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className={open ? 'on' : ''} />
        <span className={open ? 'on' : ''} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div className="mobile-menu" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
            {NAV.map((n, i) => (
              <motion.a key={n.key} href={`#${n.key}`} onClick={go(n.key)} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                {n.label}
              </motion.a>
            ))}
            <button type="button" className="btn btn-nav" onClick={onOpenForm}>
              Partner with us
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
