'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EMAIL } from '../../lib/content';

export default function ContactModal({ open, onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus('');
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${EMAIL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name,
          email,
          company: company || 'Not provided',
          message,
          _subject: 'New website enquiry for ahorra',
          _replyto: email,
        }),
      });
      const result = await response.json();
      if (result.success === true || result.success === 'true') {
        setStatus('success');
        setName(''); setEmail(''); setCompany(''); setMessage('');
      } else {
        setStatus(result.message || 'Unable to send your enquiry. Please try again.');
      }
    } catch (error) {
      setStatus('Something went wrong. Please try again or email communications@ahorra.in.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="contact-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.section className="contact-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ duration: 0.22 }}>
            <button type="button" className="contact-modal-close" onClick={onClose} aria-label="Close form">×</button>
            <span className="contact-modal-kicker">LET’S CONNECT</span>
            <h2 id="contact-modal-title">Talk to ahorra</h2>
            <p>Tell us a little about your enquiry and we’ll get back to you.</p>
            <form onSubmit={submit}>
              <label>Name<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></label>
              <label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></label>
              <label>Company <span>(optional)</span><input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" /></label>
              <label>How can we help?<textarea required rows="4" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message..." /></label>
              <button className="btn contact-submit" type="submit" disabled={sending}>{sending ? 'Sending...' : 'Send enquiry'}</button>
              {status === 'success' && <p role="status" className="contact-form-status">Thanks! Your enquiry has been sent.</p>}
              {status && status !== 'success' && <p role="alert" className="contact-form-status">{status}</p>}
            </form>
            <a className="contact-modal-email" href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
