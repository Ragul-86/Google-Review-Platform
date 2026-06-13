import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────────────── */
const GOLD = '#FBBF24';
const DARK = '#111111';
const GREY = '#6B7280';
const CYCLE_WORDS = ['Customers.', 'Trust.', 'Growth.'];

/* ─────────────────────────────────────────────────────────────────────────────
   HOOKS
───────────────────────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────────────────────
   REVEAL WRAPPER
───────────────────────────────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, y = 28, className = '' }) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0px)' : `translateY(${y}px)`,
        transition: `opacity 0.65s cubic-bezier(.22,1,.36,1) ${delay}s, transform 0.65s cubic-bezier(.22,1,.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATED HEADLINE
───────────────────────────────────────────────────────────────────────────── */
function AnimatedHeadline() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % CYCLE_WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', fontSize: 'clamp(40px, 5.5vw, 80px)' }}>
      <div style={{ color: '#fff' }}>GetMore Reviews.</div>
      <div>
        <span style={{ color: GOLD }}>GetMore&nbsp;</span>
        <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', lineHeight: 'inherit' }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={idx}
              initial={{ y: '110%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              exit={{ y: '-110%', opacity: 0 }}
              transition={{ duration: 0.46, ease: [0.42, 0, 0.58, 1] }}
              style={{ display: 'block', whiteSpace: 'nowrap', color: GOLD }}
            >
              {CYCLE_WORDS[idx]}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DASHBOARD MOCKUP
───────────────────────────────────────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div style={{ position: 'relative' }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', inset: '-40px', borderRadius: 32,
        background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${GOLD}22 0%, transparent 70%)`,
        pointerEvents: 'none', zIndex: 0,
      }} />
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative', zIndex: 1,
          background: '#18181b',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(251,191,36,0.08)',
        }}
      >
        {/* Window bar */}
        <div style={{ background: '#0f0f0f', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>GETMORE Dashboard</span>
        </div>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, padding: '16px 16px 12px' }}>
          {[
            { label: 'New Reviews', value: '248', delta: '+18%', sub: 'This month' },
            { label: 'Avg Rating', value: '4.9★', delta: '+0.3', sub: 'vs last month' },
            { label: 'Conversions', value: '63%', delta: '+11%', sub: 'Request → Review' },
          ].map(k => (
            <div key={k.label} style={{ background: '#27272a', borderRadius: 12, padding: '14px 12px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>{k.label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{k.value}</p>
              <p style={{ fontSize: 10, color: GOLD, fontWeight: 600, marginTop: 4 }}>{k.delta} <span style={{ color: 'rgba(255,255,255,0.3)' }}>{k.sub}</span></p>
            </div>
          ))}
        </div>
        {/* Chart */}
        <div style={{ margin: '0 16px 12px', background: '#27272a', borderRadius: 12, padding: '14px 12px', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Reviews This Week</p>
            <span style={{ fontSize: 10, color: GOLD, background: `${GOLD}18`, padding: '2px 8px', borderRadius: 99 }}>Live</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64 }}>
            {[42, 58, 47, 76, 65, 88, 70].map((h, i) => (
              <div key={i} style={{ flex: 1, borderRadius: '4px 4px 0 0', height: `${h}%`, background: i === 5 ? GOLD : '#3f3f46', transition: 'all 0.3s' }} />
            ))}
          </div>
          <div style={{ display: 'flex', marginTop: 4 }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{d}</span>
            ))}
          </div>
        </div>
        {/* Activity */}
        <div style={{ margin: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { name: 'Sarah M.', text: '★★★★★ Amazing service! Highly recommended.', time: '2m' },
            { name: 'James T.', text: '★★★★★ Very professional and friendly team.', time: '14m' },
            { name: 'Priya K.', text: '★★★★★ Would recommend to everyone!', time: '1h' },
          ].map(a => (
            <div key={a.name} style={{ background: '#27272a', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: DARK, flexShrink: 0 }}>{a.name[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.text}</p>
              </div>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{a.time}</span>
            </div>
          ))}
        </div>
      </motion.div>
      {/* Floating badge */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: 40, right: -24, zIndex: 2,
          background: GOLD, color: DARK, borderRadius: 14,
          padding: '10px 16px', fontWeight: 800, fontSize: 13,
          boxShadow: `0 8px 24px ${GOLD}44`,
        }}
      >
        +34 Reviews Today 🎉
      </motion.div>
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 1 }}
        style={{
          position: 'absolute', bottom: 60, left: -28, zIndex: 2,
          background: '#1a1a1a', color: '#fff', borderRadius: 14,
          padding: '10px 14px', fontWeight: 700, fontSize: 12,
          border: `1px solid ${GOLD}44`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        ⭐ Rating: 4.9 / 5.0
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  const navLinks = ['Features', 'How It Works', 'Pricing', 'About'];
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 72,
      background: scrolled ? 'rgba(17,17,17,0.96)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src="/getmore-logo.png" alt="GETMORE" style={{ width: 180, height: 'auto', objectFit: 'contain' }} draggable="false" />
        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="desktop-nav">
          {navLinks.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}
              style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = GOLD}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.65)'}
            >{l}</a>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/login" style={{ fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none', padding: '8px 16px' }}>Sign In</Link>
          <Link to="/register" style={{
            fontSize: 14, fontWeight: 700, color: DARK, background: GOLD,
            padding: '10px 22px', borderRadius: 10, textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.target.style.opacity = '0.85'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >
            Start Free Trial
          </Link>
        </div>
      </div>
      <style>{`
        @media(max-width:768px){.desktop-nav{display:none!important}}
        *{box-sizing:border-box}
      `}</style>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION LABEL
───────────────────────────────────────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
      color: GOLD, background: `${GOLD}14`, border: `1px solid ${GOLD}30`,
      padding: '5px 14px', borderRadius: 99,
    }}>
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   LANDING PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function Landing() {
  return (
    <div style={{ background: DARK, color: '#fff', fontFamily: "'Inter', 'Sora', system-ui, sans-serif", overflowX: 'hidden' }}>
      <Navbar />

      {/* ══════════════════════════════════════════════════════ HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        padding: '120px 0 80px',
        background: `linear-gradient(135deg, #111 0%, #161616 50%, #111 100%)`,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* BG radials */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-20%', left: '30%', width: 700, height: 700, borderRadius: '50%', background: `${GOLD}0a`, filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', bottom: '-10%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: `${GOLD}07`, filter: 'blur(60px)' }} />
        </div>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', position: 'relative', zIndex: 1, width: '100%' }}>
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            {/* Badge */}
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>✦ AI-Powered Google Review Growth Platform</SectionLabel>
            </div>
            <AnimatedHeadline />
            <p style={{ marginTop: 24, fontSize: 17, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', maxWidth: 520 }}>
              GETMORE helps businesses collect more Google reviews through AI-powered review suggestions,
              WhatsApp automated review requests, QR codes, private feedback collection, and real-time analytics.
            </p>
            <div style={{ display: 'flex', gap: 14, marginTop: 36, flexWrap: 'wrap' }}>
              <Link to="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: GOLD, color: DARK, fontWeight: 800, fontSize: 15,
                padding: '14px 30px', borderRadius: 12, textDecoration: 'none',
                boxShadow: `0 8px 24px ${GOLD}40`, transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 14px 32px ${GOLD}55`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 8px 24px ${GOLD}40`; }}
              >
                Start Free Trial →
              </Link>
              <a href="#how-it-works" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                border: '1px solid rgba(255,255,255,0.18)', color: '#fff',
                fontWeight: 600, fontSize: 15, padding: '14px 28px', borderRadius: 12, textDecoration: 'none',
                transition: 'border-color 0.2s, background 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = `${GOLD}0d`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.background = 'transparent'; }}
              >
                Book Demo
              </a>
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 28, flexWrap: 'wrap' }}>
              {['No credit card required', '5-minute setup', 'Cancel anytime'].map(t => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                  <span style={{ color: GOLD, fontSize: 14 }}>✓</span> {t}
                </span>
              ))}
            </div>
          </motion.div>
          {/* Dashboard */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingRight: 24 }}>
            <div style={{ width: '100%', maxWidth: 480 }}>
              <DashboardMockup />
            </div>
          </div>
        </div>
        <style>{`@media(max-width:900px){.hero-grid{grid-template-columns:1fr!important}}`}</style>
      </section>

      {/* ══════════════════════════════════════════════════════ STATS STRIP */}
      <section style={{ background: '#0d0d0d', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '36px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
          {[
            { v: '10,000+', l: 'Businesses Worldwide' },
            { v: '2.4M+', l: 'Reviews Collected' },
            { v: '4.9★', l: 'Average Rating Achieved' },
            { v: '340%', l: 'Avg Review Increase' },
          ].map((s, i) => (
            <Reveal key={s.l} delay={i * 0.08}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 28, fontWeight: 900, color: GOLD, lineHeight: 1 }}>{s.v}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{s.l}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ WHY GETMORE */}
      <section id="about" style={{ padding: '96px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <SectionLabel>Why GETMORE</SectionLabel>
              <h2 style={{ fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 900, marginTop: 16, letterSpacing: '-0.02em' }}>
                Turn Every Customer Into A<br /><span style={{ color: GOLD }}>Review Opportunity</span>
              </h2>
              <p style={{ marginTop: 16, fontSize: 16, color: 'rgba(255,255,255,0.55)', maxWidth: 580, margin: '16px auto 0', lineHeight: 1.7 }}>
                Most happy customers never leave a review because it takes too much effort. GETMORE removes the friction
                by generating ready-to-use review suggestions that customers can copy and post in seconds.
              </p>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
            {[
              { icon: '⭐', title: 'Increase Google Reviews', desc: 'Consistent automated requests drive more reviews than any manual process.' },
              { icon: '✍️', title: 'Avoid One-Word Reviews', desc: 'AI generates detailed, natural review text customers are proud to post.' },
              { icon: '📈', title: 'Improve Local SEO Rankings', desc: 'More reviews and higher ratings push you to the top of local search.' },
              { icon: '🤝', title: 'Build Customer Trust', desc: 'Social proof from real reviews converts browsing visitors into paying customers.' },
              { icon: '🛡️', title: 'Protect Online Reputation', desc: 'Private feedback intercepts unhappy customers before they post publicly.' },
              { icon: '📊', title: 'Track Review Performance', desc: 'Real-time dashboards reveal what's working and where to improve.' },
              { icon: '🚀', title: 'Grow Business Visibility', desc: 'Dominate your local market with consistently strong Google ratings.' },
            ].map((b, i) => (
              <Reveal key={b.title} delay={i * 0.07}>
                <div style={{
                  background: '#18181b', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16, padding: '24px', height: '100%',
                  transition: 'border-color 0.2s, transform 0.2s',
                  cursor: 'default',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${GOLD}40`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{b.icon}</div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{b.title}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{b.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ HOW IT WORKS */}
      <section id="how-it-works" style={{ padding: '96px 0', background: '#0d0d0d' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <SectionLabel>How It Works</SectionLabel>
              <h2 style={{ fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 900, marginTop: 16, letterSpacing: '-0.02em' }}>
                From Customer Visit to<br /><span style={{ color: GOLD }}>Google Review in 6 Steps</span>
              </h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
            {[
              { step: '01', title: 'Add Customer', desc: 'Capture customer name, phone number, and service provided. Keep everything organised in one place.' },
              { step: '02', title: 'Send Review Request', desc: 'Send personalised review requests directly through WhatsApp — no app download required for the customer.' },
              { step: '03', title: 'Customer Selects Service', desc: 'Customers tap the service they received from a simple, mobile-friendly interface.' },
              { step: '04', title: 'AI Generates Review Suggestions', desc: 'GETMORE instantly generates multiple professional review suggestions tailored to the selected service.' },
              { step: '05', title: 'Customer Posts Review', desc: 'One tap copies the review and redirects directly to the Google Review page — frictionless submission.' },
              { step: '06', title: 'Track Performance', desc: 'Monitor reviews, feedback, conversions, and customer activity from one real-time dashboard.' },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 0.1}>
                <div style={{
                  background: '#18181b', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 20, padding: '32px 28px', position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ fontSize: 56, fontWeight: 900, color: `${GOLD}18`, lineHeight: 1, marginBottom: 16, userSelect: 'none' }}>{s.step}</div>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${GOLD}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: GOLD }}>{s.step}</span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>{s.desc}</p>
                  {/* Connector dot */}
                  {i < 5 && <div style={{ position: 'absolute', bottom: -2, right: 28, width: 8, height: 8, borderRadius: '50%', background: `${GOLD}60` }} />}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ FEATURES */}
      <section id="features" style={{ padding: '96px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <SectionLabel>Features</SectionLabel>
              <h2 style={{ fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 900, marginTop: 16, letterSpacing: '-0.02em' }}>
                Everything You Need to<br /><span style={{ color: GOLD }}>Dominate Google Reviews</span>
              </h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
            {[
              { icon: '🤖', title: 'AI Review Suggestions', desc: 'Generate natural, professional review suggestions based on services and customer experiences. Customers pick one and post in seconds.' },
              { icon: '💬', title: 'WhatsApp Automation', desc: 'Send personalised review requests directly to customers through WhatsApp — the highest-open-rate channel available.' },
              { icon: '📱', title: 'QR Code Reviews', desc: 'Allow customers to leave reviews instantly by scanning a QR code at your location. Zero friction, maximum conversions.' },
              { icon: '🛡️', title: 'Private Negative Feedback', desc: 'Redirect unhappy customers to a private feedback form instead of Google. Resolve issues privately, protect your public rating.' },
              { icon: '📊', title: 'Review Analytics', desc: 'Track review growth, customer responses, conversion rates, and business performance from a single real-time dashboard.' },
              { icon: '👥', title: 'Customer Management', desc: 'Store customer details, services received, review status, and full communication history in one organised place.' },
              { icon: '🏢', title: 'Multi-Business Management', desc: 'Manage multiple businesses and locations from a single dashboard — perfect for agencies, franchises, and multi-site owners.' },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 0.07}>
                <div style={{
                  background: '#18181b', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 20, padding: '28px 24px',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${GOLD}40`; e.currentTarget.style.background = '#1c1c1f'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = '#18181b'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${GOLD}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ CUSTOMER JOURNEY */}
      <section style={{ padding: '96px 0', background: '#0d0d0d' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <SectionLabel>Customer Journey</SectionLabel>
              <h2 style={{ fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 900, marginTop: 16, letterSpacing: '-0.02em' }}>
                The <span style={{ color: GOLD }}>GETMORE</span> Review Flow
              </h2>
            </div>
          </Reveal>
          <div style={{ position: 'relative' }}>
            {[
              { icon: '🏪', label: 'Customer Visits Business' },
              { icon: '💬', label: 'WhatsApp Review Request Sent / Scan QR Code' },
              { icon: '🎯', label: 'Service Selected' },
              { icon: '🤖', label: 'AI Review Generated' },
              { icon: '📋', label: 'Review Copied' },
              { icon: '⭐', label: 'Google Review Submitted' },
              { icon: '🎉', label: 'Thank You Page' },
              { icon: '✅', label: 'Review Collection Completed' },
            ].map((step, i, arr) => (
              <Reveal key={step.label} delay={i * 0.08}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: i < arr.length - 1 ? 0 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 16,
                      background: i === arr.length - 1 ? GOLD : '#27272a',
                      border: `1px solid ${i === arr.length - 1 ? GOLD : 'rgba(255,255,255,0.08)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, position: 'relative', zIndex: 1,
                    }}>
                      {step.icon}
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{ width: 2, height: 32, background: `linear-gradient(to bottom, ${GOLD}50, ${GOLD}18)`, margin: '2px 0' }} />
                    )}
                  </div>
                  <div style={{
                    flex: 1, background: '#18181b',
                    border: `1px solid ${i === arr.length - 1 ? `${GOLD}40` : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: 14, padding: '16px 20px',
                    marginBottom: i < arr.length - 1 ? 4 : 0,
                  }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: i === arr.length - 1 ? GOLD : '#fff' }}>{step.label}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ PRIVATE FEEDBACK */}
      <section style={{ padding: '96px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <Reveal>
              <SectionLabel>🛡️ Reputation Protection</SectionLabel>
              <h2 style={{ fontSize: 'clamp(26px,3vw,44px)', fontWeight: 900, marginTop: 16, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                Protect Your<br /><span style={{ color: GOLD }}>Online Reputation</span>
              </h2>
              <p style={{ marginTop: 20, fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                When customers provide low ratings, GETMORE redirects them to a private negative feedback form
                instead of sending them to Google Reviews. Your public rating stays protected while you resolve
                issues directly.
              </p>
              <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  'Resolve Issues Privately Before They Go Public',
                  'Prevent Unnecessary Negative Reviews on Google',
                  'Improve Customer Satisfaction Through Direct Resolution',
                  'Protect Your Business Reputation Long-Term',
                ].map(b => (
                  <div key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ color: GOLD, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{b}</span>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: 32 }}>
                {/* Funnel visual */}
                {[
                  { label: '⭐⭐⭐⭐⭐  4–5 Stars', color: '#22c55e', action: '→ Google Review Page', w: '100%' },
                  { label: '⭐⭐⭐  3 Stars', color: GOLD, action: '→ Private Feedback Form', w: '65%' },
                  { label: '⭐⭐  1–2 Stars', color: '#ef4444', action: '→ Private Feedback Form', w: '40%' },
                ].map((row, i) => (
                  <div key={row.label} style={{ marginBottom: i < 2 ? 20 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{row.label}</span>
                      <span style={{ fontSize: 12, color: row.color, fontWeight: 600 }}>{row.action}</span>
                    </div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: row.w }}
                        transition={{ duration: 1.2, delay: i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                        viewport={{ once: true }}
                        style={{ height: '100%', background: row.color, borderRadius: 99 }}
                      />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 28, padding: '16px 20px', background: `${GOLD}10`, border: `1px solid ${GOLD}25`, borderRadius: 14 }}>
                  <p style={{ fontSize: 13, color: GOLD, fontWeight: 700, marginBottom: 4 }}>Result</p>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                    Negative experiences stay private. Positive reviews go to Google. Your rating improves automatically.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ ANALYTICS */}
      <section style={{ padding: '96px 0', background: '#0d0d0d' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <SectionLabel>Analytics & Reporting</SectionLabel>
              <h2 style={{ fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 900, marginTop: 16, letterSpacing: '-0.02em' }}>
                Monitor Everything.<br /><span style={{ color: GOLD }}>Improve Constantly.</span>
              </h2>
              <p style={{ marginTop: 16, fontSize: 16, color: 'rgba(255,255,255,0.5)', maxWidth: 500, margin: '16px auto 0' }}>
                One dashboard to track everything that matters for your Google review strategy.
              </p>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
            {[
              { icon: '⭐', metric: 'Google Reviews', desc: 'Total count & growth trend' },
              { icon: '💬', metric: 'Private Feedback', desc: 'Volume & resolution rate' },
              { icon: '👥', metric: 'Customer Activity', desc: 'Requests sent & opened' },
              { icon: '🎯', metric: 'Service Performance', desc: 'Reviews per service type' },
              { icon: '📈', metric: 'Conversion Rates', desc: 'Request to review ratio' },
              { icon: '📅', metric: 'Monthly Growth Trends', desc: 'Month-over-month tracking' },
              { icon: '📱', metric: 'QR Code Performance', desc: 'Scans & conversions' },
              { icon: '📤', metric: 'Export Reports', desc: 'Download anytime as Excel' },
            ].map((a, i) => (
              <Reveal key={a.metric} delay={i * 0.06}>
                <div style={{
                  background: '#18181b', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16, padding: '22px 18px', textAlign: 'center',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${GOLD}40`; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{a.icon}</div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{a.metric}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{a.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ WHO IS IT FOR */}
      <section style={{ padding: '96px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <SectionLabel>Who Is GETMORE For</SectionLabel>
              <h2 style={{ fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 900, marginTop: 16, letterSpacing: '-0.02em' }}>
                Perfect For <span style={{ color: GOLD }}>Every Local Business</span>
              </h2>
            </div>
          </Reveal>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {[
              '💇 Salons', '🍽️ Restaurants', '🏥 Clinics', '🦷 Dental Practices',
              '💪 Gyms', '🏡 Real Estate Agencies', '📣 Marketing Agencies',
              '🛒 Retail Stores', '⚙️ Service Businesses', '🏢 Multi-Location Businesses',
            ].map((b, i) => (
              <Reveal key={b} delay={i * 0.05}>
                <div style={{
                  background: '#18181b', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 50, padding: '12px 22px',
                  fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)',
                  transition: 'all 0.2s', cursor: 'default',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}14`; e.currentTarget.style.borderColor = `${GOLD}50`; e.currentTarget.style.color = GOLD; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#18181b'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                >
                  {b}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ WHY CHOOSE */}
      <section style={{ padding: '96px 0', background: '#0d0d0d' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <SectionLabel>Why Businesses Choose GETMORE</SectionLabel>
              <h2 style={{ fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 900, marginTop: 16, letterSpacing: '-0.02em' }}>
                Built for <span style={{ color: GOLD }}>Results, Not Just Reviews</span>
              </h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 18 }}>
            {[
              { icon: '😊', title: 'Less Customer Effort', desc: 'AI-generated suggestions mean customers spend seconds, not minutes, leaving a review.' },
              { icon: '📈', title: 'Higher Review Conversion', desc: 'Automated follow-ups at the right moment convert more satisfied customers into reviewers.' },
              { icon: '🏆', title: 'Professional Review Collection', desc: 'Look polished and trustworthy with branded, seamless review request experiences.' },
              { icon: '🤖', title: 'AI-Powered Suggestions', desc: 'No more one-word reviews. GETMORE generates rich, detailed text that Google loves.' },
              { icon: '🛡️', title: 'Private Feedback Protection', desc: 'Prevent public negative reviews by catching unhappy customers before they post.' },
              { icon: '⚡', title: 'Simple Setup', desc: 'Connect your Google Business Profile and start collecting reviews in under 5 minutes.' },
              { icon: '📊', title: 'Powerful Analytics', desc: 'Know exactly what's working with real-time dashboards and exportable reports.' },
              { icon: '🔧', title: 'Scalable for Growth', desc: 'Manage one location or one hundred — GETMORE scales with your business.' },
            ].map((w, i) => (
              <Reveal key={w.title} delay={i * 0.07}>
                <div style={{
                  display: 'flex', gap: 16, alignItems: 'flex-start',
                  background: '#18181b', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16, padding: '22px',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${GOLD}35`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                >
                  <div style={{ fontSize: 26, flexShrink: 0 }}>{w.icon}</div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{w.title}</h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{w.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ FINAL CTA */}
      <section style={{ padding: '96px 0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <Reveal>
            <div style={{
              background: `linear-gradient(135deg, ${GOLD}12 0%, ${GOLD}06 100%)`,
              border: `1px solid ${GOLD}28`,
              borderRadius: 28, padding: '72px 48px',
            }}>
              <SectionLabel>Get Started Today</SectionLabel>
              <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900, marginTop: 20, letterSpacing: '-0.02em' }}>
                Ready To <span style={{ color: GOLD }}>GetMore Reviews?</span>
              </h2>
              <p style={{ marginTop: 16, fontSize: 17, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 520, margin: '16px auto 0' }}>
                Start collecting more Google reviews, improving customer trust, and growing your business with GETMORE.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
                <Link to="/register" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: GOLD, color: DARK, fontWeight: 800, fontSize: 16,
                  padding: '16px 36px', borderRadius: 14, textDecoration: 'none',
                  boxShadow: `0 10px 30px ${GOLD}40`, transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 16px 40px ${GOLD}55`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 10px 30px ${GOLD}40`; }}
                >
                  Start Free Trial →
                </Link>
                <a href="#how-it-works" style={{
                  display: 'inline-flex', alignItems: 'center',
                  border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
                  fontWeight: 600, fontSize: 16, padding: '16px 32px', borderRadius: 14, textDecoration: 'none',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = `${GOLD}0d`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  Book Demo
                </a>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 28, flexWrap: 'wrap' }}>
                {['No credit card required', 'Setup in 5 minutes', 'Cancel anytime'].map(t => (
                  <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                    <span style={{ color: GOLD }}>✓</span> {t}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a', padding: '64px 0 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
            {/* Brand col */}
            <div>
              <img src="/getmore-logo.png" alt="GETMORE" style={{ width: 220, height: 'auto', objectFit: 'contain', marginBottom: 16 }} draggable="false" />
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 16, maxWidth: 280 }}>
                GetMore Reviews. GetMore Customers. GetMore Trust. GetMore Growth.
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>Powered By DMAX</p>
            </div>
            {[
              { title: 'Products', links: ['Features', 'Pricing', 'Integrations', 'Changelog', 'Roadmap'] },
              { title: 'Support', links: ['Documentation', 'Help Center', 'Contact Us', 'Status'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms Of Service', 'Cookie Policy', 'GDPR'] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>{col.title}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(l => (
                    <li key={l}>
                      <a href="#" style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.target.style.color = GOLD}
                        onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.45)'}
                      >{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
              Copyright © {new Date().getFullYear()} GETMORE. All Rights Reserved.
            </p>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Privacy Policy', 'Terms Of Service'].map(l => (
                <a key={l} href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = GOLD}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.3)'}
                >{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Global responsive ── */}
      <style>{`
        @media(max-width:900px){
          section > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          footer > div > div[style*="grid-template-columns: 2fr"] { grid-template-columns: 1fr !important; }
          section > div > div[style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media(max-width:600px){
          section > div > div[style*="grid-template-columns: repeat(4"] { grid-template-columns: 1fr !important; }
          section > div > div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
        }
        html { scroll-behavior: smooth; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #111; }
      `}</style>
    </div>
  );
}
