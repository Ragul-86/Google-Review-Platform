import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

// ─── Brand constants ───────────────────────────────────────────────────────────
const CYCLE_WORDS = ['Customers.', 'Trust.', 'Growth.'];

// ─── Scroll-reveal hook ────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Animated Headline ─────────────────────────────────────────────────────────
function AnimatedHeadline() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % CYCLE_WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <div
      className="font-sora font-black tracking-tight select-none"
      style={{ fontWeight: 900, lineHeight: 1.06, fontSize: 'clamp(44px,6vw,88px)' }}
    >
      {/* Line 1 — fully white */}
      <div style={{ color: '#fff' }}>GetMore Reviews.</div>
      {/* Line 2 — full gold */}
      <div>
        <span style={{ color: '#FBBF24' }}>GetMore </span>
        <span
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            verticalAlign: 'bottom',
            lineHeight: 'inherit',
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={idx}
              initial={{ y: '110%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              exit={{ y: '-110%', opacity: 0 }}
              transition={{ duration: 0.48, ease: [0.42, 0, 0.58, 1] }}
              style={{ display: 'block', whiteSpace: 'nowrap', color: '#FBBF24' }}
            >
              {CYCLE_WORDS[idx]}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
    </div>
  );
}

// ─── Dashboard Mockup ──────────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div
      className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ background: '#111' }}>
        <span className="w-3 h-3 rounded-full bg-red-500" />
        <span className="w-3 h-3 rounded-full bg-yellow-400" />
        <span className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-4 text-xs text-white/40">GETMORE Dashboard</span>
      </div>
      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-3 p-4">
        {[
          { label: 'New Reviews', value: '248', delta: '+18%' },
          { label: 'Avg Rating', value: '4.9★', delta: '+0.3' },
          { label: 'Conversions', value: '63%', delta: '+11%' },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-3" style={{ background: '#27272a' }}>
            <p className="text-xs text-white/50 mb-1">{k.label}</p>
            <p className="text-xl font-bold text-white">{k.value}</p>
            <p className="text-xs font-semibold mt-1" style={{ color: '#FBBF24' }}>{k.delta}</p>
          </div>
        ))}
      </div>
      {/* Bar chart */}
      <div className="px-4 pb-4">
        <div className="rounded-xl p-4" style={{ background: '#27272a' }}>
          <p className="text-xs text-white/50 mb-3">Reviews This Week</p>
          <div className="flex items-end gap-2 h-20">
            {[40, 65, 50, 80, 70, 90, 75].map((h, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i === 5 ? '#FBBF24' : '#3f3f46' }} />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <span key={i} className="flex-1 text-center text-xs text-white/30">{d}</span>
            ))}
          </div>
        </div>
      </div>
      {/* Activity Feed */}
      <div className="px-4 pb-4 space-y-2">
        {[
          { name: 'Sarah M.', text: 'Amazing service! 5 stars ⭐', time: '2m ago' },
          { name: 'James T.', text: 'Very professional team', time: '14m ago' },
          { name: 'Priya K.', text: 'Would recommend to everyone!', time: '1h ago' },
        ].map(a => (
          <div key={a.name} className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: '#27272a' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: '#FBBF24', color: '#111' }}>
              {a.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{a.name}</p>
              <p className="text-xs text-white/50 truncate">{a.text}</p>
            </div>
            <span className="text-xs text-white/30 shrink-0">{a.time}</span>
          </div>
        ))}
      </div>
      {/* Floating badge */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="absolute top-16 -right-4 rounded-2xl px-4 py-2 text-sm font-bold shadow-xl"
        style={{ background: '#FBBF24', color: '#111' }}
      >
        +34 Reviews Today 🎉
      </motion.div>
    </div>
  );
}

// ─── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        height: 84,
        background: scrolled ? 'rgba(17,17,17,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <img
          src="/getmore-logo.png"
          alt="GETMORE"
          style={{ width: 200, height: 'auto' }}
          className="object-contain select-none"
          draggable="false"
        />
        <nav className="hidden md:flex items-center gap-8">
          {['Features', 'How It Works', 'Pricing', 'About'].map(item => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: 'rgba(255,255,255,0.7)' }}
              onMouseEnter={e => (e.target.style.color = '#FBBF24')}
              onMouseLeave={e => (e.target.style.color = 'rgba(255,255,255,0.7)')}
            >
              {item}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors duration-200"
            style={{ color: '#fff' }}
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="text-sm font-bold px-5 py-2 rounded-xl transition-all duration-200"
            style={{ background: '#FBBF24', color: '#111' }}
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── Main Landing Page ─────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div style={{ background: '#111111', color: '#fff', fontFamily: 'Sora, Inter, sans-serif' }}>
      <Navbar />

      {/* ── HERO ── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden pt-20"
        style={{ background: 'linear-gradient(135deg, #111111 0%, #1a1a1a 50%, #111111 100%)' }}
      >
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(251,191,36,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center w-full">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold mb-8"
                style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#FBBF24' }}
              >
                🚀 The #1 Google Review Platform for Local Businesses
              </div>
              <AnimatedHeadline />
              <p className="mt-6 text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 520 }}>
                Stop leaving 5-star reviews on the table. GETMORE automates your Google review collection,
                protects your reputation, and turns happy customers into powerful social proof — on autopilot.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-all duration-200 hover:scale-105"
                  style={{ background: '#FBBF24', color: '#111' }}
                >
                  Start Free Trial →
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-200"
                  style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
                >
                  See How It Works
                </a>
              </div>
              <div className="flex items-center gap-6 mt-8">
                {['No credit card required', 'Setup in 5 minutes', 'Cancel anytime'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <span style={{ color: '#FBBF24' }}>✓</span> {t}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="py-16" style={{ background: '#0d0d0d', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <p className="text-center text-sm font-semibold mb-10" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>
              TRUSTED BY BUSINESSES ACROSS INDUSTRIES
            </p>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { stat: '10,000+', label: 'Businesses Trust GETMORE' },
              { stat: '2.4M+', label: 'Reviews Collected' },
              { stat: '4.9★', label: 'Average Rating Achieved' },
              { stat: '340%', label: 'Average Review Increase' },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 0.1}>
                <div className="text-center">
                  <p className="text-3xl font-black" style={{ color: '#FBBF24' }}>{s.stat}</p>
                  <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className="py-24" id="about">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="text-4xl font-black mb-6" style={{ color: '#fff' }}>
              Your Competitors Are Winning on Google. <span style={{ color: '#FBBF24' }}>You Don't Have To Watch.</span>
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
              88% of consumers trust online reviews as much as personal recommendations. Yet most businesses collect
              reviews randomly, respond inconsistently, and lose customers to competitors with better ratings —
              even when their service is superior. GETMORE changes that equation permanently.
            </p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            {[
              { icon: '😤', problem: 'Customers leave happy but never leave a review', solution: 'Automated smart requests sent at the perfect moment' },
              { icon: '😰', problem: 'One bad review tanks your entire reputation', solution: 'Private feedback filter catches negatives before they go public' },
              { icon: '😴', problem: 'Manual follow-ups eat hours every week', solution: 'Set-and-forget automation runs 24/7 without you' },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.15}>
                <div className="rounded-2xl p-6 text-left" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-3xl mb-4">{item.icon}</div>
                  <p className="text-sm mb-3 font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>❌ {item.problem}</p>
                  <p className="text-sm font-semibold" style={{ color: '#FBBF24' }}>✅ {item.solution}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24" style={{ background: '#0d0d0d' }}>
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold mb-3" style={{ color: '#FBBF24', letterSpacing: '0.1em' }}>HOW IT WORKS</p>
              <h2 className="text-4xl font-black" style={{ color: '#fff' }}>
                3 Simple Steps to <span style={{ color: '#FBBF24' }}>Review Domination</span>
              </h2>
              <p className="mt-4 text-lg" style={{ color: 'rgba(255,255,255,0.55)', maxWidth: 520, margin: '16px auto 0' }}>
                No technical skills needed. No complicated setup. Just results.
              </p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Connect Your Business',
                desc: 'Link your Google Business Profile in under 2 minutes. Add your team, set your brand colours, and customise your review request messages.',
              },
              {
                step: '02',
                title: 'GETMORE Requests Reviews Automatically',
                desc: 'After every service or purchase, GETMORE sends perfectly timed review requests via WhatsApp, SMS, or email. Unhappy customers get redirected to private feedback.',
              },
              {
                step: '03',
                title: 'Watch Your Reputation Soar',
                desc: 'Track reviews in real-time, respond instantly with AI-suggested replies, and watch your Google ranking climb as your 5-star reviews pile up.',
              },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 0.15}>
                <div className="relative rounded-2xl p-8" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-5xl font-black mb-4" style={{ color: 'rgba(251,191,36,0.15)' }}>{s.step}</div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: '#fff' }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold mb-3" style={{ color: '#FBBF24', letterSpacing: '0.1em' }}>FEATURES</p>
              <h2 className="text-4xl font-black" style={{ color: '#fff' }}>
                Everything You Need to <span style={{ color: '#FBBF24' }}>Win on Google</span>
              </h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🤖', title: 'Smart Review Automation', desc: 'Automatically request reviews at the perfect moment — right after a great customer experience — via WhatsApp, SMS, or email.' },
              { icon: '🛡️', title: 'Reputation Protection', desc: 'Our intelligent feedback filter identifies unhappy customers and redirects them to private resolution before they post publicly.' },
              { icon: '📊', title: 'Real-Time Analytics', desc: 'Track your review velocity, response rates, sentiment trends, and competitor comparisons from a single powerful dashboard.' },
              { icon: '⚡', title: 'Instant Alerts & Responses', desc: 'Get notified the moment a new review lands. Respond instantly with AI-crafted replies that sound authentically human.' },
              { icon: '🎯', title: 'Multi-Location Management', desc: 'Manage reviews across all your locations from one central hub. Perfect for franchises, agencies, and multi-site businesses.' },
              { icon: '🔗', title: 'Seamless Integrations', desc: 'Connect with your existing tools — POS systems, CRMs, booking platforms, and more. GETMORE fits into your workflow, not the other way around.' },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 0.1}>
                <div className="rounded-2xl p-6 h-full" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24" style={{ background: '#0d0d0d' }}>
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold mb-3" style={{ color: '#FBBF24', letterSpacing: '0.1em' }}>RESULTS</p>
              <h2 className="text-4xl font-black" style={{ color: '#fff' }}>
                Real Businesses. <span style={{ color: '#FBBF24' }}>Real Results.</span>
              </h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: '"We went from 23 Google reviews to 340 in 90 days. Our phone hasn\'t stopped ringing since. GETMORE is the best investment we\'ve made."',
                name: 'Marcus T.',
                role: 'Owner, Elite Auto Detailing',
                stars: 5,
                result: '+1,378% reviews in 90 days',
              },
              {
                quote: '"I was sceptical at first. Then we went from 3.8 stars to 4.9 stars in 6 weeks. Now we show up first for every search in our area."',
                name: 'Priya S.',
                role: 'Director, Serenity Med Spa',
                stars: 5,
                result: '3.8★ → 4.9★ in 6 weeks',
              },
              {
                quote: '"Managing reviews for 12 locations used to be a nightmare. GETMORE made it effortless. Our overall rating went from 4.1 to 4.8 across the board."',
                name: 'James W.',
                role: 'Franchise Owner, 12 Locations',
                stars: 5,
                result: '4.1★ → 4.8★ across 12 locations',
              },
            ].map((t, i) => (
              <Reveal key={t.name} delay={i * 0.15}>
                <div className="rounded-2xl p-6 flex flex-col h-full" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex gap-1 mb-4">
                    {Array(t.stars).fill(null).map((_, j) => (
                      <span key={j} style={{ color: '#FBBF24' }}>★</span>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed flex-1 mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>{t.quote}</p>
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#fff' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{t.role}</p>
                    <div
                      className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold"
                      style={{ background: 'rgba(251,191,36,0.12)', color: '#FBBF24' }}
                    >
                      {t.result}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold mb-3" style={{ color: '#FBBF24', letterSpacing: '0.1em' }}>PRICING</p>
              <h2 className="text-4xl font-black" style={{ color: '#fff' }}>
                Simple, Transparent <span style={{ color: '#FBBF24' }}>Pricing</span>
              </h2>
              <p className="mt-4 text-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Start free. Scale as you grow. No hidden fees, ever.
              </p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Starter',
                price: 'Free',
                period: 'forever',
                desc: 'Perfect for getting started',
                features: ['1 Business Location', 'Up to 50 review requests/month', 'Basic analytics dashboard', 'Email support'],
                cta: 'Get Started Free',
                featured: false,
              },
              {
                name: 'Growth',
                price: '$49',
                period: '/month',
                desc: 'For growing businesses',
                features: ['3 Business Locations', 'Unlimited review requests', 'Advanced analytics & reporting', 'WhatsApp + SMS + Email', 'AI response suggestions', 'Priority support'],
                cta: 'Start 14-Day Free Trial',
                featured: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: 'pricing',
                desc: 'For agencies & franchises',
                features: ['Unlimited Locations', 'White-label solution', 'Custom integrations', 'Dedicated account manager', 'SLA guarantee', '24/7 phone support'],
                cta: 'Contact Sales',
                featured: false,
              },
            ].map((plan, i) => (
              <Reveal key={plan.name} delay={i * 0.1}>
                <div
                  className="rounded-2xl p-8 flex flex-col h-full"
                  style={{
                    background: plan.featured ? 'rgba(251,191,36,0.08)' : '#18181b',
                    border: plan.featured ? '2px solid #FBBF24' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {plan.featured && (
                    <div
                      className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 self-start"
                      style={{ background: '#FBBF24', color: '#111' }}
                    >
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-1" style={{ color: '#fff' }}>{plan.name}</h3>
                  <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>{plan.desc}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-black" style={{ color: plan.featured ? '#FBBF24' : '#fff' }}>{plan.price}</span>
                    <span className="text-sm ml-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{plan.period}</span>
                  </div>
                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        <span style={{ color: '#FBBF24', flexShrink: 0 }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/register"
                    className="block text-center py-3 rounded-xl font-bold text-sm transition-all duration-200"
                    style={
                      plan.featured
                        ? { background: '#FBBF24', color: '#111' }
                        : { border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }
                    }
                  >
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24" style={{ background: '#0d0d0d' }}>
        <div className="max-w-3xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold mb-3" style={{ color: '#FBBF24', letterSpacing: '0.1em' }}>FAQ</p>
              <h2 className="text-4xl font-black" style={{ color: '#fff' }}>
                Questions? <span style={{ color: '#FBBF24' }}>We've Got Answers.</span>
              </h2>
            </div>
          </Reveal>
          <div className="space-y-4">
            {[
              { q: 'Is this against Google\'s terms of service?', a: 'GETMORE is fully compliant with Google\'s review policies. We never pay for reviews, write fake reviews, or use any black-hat tactics. We simply make it easy for your genuine customers to share their real experiences.' },
              { q: 'How quickly will I see results?', a: 'Most businesses see their first new reviews within 24-48 hours of launching their first campaign. Significant rating improvements typically happen within 30-90 days, depending on your customer volume and current review baseline.' },
              { q: 'What happens to negative feedback?', a: 'Our private feedback filter intercepts unhappy customers before they post publicly. They\'re redirected to a private resolution form, giving you the chance to make things right. This dramatically reduces public negative reviews.' },
              { q: 'Do I need technical skills to set up GETMORE?', a: 'Zero technical skills required. If you can use a smartphone, you can set up GETMORE. Our guided onboarding takes under 5 minutes, and our support team is available to help every step of the way.' },
              { q: 'Can I manage multiple business locations?', a: 'Yes! GETMORE is built for multi-location businesses. Our Growth and Enterprise plans let you manage reviews across all your locations from one central dashboard, with individual reporting for each site.' },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <details
                  className="rounded-xl p-6 group"
                  style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <summary
                    className="font-semibold cursor-pointer list-none flex items-center justify-between"
                    style={{ color: '#fff' }}
                  >
                    {item.q}
                    <span style={{ color: '#FBBF24' }} className="ml-4 shrink-0">+</span>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {item.a}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <div
              className="rounded-3xl p-12"
              style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(251,191,36,0.04) 100%)', border: '1px solid rgba(251,191,36,0.2)' }}
            >
              <h2 className="text-4xl font-black mb-4" style={{ color: '#fff' }}>
                Ready to <span style={{ color: '#FBBF24' }}>GetMore</span> of Everything?
              </h2>
              <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 500, margin: '16px auto 32px' }}>
                Join 10,000+ businesses already using GETMORE to dominate their local Google rankings.
                Start your free trial today — no credit card required.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-all duration-200 hover:scale-105"
                  style={{ background: '#FBBF24', color: '#111' }}
                >
                  Start Free Trial — No Card Needed →
                </Link>
                <a
                  href="mailto:hello@getmore.app"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-200"
                  style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
                >
                  Talk to Sales
                </a>
              </div>
              <div className="flex justify-center gap-8 mt-8">
                {['Free 14-day trial', '10,000+ businesses trust us', 'Setup in 5 minutes'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    <span style={{ color: '#FBBF24' }}>✓</span> {t}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0d0d0d', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="md:col-span-1">
              <img
                src="/getmore-logo.png"
                alt="GETMORE"
                style={{ width: 240, height: 'auto' }}
                className="object-contain select-none mb-4"
                draggable="false"
              />
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                The world's most powerful Google review platform for local businesses.
              </p>
              <p className="text-sm font-bold" style={{ color: '#FBBF24' }}>Powered By DMAX</p>
            </div>
            {[
              {
                title: 'Product',
                links: ['Features', 'Pricing', 'Integrations', 'Changelog', 'Roadmap'],
              },
              {
                title: 'Company',
                links: ['About', 'Blog', 'Careers', 'Press', 'Contact'],
              },
              {
                title: 'Legal',
                links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'],
              },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-bold text-sm mb-4" style={{ color: '#fff' }}>{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map(link => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm transition-colors duration-200"
                        style={{ color: 'rgba(255,255,255,0.45)' }}
                        onMouseEnter={e => (e.target.style.color = '#FBBF24')}
                        onMouseLeave={e => (e.target.style.color = 'rgba(255,255,255,0.45)')}
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div
            className="flex flex-col md:flex-row items-center justify-between mt-12 pt-8"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
              © {new Date().getFullYear()} GETMORE. All rights reserved.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              {['Twitter', 'LinkedIn', 'Instagram', 'Facebook'].map(s => (
                <a
                  key={s}
                  href="#"
                  className="text-sm transition-colors duration-200"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                  onMouseEnter={e => (e.target.style.color = '#FBBF24')}
                  onMouseLeave={e => (e.target.style.color = 'rgba(255,255,255,0.35)')}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
