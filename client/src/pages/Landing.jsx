import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Phone, Mail } from 'lucide-react';

/* ─── Constants ─────────────────────────────────────────────────── */
const GOLD = '#FBBF24';
const DARK = '#111111';
const CYCLE_WORDS = ['Customers.', 'Trust,', 'Growth'];

/* ─── Scroll reveal hook ─────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Reveal({ children, delay = 0, y = 28, className = '' }) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : `translateY(${y}px)`,
        transition: `opacity 0.65s cubic-bezier(.22,1,.36,1) ${delay}s,transform 0.65s cubic-bezier(.22,1,.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Animated Headline ──────────────────────────────────────────── */
function AnimatedHeadline() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      // 1. fade out current word
      setVisible(false);
      // 2. after fade-out completes, swap word and fade back in
      setTimeout(() => {
        setIdx(i => (i + 1) % CYCLE_WORDS.length);
        setVisible(true);
      }, 380);
    }, 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05 }}>
      {/* "GetMore" — white, own line, massive */}
      <div style={{ color: '#fff', fontSize: 'clamp(52px, 7.5vw, 112px)', display: 'block' }}>
        GetMore
      </div>
      {/* "Reviews." — white, own line */}
      <div style={{ color: '#fff', fontSize: 'clamp(52px, 7.5vw, 112px)', display: 'block', marginBottom: '0.18em' }}>
        Reviews.
      </div>
      {/* Gold animated line — slightly smaller */}
      <div style={{ color: GOLD, fontSize: 'clamp(36px, 5vw, 78px)', display: 'block' }}>
        GetMore{' '}
        <span style={{
          display: 'inline-block',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0px)' : 'translateY(-10px)',
          transition: 'opacity 0.34s ease, transform 0.34s ease',
        }}>
          {CYCLE_WORDS[idx]}
        </span>
      </div>
    </div>
  );
}

/* ─── Dashboard Mockup ───────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div style={{ position: 'relative', padding: '0 12px' }} className="dash-mockup-wrap">
      <div style={{
        position: 'absolute', inset: -40, borderRadius: 32,
        background: `radial-gradient(ellipse 70% 60% at 50% 50%,${GOLD}1a 0%,transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <motion.div
        initial={{ opacity: 0, y: 36, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: '#18181b', borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 48px 96px rgba(0,0,0,0.7), 0 0 0 1px rgba(251,191,36,0.06)',
          overflow: 'hidden', position: 'relative',
        }}
      >
        {/* Chrome bar */}
        <div style={{ background: '#0f0f0f', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 7, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['#ef4444','#f59e0b','#22c55e'].map(c => <span key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c, display: 'inline-block' }} />)}
          <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.28)', fontWeight: 500 }}>GETMORE Dashboard</span>
        </div>
        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, padding: '14px 14px 10px' }}>
          {[
            { label: 'New Reviews', value: '248', delta: '+18%' },
            { label: 'Avg Rating', value: '4.9★', delta: '+0.3' },
            { label: 'Conversions', value: '63%', delta: '+11%' },
          ].map(k => (
            <div key={k.label} style={{ background: '#27272a', borderRadius: 12, padding: '13px 11px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{k.label}</p>
              <p style={{ fontSize: 19, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{k.value}</p>
              <p style={{ fontSize: 10, color: GOLD, fontWeight: 600, marginTop: 4 }}>{k.delta}</p>
            </div>
          ))}
        </div>
        {/* Bar chart */}
        <div style={{ margin: '0 14px 10px', background: '#27272a', borderRadius: 12, padding: '13px 11px', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Reviews This Week</p>
            <span style={{ fontSize: 10, color: GOLD, background: `${GOLD}18`, padding: '2px 8px', borderRadius: 99 }}>Live</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 56 }}>
            {[40,56,44,74,62,88,68].map((h,i) => (
              <div key={i} style={{ flex: 1, borderRadius: '3px 3px 0 0', height: `${h}%`, background: i===5 ? GOLD : '#3f3f46' }} />
            ))}
          </div>
          <div style={{ display: 'flex', marginTop: 4 }}>
            {['M','T','W','T','F','S','S'].map((d,i) => (
              <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.22)' }}>{d}</span>
            ))}
          </div>
        </div>
        {/* Feed */}
        <div style={{ margin: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            { name: 'Sarah M.', text: '★★★★★ Amazing service! Highly recommended.' },
            { name: 'James T.', text: '★★★★★ Very professional and friendly team.' },
            { name: 'Priya K.', text: '★★★★★ Would recommend to everyone!' },
          ].map(a => (
            <div key={a.name} style={{ background: '#27272a', borderRadius: 10, padding: '9px 11px', display: 'flex', alignItems: 'center', gap: 9, border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: DARK, flexShrink: 0 }}>{a.name[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{a.name}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.text}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
      {/* Floating badges */}
      <motion.div
        animate={{ y: [0,-10,0] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: 36, right: -8, background: GOLD, color: DARK, borderRadius: 14, padding: '9px 15px', fontWeight: 800, fontSize: 13, boxShadow: `0 8px 24px ${GOLD}44`, zIndex: 2 }}
      >
        +34 Reviews Today 🎉
      </motion.div>
      <motion.div
        animate={{ y: [0,10,0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 1.2 }}
        style={{ position: 'absolute', bottom: 56, left: -8, background: '#1c1c1f', color: '#fff', borderRadius: 14, padding: '9px 14px', fontWeight: 700, fontSize: 12, border: `1px solid ${GOLD}44`, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 2 }}
      >
        ⭐ Rating: 4.9 / 5.0
      </motion.div>
    </div>
  );
}

/* ─── Contact Form ───────────────────────────────────────────────── */
function ContactForm() {
  const [form, setForm] = useState({ name: '', business: '', email: '', phone: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setLoading(true);
    setError('');
    try {
      const API = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send');
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', background: '#1c1c1f', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, padding: '14px 16px', fontSize: 14, color: '#fff',
    outline: 'none', transition: 'border-color 0.2s',
    fontFamily: 'inherit',
  };

  if (sent) return (
    <div style={{ textAlign: 'center', padding: '56px 24px', background: '#18181b', border: `1px solid ${GOLD}30`, borderRadius: 24 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
      <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Message Sent!</h3>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
        Thank you, <strong style={{ color: GOLD }}>{form.name}</strong>! Our team will contact you within 24 hours to schedule your demo.
      </p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <div className="contact-form-grid">
        {/* Name */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Full Name *</label>
          <input required value={form.name} onChange={set('name')} placeholder="John Smith" style={inputStyle}
            onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>
        {/* Business */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Business Name</label>
          <input value={form.business} onChange={set('business')} placeholder="Your Business" style={inputStyle}
            onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>
        {/* Email */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Email Address *</label>
          <input required type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" style={inputStyle}
            onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>
        {/* Phone */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Phone Number</label>
          <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+1 234 567 8900" style={inputStyle}
            onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>
      </div>
      {/* Message */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Message</label>
        <textarea value={form.message} onChange={set('message')} rows={4} placeholder="Tell us about your business and what you're looking to achieve..." style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
          onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
      </div>
      {/* Error */}
      {error && (
        <p style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171', textAlign: 'center' }}>
          {error}
        </p>
      )}
      {/* Submit */}
      <button type="submit" disabled={loading} style={{
        background: loading ? 'rgba(251,191,36,0.6)' : GOLD, color: DARK, fontWeight: 800, fontSize: 16,
        padding: '15px 32px', borderRadius: 12, border: 'none', cursor: loading ? 'wait' : 'pointer',
        boxShadow: `0 8px 24px ${GOLD}35`, transition: 'all 0.2s', marginTop: 4, width: '100%',
        fontFamily: 'inherit',
      }}
        onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 14px 32px ${GOLD}50`; }}}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 8px 24px ${GOLD}35`; }}
      >
        {loading ? 'Sending…' : 'Book a Demo →'}
      </button>
      <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.28)', marginTop: 4 }}>
        We respond within 24 hours. No spam, ever.
      </p>
    </form>
  );
}

/* ─── Section Label ──────────────────────────────────────────────── */
function Label({ children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase',
      color: GOLD, background: `${GOLD}14`, border: `1px solid ${GOLD}2e`,
      padding: '5px 14px', borderRadius: 99,
    }}>{children}</span>
  );
}

/* ─── Divider ────────────────────────────────────────────────────── */
const Div = () => <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />;

/* ═══════════════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════════════ */
export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const S = { maxWidth: 1160, margin: '0 auto', padding: '0 24px' };   // section inner
  const SEC = { padding: '96px 0' };

  return (
    <div style={{ background: DARK, color: '#fff', fontFamily: "'Inter',system-ui,sans-serif", overflowX: 'hidden' }}>

      {/* ══ NAVBAR ══════════════════════════════════════════════════ */}
      <header className={`hdr-root${scrolled ? ' hdr-scrolled' : ''}`}>
        <div className="hdr-inner">

          {/* Logo — far left, width-based so aspect ratio is always preserved */}
          <Link to="/" className="hdr-logo-wrap" tabIndex={0} aria-label="GETMORE home">
            <img
              src="/getmore-logo.png"
              alt="GETMORE"
              draggable="false"
              className="hdr-logo"
            />
          </Link>

          {/* Centre nav — hidden on mobile */}
          <nav className="hdr-nav" aria-label="Site navigation">
            {['Features','How It Works','Pricing','Contact'].map(l => (
              <a
                key={l}
                href={l === 'Contact' ? '#contact' : `#${l.toLowerCase().replace(/\s+/g,'-')}`}
                className="hdr-nav-link"
              >{l}</a>
            ))}
          </nav>

          {/* Right CTA */}
          <div className="hdr-cta">
            <Link to="/login" className="hdr-signin">Sign In</Link>
            <a href="#contact" className="hdr-demo">Book a Demo</a>
          </div>

        </div>
      </header>

      {/* ══ HERO ════════════════════════════════════════════════════ */}
      <section className="hero-section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 0 80px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg,#111 0%,#161616 55%,#111 100%)' }}>
        {/* Ambient glows */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-15%', left: '35%', width: 720, height: 720, borderRadius: '50%', background: `${GOLD}09`, filter: 'blur(90px)' }} />
          <div style={{ position: 'absolute', bottom: '-5%', right: '5%', width: 480, height: 480, borderRadius: '50%', background: `${GOLD}06`, filter: 'blur(70px)' }} />
        </div>
        <div style={{ ...S, width: '100%', position: 'relative' }} className="hero-grid-wrap">
          {/* Left */}
          <motion.div initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}>
            <div style={{ marginBottom: 24 }}>
              <Label>✦ AI-Powered Google Review Growth Platform</Label>
            </div>
            <AnimatedHeadline />
            <p style={{ marginTop: 22, fontSize: 17, lineHeight: 1.72, color: 'rgba(255,255,255,0.58)', maxWidth: 520 }}>
              GETMORE helps businesses collect more Google reviews through AI-powered review suggestions, WhatsApp Automated Message to collect review, QR codes, private negative feedback collection, and real-time analytics.
            </p>
            <div style={{ display: 'flex', gap: 14, marginTop: 36, flexWrap: 'wrap' }}>
              <a href="#contact" style={{ display: 'inline-flex', alignItems: 'center', background: GOLD, color: DARK, fontWeight: 800, fontSize: 15, padding: '14px 30px', borderRadius: 12, textDecoration: 'none', boxShadow: `0 8px 28px ${GOLD}40`, transition: 'all 0.2s' }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 14px 36px ${GOLD}55`}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=`0 8px 28px ${GOLD}40`}}
              >Book a Demo →</a>
              <a href="#how-it-works" style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', fontWeight: 600, fontSize: 15, padding: '14px 28px', borderRadius: 12, textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;e.currentTarget.style.background=`${GOLD}0d`}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.18)';e.currentTarget.style.background='transparent'}}
              >See How It Works</a>
            </div>
            <div style={{ display: 'flex', gap: 22, marginTop: 26, flexWrap: 'wrap' }}>
              {['No credit card required','5-minute setup','Cancel anytime'].map(t => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                  <span style={{ color: GOLD }}>✓</span>{t}
                </span>
              ))}
            </div>
          </motion.div>
          {/* Right — Dashboard */}
          <DashboardMockup />
        </div>
      </section>

      {/* ══ STATS STRIP ════════════════════════════════════════════ */}
      <section style={{ background: '#0c0c0c', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '40px 0' }}>
        <div style={{ ...S }} className="stats-grid">
          {[
            { v: '10,000+', l: 'Businesses Worldwide' },
            { v: '2.4M+', l: 'Reviews Collected' },
            { v: '4.9★', l: 'Average Rating Achieved' },
            { v: '340%', l: 'Avg Review Increase' },
          ].map((s,i) => (
            <Reveal key={s.l} delay={i*0.08}>
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <p style={{ fontSize: 30, fontWeight: 900, color: GOLD, lineHeight: 1 }}>{s.v}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', marginTop: 5 }}>{s.l}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ WHY GETMORE ════════════════════════════════════════════ */}
      <Div /><section id="about" style={{ ...SEC }}>
        <div style={S}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <Label>Why GETMORE</Label>
              <h2 style={{ fontSize: 'clamp(26px,3.4vw,46px)', fontWeight: 900, marginTop: 18, letterSpacing: '-0.025em', lineHeight: 1.12 }}>
                Turn Every Customer Into A<br /><span style={{ color: GOLD }}>Review Opportunity</span>
              </h2>
              <p style={{ marginTop: 16, fontSize: 16, color: 'rgba(255,255,255,0.52)', maxWidth: 580, margin: '16px auto 0', lineHeight: 1.72 }}>
                Most happy customers never leave a review because it takes too much effort.<br />
                GETMORE removes the friction by generating ready-to-use review suggestions that customers can copy and post in seconds.
              </p>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 18 }}>
            {[
              { icon: '⭐', title: 'Increase Google Reviews' },
              { icon: '✍️', title: 'Avoid one word review' },
              { icon: '📈', title: 'Improve Local SEO Rankings' },
              { icon: '🤝', title: 'Build Customer Trust' },
              { icon: '🛡️', title: 'Protect Online Reputation' },
              { icon: '📊', title: 'Track Review Performance' },
              { icon: '🚀', title: 'Grow Business Visibility' },
            ].map((b,i) => (
              <Reveal key={b.title} delay={i*0.07}>
                <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '22px 20px', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=`${GOLD}40`;e.currentTarget.style.transform='translateY(-3px)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.06)';e.currentTarget.style.transform='none'}}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${GOLD}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{b.icon}</div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{b.title}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════ */}
      <Div /><section id="how-it-works" style={{ ...SEC, background: '#0c0c0c' }}>
        <div style={S}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <Label>How It Works</Label>
              <h2 style={{ fontSize: 'clamp(26px,3.4vw,46px)', fontWeight: 900, marginTop: 18, letterSpacing: '-0.025em' }}>
                From Customer Visit to<br /><span style={{ color: GOLD }}>Google Review in 6 Steps</span>
              </h2>
            </div>
          </Reveal>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 22,
          }}
            className="process-grid"
          >
            {[
              { n: '01', title: 'Add Customer', desc: 'Capture customer name, phone number, and service provided.' },
              { n: '02', title: 'Send Review Request', desc: 'Send personalized review requests directly through WhatsApp.' },
              { n: '03', title: 'Customer Selects Service', desc: 'Customers select the service they received.' },
              { n: '04', title: 'AI Generates Review Suggestions', desc: 'GETMORE instantly generates multiple review suggestions tailored to the selected service.' },
              { n: '05', title: 'Customer Posts Review', desc: 'One click copies the review and redirects directly to the Google Review page.' },
              { n: '06', title: 'Track Performance', desc: 'Monitor reviews, feedback, conversions, and customer activity from one dashboard.' },
            ].map((s,i) => (
              <Reveal key={s.n} delay={i*0.09} className="process-card-wrap">
                <div
                  className="process-card"
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=`${GOLD}40`;e.currentTarget.style.transform='translateY(-3px)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.06)';e.currentTarget.style.transform='none'}}
                >
                  {/* Background step number — fixed position top-left */}
                  <div className="process-num">{s.n}</div>
                  {/* Step badge — fixed height, always same distance from top */}
                  <div className="process-badge">
                    <span>Step {s.n}</span>
                  </div>
                  {/* Title — always at same vertical position */}
                  <h3 className="process-title">{s.title}</h3>
                  {/* Description — grows to fill remaining space */}
                  <p className="process-desc">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════════ */}
      <Div /><section id="features" style={{ ...SEC }}>
        <div style={S}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <Label>Features</Label>
              <h2 style={{ fontSize: 'clamp(26px,3.4vw,46px)', fontWeight: 900, marginTop: 18, letterSpacing: '-0.025em' }}>
                Everything You Need to<br /><span style={{ color: GOLD }}>Dominate Google Reviews</span>
              </h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
            {[
              { icon: '🤖', title: 'AI Review Suggestions', desc: 'Generate natural, professional review suggestions based on services and customer experiences.' },
              { icon: '💬', title: 'WhatsApp Automation Message', desc: 'Send review requests directly to customers through WhatsApp.' },
              { icon: '📱', title: 'QR Code Reviews', desc: 'Allow customers to leave reviews instantly using QR codes.' },
              { icon: '🛡️', title: 'Private Negative Feedback Collection', desc: 'Redirect unhappy customers to private feedback instead of public negative reviews.' },
              { icon: '📊', title: 'Review Analytics', desc: 'Track review growth, customer responses, conversion rates, and business performance.' },
              { icon: '👥', title: 'Customer Management', desc: 'Store customer details, services received, review status, and communication history.' },
              { icon: '🏢', title: 'Multi-Business Management', desc: 'Manage multiple businesses and locations from a single dashboard.' },
            ].map((f,i) => (
              <Reveal key={f.title} delay={i*0.07}>
                <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '26px 22px', height: '100%', transition: 'all 0.2s' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=`${GOLD}40`;e.currentTarget.style.background='#1c1c1f';e.currentTarget.style.transform='translateY(-3px)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.06)';e.currentTarget.style.background='#18181b';e.currentTarget.style.transform='none'}}
                >
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: `${GOLD}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CUSTOMER JOURNEY ══════════════════════════════════════ */}
      <Div /><section style={{ ...SEC, background: '#0c0c0c' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <Label>Customer Journey</Label>
              <h2 style={{ fontSize: 'clamp(26px,3.4vw,46px)', fontWeight: 900, marginTop: 18, letterSpacing: '-0.025em' }}>
                The <span style={{ color: GOLD }}>GETMORE</span> Review Flow
              </h2>
            </div>
          </Reveal>
          {[
            { icon: '🏪', label: 'Customer Visits Business' },
            { icon: '💬', label: 'WhatsApp Review Request Sent/Scan at business place' },
            { icon: '🎯', label: 'Service Selected' },
            { icon: '🤖', label: 'AI Review Generated' },
            { icon: '📋', label: 'Review Copied' },
            { icon: '⭐', label: 'Google Review Submitted' },
            { icon: '🎉', label: 'Thank You Page' },
            { icon: '✅', label: 'Review Collection Completed' },
          ].map((step, i, arr) => (
            <Reveal key={step.label} delay={i*0.07}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: i===arr.length-1 ? GOLD : '#27272a', border: `1px solid ${i===arr.length-1 ? GOLD : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    {step.icon}
                  </div>
                  {i < arr.length-1 && <div style={{ width: 2, height: 28, background: `linear-gradient(to bottom,${GOLD}55,${GOLD}18)`, margin: '2px 0' }} />}
                </div>
                <div style={{ flex: 1, background: '#18181b', border: `1px solid ${i===arr.length-1 ? `${GOLD}44` : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, padding: '15px 20px', marginBottom: i<arr.length-1 ? 4 : 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: i===arr.length-1 ? GOLD : '#fff' }}>{step.label}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ PRIVATE FEEDBACK PROTECTION ═══════════════════════════ */}
      <Div /><section style={{ ...SEC }}>
        <div style={S}>
          <div className="two-col-grid">
            <Reveal>
              <Label>🛡️ Reputation Protection</Label>
              <h2 style={{ fontSize: 'clamp(24px,3vw,42px)', fontWeight: 900, marginTop: 18, letterSpacing: '-0.025em', lineHeight: 1.15 }}>
                Protect Your<br /><span style={{ color: GOLD }}>Online Reputation</span>
              </h2>
              <p style={{ marginTop: 18, fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.72 }}>
                When customers provide low ratings, GETMORE redirects them to a private negative feedback form instead of sending them to Google Reviews.
              </p>
              <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  'Resolve issues privately',
                  'Prevent unnecessary negative reviews',
                  'Improve customer satisfaction',
                  'Protect business reputation',
                ].map(b => (
                  <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 8, background: `${GOLD}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: GOLD, fontSize: 13, fontWeight: 700 }}>✓</span>
                    </div>
                    <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.72)' }}>{b}</span>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: 32 }}>
                {[
                  { label: '4–5 Stars', bar: '100%', color: '#22c55e', action: 'Google Review Page' },
                  { label: '3 Stars', bar: '60%', color: GOLD, action: 'Private Feedback Form' },
                  { label: '1–2 Stars', bar: '35%', color: '#ef4444', action: 'Private Feedback Form' },
                ].map((r,i) => (
                  <div key={r.label} style={{ marginBottom: i<2 ? 22 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{'★'.repeat(i===0?5:i===1?3:2)} {r.label}</span>
                      <span style={{ fontSize: 11, color: r.color, fontWeight: 600 }}>→ {r.action}</span>
                    </div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} whileInView={{ width: r.bar }} transition={{ duration: 1.2, delay: i*0.2, ease: [0.22,1,0.36,1] }} viewport={{ once: true }} style={{ height: '100%', background: r.color, borderRadius: 99 }} />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 24, padding: '16px 20px', background: `${GOLD}0d`, border: `1px solid ${GOLD}28`, borderRadius: 14 }}>
                  <p style={{ fontSize: 13, color: GOLD, fontWeight: 700, marginBottom: 4 }}>Result</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>
                    Negative experiences stay private. Positive reviews go to Google. Your rating improves automatically.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ ANALYTICS & REPORTING ═════════════════════════════════ */}
      <Div /><section style={{ ...SEC, background: '#0c0c0c' }}>
        <div style={S}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <Label>Analytics &amp; Reporting</Label>
              <h2 style={{ fontSize: 'clamp(26px,3.4vw,46px)', fontWeight: 900, marginTop: 18, letterSpacing: '-0.025em' }}>
                Monitor Everything.<br /><span style={{ color: GOLD }}>Improve Constantly.</span>
              </h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
            {[
              { icon: '⭐', title: 'Google Reviews' },
              { icon: '💬', title: 'Private Feedback' },
              { icon: '👥', title: 'Customer Activity' },
              { icon: '🎯', title: 'Service Performance' },
              { icon: '📈', title: 'Conversion Rates' },
              { icon: '📅', title: 'Monthly Growth Trends' },
              { icon: '📱', title: 'QR Code Performance' },
              { icon: '📤', title: 'Export reports anytime.' },
            ].map((a,i) => (
              <Reveal key={a.title} delay={i*0.06}>
                <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '22px 16px', textAlign: 'center', transition: 'all 0.2s' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=`${GOLD}44`;e.currentTarget.style.transform='translateY(-4px)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.06)';e.currentTarget.style.transform='none'}}
                >
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{a.icon}</div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{a.title}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHO IS GETMORE FOR ════════════════════════════════════ */}
      <Div /><section style={{ ...SEC }}>
        <div style={S}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <Label>Who Is GETMORE For</Label>
              <h2 style={{ fontSize: 'clamp(26px,3.4vw,46px)', fontWeight: 900, marginTop: 18, letterSpacing: '-0.025em' }}>
                Perfect For <span style={{ color: GOLD }}>Every Local Business</span>
              </h2>
            </div>
          </Reveal>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {[
              '💇 Salons','🍽️ Restaurants','🏥 Clinics','🦷 Dental Practices',
              '💪 Gyms','🏡 Real Estate Agencies','📣 Marketing Agencies',
              '🛒 Retail Stores','⚙️ Service Businesses','🏢 Multi-Location Businesses',
            ].map((b,i) => (
              <Reveal key={b} delay={i*0.05}>
                <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 50, padding: '12px 22px', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.78)', transition: 'all 0.2s', cursor: 'default' }}
                  onMouseEnter={e=>{e.currentTarget.style.background=`${GOLD}14`;e.currentTarget.style.borderColor=`${GOLD}50`;e.currentTarget.style.color=GOLD}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#18181b';e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.color='rgba(255,255,255,0.78)'}}
                >{b}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHY BUSINESSES CHOOSE GETMORE ════════════════════════ */}
      <Div /><section style={{ ...SEC, background: '#0c0c0c' }}>
        <div style={S}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <Label>Why Businesses Choose GETMORE</Label>
              <h2 style={{ fontSize: 'clamp(26px,3.4vw,46px)', fontWeight: 900, marginTop: 18, letterSpacing: '-0.025em' }}>
                Built for <span style={{ color: GOLD }}>Results, Not Just Reviews</span>
              </h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 18 }}>
            {[
              { icon: '😊', title: 'Less Customer Effort' },
              { icon: '📈', title: 'Higher Review Conversion' },
              { icon: '🏆', title: 'Professional Review Collection' },
              { icon: '🤖', title: 'AI-Powered Review Suggestions' },
              { icon: '🛡️', title: 'Private Negative Feedback Protection' },
              { icon: '⚡', title: 'Simple Setup' },
              { icon: '📊', title: 'Powerful Analytics' },
              { icon: '🔧', title: 'Scalable For Growth' },
            ].map((w,i) => (
              <Reveal key={w.title} delay={i*0.07}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: '#18181b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 22px', transition: 'all 0.2s' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=`${GOLD}38`}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'}}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${GOLD}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{w.icon}</div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{w.title}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ═════════════════════════════════════════════ */}
      <Div /><section style={{ ...SEC }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <Reveal>
            <div className="cta-box" style={{ background: `linear-gradient(135deg,${GOLD}10 0%,${GOLD}05 100%)`, border: `1px solid ${GOLD}2a`, borderRadius: 28, padding: '72px 40px' }}>
              <Label>Get Started Today</Label>
              <h2 style={{ fontSize: 'clamp(26px,4vw,52px)', fontWeight: 900, marginTop: 20, letterSpacing: '-0.025em' }}>
                Ready To <span style={{ color: GOLD }}>GetMore Reviews?</span>
              </h2>
              <p style={{ marginTop: 16, fontSize: 17, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 480, margin: '16px auto 0' }}>
                Start collecting more Google reviews, improving customer trust, and growing your business with GETMORE.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
                <a href="#contact" style={{ display: 'inline-flex', alignItems: 'center', background: GOLD, color: DARK, fontWeight: 800, fontSize: 16, padding: '16px 36px', borderRadius: 14, textDecoration: 'none', boxShadow: `0 10px 32px ${GOLD}40`, transition: 'all 0.2s' }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 16px 40px ${GOLD}55`}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=`0 10px 32px ${GOLD}40`}}
                >Book a Demo →</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ CONTACT ═══════════════════════════════════════════════ */}
      <Div /><section id="contact" style={{ ...SEC, background: '#0c0c0c' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <Label>Contact Us</Label>
              <h2 style={{ fontSize: 'clamp(26px,3.4vw,46px)', fontWeight: 900, marginTop: 18, letterSpacing: '-0.025em' }}>
                Book a Demo with <span style={{ color: GOLD }}>GETMORE</span>
              </h2>
              <p style={{ marginTop: 14, fontSize: 16, color: 'rgba(255,255,255,0.52)', lineHeight: 1.7 }}>
                Fill in your details and our team will get back to you within 24 hours.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════ */}
      <footer className="ft-root">
        <div className="ft-inner">

          {/* ── Top: 4 columns ─────────────────────────────────── */}
          <div className="ft-cols">

            {/* Col 1 — Brand */}
            <div className="ft-brand">
              <img
                src="/getmore-logo.png"
                alt="GETMORE"
                draggable="false"
                className="ft-logo"
              />
              <p className="ft-tagline">
                GetMore Reviews. GetMore Customers.<br />
                GetMore Trust. GetMore Growth.
              </p>
            </div>

            {/* Col 2 — Products */}
            <div className="ft-col">
              <h4 className="ft-heading">Products</h4>
              <ul className="ft-list">
                {[['Features','#features'],['Pricing','#pricing'],['Contact','#contact']].map(([l,href]) => (
                  <li key={l}>
                    <a href={href} className="ft-link">{l}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 — Support */}
            <div className="ft-col">
              <h4 className="ft-heading">Support</h4>
              <ul className="ft-list">
                {[['Support','#'],['Privacy Policy','#'],['Terms of Service','#']].map(([l,href]) => (
                  <li key={l}>
                    <a href={href} className="ft-link">{l}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4 — Contact */}
            <div className="ft-col">
              <h4 className="ft-heading">Contact</h4>
              <ul className="ft-list">
                <li>
                  <a href="tel:+919876543210" className="ft-link ft-contact-item">
                    <Phone size={14} className="ft-icon" />
                    +91 98765 43210
                  </a>
                </li>
                <li>
                  <a href="mailto:dmaxworldwide@gmail.com" className="ft-link ft-contact-item">
                    <Mail size={14} className="ft-icon" />
                    dmaxworldwide@gmail.com
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* ── Divider ─────────────────────────────────────────── */}
          <div className="ft-divider" />

          {/* ── Bottom bar ──────────────────────────────────────── */}
          <div className="ft-bottom">
            <div className="ft-bottom-left">
              <span className="ft-copy">Copyright © GETMORE. All Rights Reserved.</span>
              <span className="ft-powered">Powered By <span className="ft-dmax">DMAX</span></span>
            </div>
            <div className="ft-bottom-right">
              {[['Privacy Policy','#'],['Terms of Service','#']].map(([l,href]) => (
                <a key={l} href={href} className="ft-link ft-legal">{l}</a>
              ))}
            </div>
          </div>

        </div>
      </footer>

      {/* ── Global styles ── */}
      <style>{`
        html{scroll-behavior:smooth}
        *{box-sizing:border-box;margin:0;padding:0}

        /* ════════════════════════════════════════════════════════
           NAVBAR
        ════════════════════════════════════════════════════════ */

        /* Fixed shell */
        .hdr-root {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          height: 72px;
          background: transparent;
          border-bottom: 1px solid transparent;
          transition: background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease;
        }
        .hdr-root.hdr-scrolled {
          background: rgba(17,17,17,0.95);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-color: rgba(255,255,255,0.07);
        }

        /* Inner container — max-width centred, equal horizontal padding */
        .hdr-inner {
          max-width: 1280px;
          height: 100%;
          margin: 0 auto;
          padding: 0 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
        }

        /* ── Logo wrap ── */
        .hdr-logo-wrap {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          text-decoration: none;
          outline-offset: 4px;
        }

        /* Width-based logo — height: auto preserves aspect ratio exactly */
        .hdr-logo {
          width: 130px;
          height: auto;
          object-fit: contain;
          display: block;
        }

        /* ── Centre nav ── */
        .hdr-nav {
          display: flex;
          align-items: center;
          gap: 32px;
          flex: 1;
          justify-content: center;
        }

        .hdr-nav-link {
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,255,255,0.60);
          text-decoration: none;
          white-space: nowrap;
          transition: color 0.18s;
        }
        .hdr-nav-link:hover { color: #FBBF24; }

        /* ── Right CTA group ── */
        .hdr-cta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        /* Sign In text link */
        .hdr-signin {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255,255,255,0.72);
          text-decoration: none;
          padding: 8px 14px;
          border-radius: 8px;
          white-space: nowrap;
          transition: color 0.18s, background 0.18s;
        }
        .hdr-signin:hover {
          color: #fff;
          background: rgba(255,255,255,0.06);
        }

        /* Book a Demo CTA */
        .hdr-demo {
          font-size: 14px;
          font-weight: 700;
          color: #111111;
          background: #FBBF24;
          padding: 10px 22px;
          border-radius: 10px;
          text-decoration: none;
          white-space: nowrap;
          transition: opacity 0.18s, transform 0.18s, box-shadow 0.18s;
          box-shadow: 0 4px 14px rgba(251,191,36,0.30);
        }
        .hdr-demo:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(251,191,36,0.40);
        }

        /* ── Tablet  768px – 1024px ── */
        @media (max-width: 1024px) {
          .hdr-inner {
            padding: 0 32px;
            gap: 20px;
          }
          .hdr-logo { width: 110px; }
          .hdr-nav  { gap: 24px; }
          .hdr-nav-link { font-size: 13px; }
        }

        /* ── Mobile  < 768px ── */
        @media (max-width: 767px) {
          .hdr-root  { height: 64px; }
          .hdr-inner { padding: 0 20px; gap: 12px; }
          .hdr-logo  { width: 90px; }

          /* Hide nav links — no hamburger in this design */
          .hdr-nav   { display: none; }

          /* Keep just Sign In + Demo on mobile */
          .hdr-signin { padding: 7px 10px; font-size: 13px; }
          .hdr-demo   { padding: 9px 16px; font-size: 13px; }
        }

        /* ── Small mobile  < 400px ── */
        @media (max-width: 399px) {
          .hdr-logo  { width: 80px; }
          /* Hide Sign In on very small screens — just the CTA */
          .hdr-signin { display: none; }
          .hdr-demo   { padding: 9px 14px; }
        }

        /* ════════════════════════════════════════════════════════
           SECTION RESPONSIVE FIXES
           Desktop unchanged. Only tablet/mobile overrides here.
        ════════════════════════════════════════════════════════ */

        /* ── Hero grid wrapper ── */
        .hero-grid-wrap {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }

        /* ── Stats strip ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        /* ── Private feedback 2-col ── */
        .two-col-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }

        /* ── Contact form ── */
        .contact-form {
          background: #18181b;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px;
          padding: 40px 36px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .contact-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        /* ════════════════════════════════════════════════════════
           TABLET  768px – 1024px
        ════════════════════════════════════════════════════════ */
        @media (max-width: 1024px) {
          /* Hero: stack vertically, dashboard below */
          .hero-section { padding: 110px 0 64px !important; }
          .hero-grid-wrap {
            grid-template-columns: 1fr;
            gap: 48px;
          }
          /* Stats: 2 per row */
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          /* Reputation section: stack */
          .two-col-grid { grid-template-columns: 1fr; gap: 40px; }
          /* Dashboard mockup: constrain width when stacked */
          .dash-mockup-wrap { max-width: 520px; margin: 0 auto; }
        }

        /* ════════════════════════════════════════════════════════
           MOBILE  < 768px
        ════════════════════════════════════════════════════════ */
        @media (max-width: 767px) {
          /* Section vertical padding — excluding hero which controls its own */
          section:not(.hero-section) { padding-top: 64px !important; padding-bottom: 64px !important; }
          /* Hero mobile: reduce top padding so content clears the 64px navbar */
          .hero-section { padding: 96px 0 56px !important; }

          /* Hero */
          .hero-grid-wrap { grid-template-columns: 1fr; gap: 40px; }

          /* Stats: 2 per row on 425+, 1 per row on 375- */
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }

          /* Reputation */
          .two-col-grid { grid-template-columns: 1fr; gap: 32px; }

          /* Contact form: full padding reduction */
          .contact-form { padding: 28px 20px; }
          .contact-form-grid { grid-template-columns: 1fr; }

          /* Dashboard: full width, no badges overflow */
          .dash-mockup-wrap { max-width: 100%; padding: 0; }
        }

        /* ════════════════════════════════════════════════════════
           SMALL MOBILE  < 480px
        ════════════════════════════════════════════════════════ */
        @media (max-width: 480px) {
          /* Stats: single column */
          .stats-grid { grid-template-columns: 1fr; }

          /* Tighten section padding */
          section:not(.hero-section) { padding-top: 52px !important; padding-bottom: 52px !important; }
          .hero-section { padding: 88px 0 48px !important; }

          /* Contact form full bleed */
          .contact-form { padding: 24px 16px; border-radius: 18px; }

          /* Final CTA box */
          .cta-box { padding: 48px 24px !important; }
        }

        /* Prevent any horizontal overflow globally */
        img { max-width: 100%; height: auto; }

        /* ════════════════════════════════════════════════════════
           FOOTER
        ════════════════════════════════════════════════════════ */

        /* Outer shell */
        .ft-root {
          background: #080808;
          border-top: 1px solid rgba(255,255,255,0.07);
        }

        /* Centred container — max 1280px, equal horizontal padding */
        .ft-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 72px 48px 36px;
        }

        /* ── 4-column grid ── */
        .ft-cols {
          display: grid;
          grid-template-columns: 1.8fr 1fr 1fr 1.4fr;
          gap: 48px;
          align-items: start;
          margin-bottom: 56px;
        }

        /* ── Brand column ── */
        .ft-brand {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        /* Logo — width-based sizing, aspect ratio preserved */
        .ft-logo {
          width: 150px;
          height: auto;
          object-fit: contain;
          display: block;
          margin-bottom: 24px;
          flex-shrink: 0;
        }

        /* Tagline */
        .ft-tagline {
          font-size: 14px;
          line-height: 1.75;
          color: rgba(255,255,255,0.42);
          margin: 0;
        }

        /* ── Link columns ── */
        .ft-col {
          display: flex;
          flex-direction: column;
        }

        /* Column heading */
        .ft-heading {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.11em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin: 0 0 20px 0;
          padding: 0;
          line-height: 1;
        }

        /* Link list */
        .ft-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        /* Individual link */
        .ft-link {
          font-size: 14px;
          color: rgba(255,255,255,0.48);
          text-decoration: none;
          transition: color 0.18s;
          display: inline-flex;
          align-items: center;
        }
        .ft-link:hover { color: #FBBF24; }

        /* Contact row — icon + text */
        .ft-contact-item {
          gap: 9px;
        }
        .ft-icon {
          flex-shrink: 0;
          opacity: 0.65;
          transition: opacity 0.18s;
        }
        .ft-link:hover .ft-icon { opacity: 1; }

        /* ── Divider ── */
        .ft-divider {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.07);
          margin-bottom: 28px;
        }

        /* ── Bottom bar ── */
        .ft-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .ft-bottom-left {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .ft-copy {
          font-size: 13px;
          color: rgba(255,255,255,0.26);
        }

        .ft-powered {
          font-size: 13px;
          color: rgba(255,255,255,0.26);
        }

        .ft-dmax {
          color: #FBBF24;
          font-weight: 700;
        }

        .ft-bottom-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .ft-legal {
          font-size: 13px;
          color: rgba(255,255,255,0.26);
        }
        .ft-legal:hover { color: #FBBF24; }

        /* ────────────────────────────────────────────────────────
           TABLET  768px – 1024px  →  2×2 grid
        ──────────────────────────────────────────────────────── */
        @media (max-width: 1024px) {
          .ft-inner {
            padding: 60px 32px 32px;
          }
          .ft-cols {
            grid-template-columns: 1fr 1fr;
            gap: 40px 48px;
          }
          .ft-logo {
            width: 130px;
          }
          .ft-brand {
            grid-column: 1 / -1;        /* brand spans full width on tablet */
            flex-direction: row;
            align-items: flex-start;
            gap: 40px;
            flex-wrap: wrap;
          }
          .ft-tagline {
            max-width: 360px;
            margin: 0;
            padding-top: 4px;
          }
        }

        /* ────────────────────────────────────────────────────────
           MOBILE  < 768px  →  single column, centred
        ──────────────────────────────────────────────────────── */
        @media (max-width: 767px) {
          .ft-inner {
            padding: 52px 24px 28px;
          }

          .ft-cols {
            grid-template-columns: 1fr;
            gap: 36px;
            margin-bottom: 44px;
          }

          /* Brand: centred on mobile */
          .ft-brand {
            flex-direction: column;
            align-items: center;
            text-align: center;
            grid-column: auto;
            gap: 0;
          }

          .ft-logo {
            width: 115px;
            margin-bottom: 20px;
          }

          .ft-tagline {
            max-width: 280px;
            text-align: center;
          }

          /* Link columns: centred */
          .ft-col {
            align-items: center;
            text-align: center;
          }

          .ft-list {
            align-items: center;
          }

          /* Contact items centred */
          .ft-contact-item {
            justify-content: center;
          }

          /* Bottom bar: stacked, centred */
          .ft-bottom {
            flex-direction: column;
            align-items: center;
            gap: 10px;
          }

          .ft-bottom-left {
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }

          .ft-bottom-right {
            gap: 20px;
          }
        }

        /* ── Process cards ─────────────────────────────────────── */

        /* Reveal wrapper must fill its grid cell */
        .process-card-wrap {
          height: 100%;
        }

        /* Card: flex column so description pushes to bottom uniformly */
        .process-card {
          position: relative;
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #18181b;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 28px 26px 30px;
          transition: border-color 0.2s, transform 0.2s;
          overflow: hidden;
        }

        /* Large ghost number — absolute so it never pushes content */
        .process-num {
          position: absolute;
          top: 20px;
          left: 22px;
          font-size: 72px;
          font-weight: 900;
          line-height: 1;
          color: rgba(251,191,36,0.10);
          user-select: none;
          pointer-events: none;
          letter-spacing: -0.04em;
        }

        /* Step badge — sits at a fixed top offset so all badges line up */
        .process-badge {
          position: relative;
          z-index: 1;
          margin-top: 72px;   /* matches ghost number height */
          margin-bottom: 16px;
          align-self: flex-start;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 30px;
          padding: 0 12px;
          border-radius: 8px;
          background: rgba(251,191,36,0.12);
          border: 1px solid rgba(251,191,36,0.22);
          white-space: nowrap;
        }
        .process-badge span {
          font-size: 12px;
          font-weight: 800;
          color: #FBBF24;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* Title — fixed font-size, no min-height tricks needed */
        .process-title {
          position: relative;
          z-index: 1;
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.3;
          margin-bottom: 10px;
        }

        /* Description — flex-grow so all cards share the same footer */
        .process-desc {
          position: relative;
          z-index: 1;
          flex: 1;
          font-size: 14px;
          color: rgba(255,255,255,0.50);
          line-height: 1.7;
          margin: 0;
        }

        /* Responsive: 3 → 2 → 1 columns */
        @media(max-width:960px){
          .process-grid{ grid-template-columns: repeat(2,1fr) !important; }
        }
        @media(max-width:580px){
          .process-grid{ grid-template-columns: 1fr !important; }
          .process-num { font-size: 56px; top: 16px; left: 18px; }
          .process-badge { margin-top: 58px; }
        }
      `}</style>
    </div>
  );
}
