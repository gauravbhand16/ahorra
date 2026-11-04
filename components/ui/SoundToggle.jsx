'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { enableSound, disableSound } from '../../lib/sound';
import { setChapterSound } from '../../lib/sound';
import { chapterAt, world } from '../../lib/world';

// Sound is OFF until the visitor presses this. Never autoplays.
export default function SoundToggle() {
  const [on, setOn] = useState(false);
  const toggle = () => {
    if (on) {
      disableSound();
      setOn(false);
    } else {
      enableSound();
      setChapterSound(chapterAt(world.p));
      setOn(true);
    }
  };
  return (
    <motion.button className="sound" onClick={toggle} aria-pressed={on} aria-label={on ? 'Mute sound' : 'Unmute sound'} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4V5z" />
        {on ? (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </>
        ) : (
          <>
            <path d="m16 9 5 6" />
            <path d="m21 9-5 6" />
          </>
        )}
      </svg>
      <span>{on ? 'Sound on' : 'Sound off'}</span>
    </motion.button>
  );
}
