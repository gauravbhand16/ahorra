import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// Runs fn on every GSAP tick (the same clock that drives the scroll damping).
export function useTick(fn) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const f = (t, d) => ref.current(t, d);
    gsap.ticker.add(f);
    return () => gsap.ticker.remove(f);
  }, []);
}
