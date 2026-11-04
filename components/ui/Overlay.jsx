'use client';
import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { world, win, clamp, sseg, chapterAt, CHAPTERS, NAV_TARGETS } from '../../lib/world';
import { BLOCKS, STAGES, STAGE_RANGE, IMPACT, EMAIL, MAILTO, FOOTER, SOCIAL } from '../../lib/content';
import { scrollToP } from '../../lib/scroll';
import { setChapterSound, updateSound, playFx } from '../../lib/sound';
import { useTick } from './useTick';
import Logo from './Logo';

const stageIndexAt = (p) => {
  let idx = 0;
  STAGES.forEach((s, i) => {
    if (p >= s.from) idx = i;
  });
  return idx;
};

export default function Overlay({ onOpenForm }) {
  const blockRefs = useRef([]);
  const railRef = useRef(null);
  const legendRef = useRef(null);
  const cardRefs = useRef([]);
  const closeRef = useRef(null);
  const hintRef = useRef(null);
  const fillRef = useRef(null);
  const barRef = useRef(null);
  const veilRef = useRef(null);
  const [stage, setStage] = useState(0);
  const [chapter, setChapter] = useState(0);
  const [closeActive, setCloseActive] = useState(false);
  const last = useRef({ stage: 0, chapter: -1, close: false });

  useTick(() => {
    const p = world.p;

    BLOCKS.forEach((b, i) => {
      const el = blockRefs.current[i];
      if (!el) return;
      const op = win(p, ...b.range);
      el.style.opacity = op > 0.003 ? '1' : '0';
      el.style.visibility = op > 0.003 ? 'visible' : 'hidden';
      const inner = el.firstChild;
      inner.style.transform = `translate3d(0, ${((1 - op) * 26).toFixed(1)}px, 0)`;
      const words = inner.querySelectorAll('.w');
      const n = words.length;
      words.forEach((w, k) => {
        const t = clamp(op * (1 + n * 0.28) - k * 0.28);
        w.style.opacity = t.toFixed(3);
        w.style.transform = `translate3d(0, ${((1 - t) * 0.5).toFixed(3)}em, 0)`;
      });
      const rest = inner.querySelectorAll('.fade');
      rest.forEach((r) => (r.style.opacity = sseg(op, 0.45, 1).toFixed(3)));
    });

    // stage rail (scene 3 + 4)
    const rail = win(p, ...STAGE_RANGE);
    if (railRef.current) {
      railRef.current.style.opacity = rail.toFixed(3);
      railRef.current.style.visibility = rail > 0.003 ? 'visible' : 'hidden';
    }
    const si = stageIndexAt(p);
    if (si !== last.current.stage) {
      if (si > last.current.stage && rail > 0.5 && si < 5) playFx('ting');
      last.current.stage = si;
      setStage(si);
    }
    // the customer pays: happy chime (only when moving forward through the moment)
    const lp = last.current.p ?? p;
    if (lp < 0.664 && p >= 0.664 && p < 0.7) playFx('chime');
    last.current.p = p;

    // impact cards
    IMPACT.forEach((c, i) => {
      const el = cardRefs.current[i];
      if (!el) return;
      const o = win(p, c.a, c.a + 0.02, 0.78, 0.805);
      el.style.opacity = o.toFixed(3);
      el.style.transform = `translate3d(0, ${((1 - o) * 30).toFixed(1)}px, 0) scale(${(0.94 + 0.06 * o).toFixed(3)})`;
    });

    // legend for the future map
    if (legendRef.current) {
      const l = win(p, 0.82, 0.85, 0.93, 0.95);
      legendRef.current.style.opacity = l.toFixed(3);
      legendRef.current.style.visibility = l > 0.003 ? 'visible' : 'hidden';
    }

    // closing
    const c = sseg(p, 0.935, 0.975);
    if (closeRef.current) {
      closeRef.current.style.opacity = c.toFixed(3);
      closeRef.current.style.visibility = c > 0.003 ? 'visible' : 'hidden';
      closeRef.current.style.pointerEvents = c > 0.6 ? 'auto' : 'none';
      const kids = closeRef.current.querySelectorAll('.cl');
      kids.forEach((k, i) => {
        const t = clamp(c * 1.9 - i * 0.16);
        k.style.opacity = t.toFixed(3);
        k.style.transform = `translate3d(0, ${((1 - t) * 22).toFixed(1)}px, 0)`;
      });
    }
    if (c > 0.6 !== last.current.close) {
      last.current.close = c > 0.6;
      setCloseActive(c > 0.6);
    }

    if (hintRef.current) hintRef.current.style.opacity = (1 - sseg(p, 0.004, 0.03)).toFixed(3);
    if (fillRef.current) fillRef.current.style.transform = `scaleY(${p.toFixed(4)})`;
    if (barRef.current) barRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
    // soft vignette that is heaviest in the gloomy warehouse
    if (veilRef.current) veilRef.current.style.opacity = (0.75 * (1 - sseg(p, 0.06, 0.2))).toFixed(3);

    const ch = chapterAt(p);
    if (ch !== last.current.chapter) {
      last.current.chapter = ch;
      setChapter(ch);
      setChapterSound(ch);
    }
    updateSound(world.vel, p);
  });

  const go = (key) => (e) => {
    e.preventDefault();
    scrollToP(NAV_TARGETS[key]);
  };

  return (
    <div className="overlay" aria-live="off">
      <div className="vignette" ref={veilRef} />

      {BLOCKS.map((b, i) => (
        <div key={b.id} ref={(el) => (blockRefs.current[i] = el)} className={`copy copy-${b.pos}`} style={{ opacity: i === 0 ? 1 : 0 }}>
          <div className="copy-in">
            {b.chip && <span className="chip fade">{b.chip}</span>}
            {b.big ? (
              <h1 className="title title-big">{words(b.title)}</h1>
            ) : (
              <h2 className="title">{words(b.title)}</h2>
            )}
            {b.sub && <p className="sub fade">{b.sub}</p>}
          </div>
        </div>
      ))}

      {/* stages */}
      <div className="rail" ref={railRef} style={{ opacity: 0 }}>
        <ol className="rail-dots" aria-label="How ahorra works">
          {STAGES.map((s, i) => (
            <li key={s.n} className={i < stage ? 'done' : i === stage ? 'active' : ''}>
              <span>{s.n}</span>
            </li>
          ))}
        </ol>
        <div className="rail-label">
          <AnimatePresence mode="wait">
            <motion.p key={stage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}>
              <b>{STAGES[stage].n}</b> {STAGES[stage].label}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* impact */}
      <div className="cards">
        {IMPACT.map((c, i) => (
          <article key={c.title} className="card" ref={(el) => (cardRefs.current[i] = el)} style={{ opacity: 0 }}>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
          </article>
        ))}
      </div>

      {/* future legend */}
      <div className="legend" ref={legendRef} style={{ opacity: 0 }}>
        <span>
          <i className="dot dot-kiosk" /> Kiosk
        </span>
        <span>
          <i className="dot dot-store" /> Green Store <em>(future vision)</em>
        </span>
        <small>Illustrative map</small>
      </div>

      {/* closing */}
      <div className="closing" ref={closeRef} style={{ opacity: 0, visibility: 'hidden' }}>
        <div className="closing-in">
          <div className="cl logo-card">
            <Logo height={46} />
          </div>
          <h2 className="cl title title-close">Turning Surplus into Opportunity.</h2>
          <p className="cl sub sub-close">Have products to sell? Let&rsquo;s talk.</p>
          <div className="cl cta-row">
            <motion.button type="button" className="btn btn-big" onClick={onOpenForm} tabIndex={closeActive ? 0 : -1} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
              Partner with ahorra
            </motion.button>
            <a className="mail" href={`mailto:${EMAIL}`} tabIndex={closeActive ? 0 : -1}>
              {EMAIL}
            </a>
          </div>
          <footer className="cl foot">
            <nav aria-label="Footer">
              {FOOTER.map((f) => (
                <a key={f.key} href={`#${f.key}`} onClick={f.key === 'contact' ? (e) => { e.preventDefault(); onOpenForm(); } : go(f.key)} tabIndex={closeActive ? 0 : -1}>
                  {f.label}
                </a>
              ))}
            </nav>
            <div className="social">
              {SOCIAL.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" tabIndex={closeActive ? 0 : -1}>
                  {s.label}
                </a>
              ))}
            </div>
          </footer>
        </div>
      </div>

      {/* progress */}
      <div className="progress-v" aria-hidden="true">
        <div className="progress-fill" ref={fillRef} />
        {CHAPTERS.map((c) => (
          <i key={c.id} style={{ top: `${c.a * 100}%` }} className={CHAPTERS[chapter].id === c.id ? 'on' : ''} />
        ))}
      </div>
      <div className="progress-h" aria-hidden="true">
        <div ref={barRef} />
      </div>
      <div className="chapter" aria-hidden="true">
        <AnimatePresence mode="wait">
          <motion.span key={chapter} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
            <b>{String(chapter + 1).padStart(2, '0')}</b> {CHAPTERS[chapter].name}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="hint" ref={hintRef}>
        <span>Scroll to explore</span>
        <i />
      </div>
    </div>
  );
}

function words(text) {
  return text.split(' ').map((w, i) => (
    <span key={i} className="w" style={{ display: 'inline-block', marginRight: '0.28em' }}>
      {w}
    </span>
  ));
}
