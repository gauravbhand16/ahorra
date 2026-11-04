// Scroll system: Lenis (smooth scroll) + GSAP ScrollTrigger (progress) + GSAP ticker (damping).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { world } from './world';

let lenis = null;

export function initScroll(el) {
  gsap.registerPlugin(ScrollTrigger);

  if (!world.reduced) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
  }

  const st = ScrollTrigger.create({
    trigger: el,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      world.target = self.progress;
    },
  });
  ScrollTrigger.refresh();
  world.target = st.progress || 0;
  world.p = world.target;

  const tick = (time, deltaMs) => {
    const dt = Math.min(0.05, (deltaMs || 16) / 1000);
    if (lenis) lenis.raf(time * 1000);
    const k = world.reduced ? 1 : 1 - Math.exp(-dt * 7);
    const prev = world.p;
    world.p += (world.target - world.p) * k;
    world.vel = (world.p - prev) / Math.max(dt, 0.001);
    world.time += dt;
  };
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tick);
    st.kill();
    if (lenis) {
      lenis.destroy();
      lenis = null;
    }
  };
}

export function scrollToP(p) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const y = Math.max(0, Math.min(1, p)) * max;
  if (lenis) lenis.scrollTo(y, { duration: 2.4 });
  else window.scrollTo({ top: y, behavior: 'auto' });
}
