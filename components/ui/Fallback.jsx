'use client';
import { useState } from 'react';
import Logo from './Logo';
import ContactModal from './ContactModal';
import { BLOCKS, IMPACT, STAGES, EMAIL, MAILTO } from '../../lib/content';

// Shown only when WebGL is unavailable: the same story as plain, readable sections.
export default function Fallback() {
  const [formOpen, setFormOpen] = useState(false);
  return (
    <main className="fallback">
      <div className="fb-logo">
        <Logo height={34} />
      </div>
      {BLOCKS.filter((b) => b.id !== 'impact').map((b) => (
        <section key={b.id}>
          {b.chip && <span className="chip">{b.chip}</span>}
          <h2>{b.title}</h2>
          {b.sub && <p>{b.sub}</p>}
          {b.id === 'how' && (
            <ol>
              {STAGES.map((s) => (
                <li key={s.n}>{s.label}</li>
              ))}
            </ol>
          )}
        </section>
      ))}
      <section>
        <h2>Creating value all around.</h2>
        {IMPACT.map((c) => (
          <p key={c.title}>
            <b>{c.title}.</b> {c.body}
          </p>
        ))}
      </section>
      <section>
        <h2>Turning Surplus into Opportunity.</h2>
        <p>Have products to sell? Let&rsquo;s talk.</p>
        <button className="btn btn-big" type="button" onClick={() => setFormOpen(true)}>
          Partner with ahorra
        </button>
        <p><a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
        <button className="btn btn-big" type="button" onClick={() => setFormOpen(true)}>Contact</button>
      </section>
      <ContactModal open={formOpen} onClose={() => setFormOpen(false)} />
    </main>
  );
}
