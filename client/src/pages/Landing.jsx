import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, BarChart3, Star, Zap, MapPin, Bell, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Brand ────────────────────────────────────────────────────────────────────
const CYCLE_WORDS = ['Customers.', 'Trust.', 'Growth.'];

// ─── Scroll-reveal ────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
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

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Animated Headline ────────────────────────────────────────────────────────
function AnimatedHeadline() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % CYCLE_WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <h1
      className="font-bold tracking-tight"
      style={{ fontSize: 'clamp(36px,5vw,72px)', lineHeight: 1.08, fontWeight: 800 }}
    >
      {/* Line 1 — foreground */}
      <span className="block text-foreground">GetMore Reviews.</span>
      {/* Line 2 — gold */}
      <span className="block" style={{ color: '#D97706' }}>
        GetMore{' '}
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
              style={{ display: 'block', whiteSpace: 'nowrap', color: '#D97706' }}
            >
              {CYCLE_WORDS[idx]}
            </motion.span>
          </AnimatePresence>
        </span>
      </span>
    </h1>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">

      {/* ── HEADER ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          height: 64,
          background: scrolled ? 'hsl(var(--background)/0.95)' : 'hsl(var(--background))',
          backdropFilter: scrolled ? 'blur(10px)' : 'none',
          borderBottom: scrolled ? '1px solid hsl(var(--border))' : '1px solid transparent',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <img
            src="/getmore-logo.png"
            alt="GETMORE"
            style={{ width: 160, height: 'auto' }}
            className="object-contain select-none"
            draggable="false"
          />
          <nav className="hidden md:flex items-center gap-6">
            {['Features', 'How It Works', 'Pricing'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" style={{ background: '#D97706', color: '#fff', border: 'none' }}>
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <main className="flex-1 pt-16">
        <section className="flex flex-col items-center justify-center px-4 text-center py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-8 border"
              style={{
                background: 'hsl(43 96% 56% / 0.1)',
                borderColor: 'hsl(43 96% 56% / 0.3)',
                color: '#D97706',
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              The #1 Google Review Platform for Local Businesses
            </div>

            <AnimatedHeadline />

            <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Stop leaving 5-star reviews on the table. GETMORE automates your Google review collection,
              protects your reputation, and turns happy customers into powerful social proof — on autopilot.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/register">
                <Button size="lg" className="px-8 gap-2" style={{ background: '#D97706', color: '#fff', border: 'none' }}>
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="px-8">
                  See How It Works
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-6 mt-6">
              {['No credit card required', 'Setup in 5 minutes', 'Cancel anytime'].map(t => (
                <span key={t} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Check className="h-3.5 w-3.5" style={{ color: '#D97706' }} /> {t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Stats row */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl w-full">
            {[
              { stat: '10,000+', label: 'Businesses Trust GETMORE' },
              { stat: '2.4M+', label: 'Reviews Collected' },
              { stat: '4.9★', label: 'Avg Rating Achieved' },
              { stat: '340%', label: 'Avg Review Increase' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="border rounded-xl p-5 bg-card text-center"
              >
                <p className="text-2xl font-bold" style={{ color: '#D97706' }}>{s.stat}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="py-20 border-t">
          <div className="max-w-5xl mx-auto px-6">
            <Reveal>
              <div className="text-center mb-14">
                <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#D97706' }}>How It Works</p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">3 Simple Steps to Review Domination</h2>
                <p className="mt-3 text-muted-foreground max-w-lg mx-auto">No technical skills needed. No complicated setup. Just results.</p>
              </div>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: '01',
                  title: 'Connect Your Business',
                  desc: 'Link your Google Business Profile in under 2 minutes. Add your team, set your brand colours, and customise your review request messages.',
                },
                {
                  step: '02',
                  title: 'GETMORE Requests Reviews Automatically',
                  desc: 'After every service, GETMORE sends perfectly timed review requests via WhatsApp, SMS, or email. Unhappy customers get redirected to private feedback.',
                },
                {
                  step: '03',
                  title: 'Watch Your Reputation Soar',
                  desc: 'Track reviews in real-time, respond with AI-suggested replies, and watch your Google ranking climb as 5-star reviews pile up.',
                },
              ].map((s, i) => (
                <Reveal key={s.step} delay={i * 0.12}>
                  <div className="border rounded-xl p-6 bg-card h-full">
                    <p className="text-4xl font-black mb-4" style={{ color: 'hsl(43 96% 56% / 0.25)' }}>{s.step}</p>
                    <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="py-20 border-t">
          <div className="max-w-5xl mx-auto px-6">
            <Reveal>
              <div className="text-center mb-14">
                <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#D97706' }}>Features</p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">Everything You Need to Win on Google</h2>
              </div>
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: <Zap className="h-5 w-5" />, title: 'Smart Review Automation', desc: 'Automatically request reviews at the perfect moment — right after a great customer experience — via WhatsApp, SMS, or email.' },
                { icon: <ShieldCheck className="h-5 w-5" />, title: 'Reputation Protection', desc: 'Our intelligent feedback filter identifies unhappy customers and redirects them to private resolution before they post publicly.' },
                { icon: <BarChart3 className="h-5 w-5" />, title: 'Real-Time Analytics', desc: 'Track your review velocity, response rates, sentiment trends, and competitor comparisons from one powerful dashboard.' },
                { icon: <Bell className="h-5 w-5" />, title: 'Instant Alerts & Responses', desc: 'Get notified the moment a new review lands. Respond instantly with AI-crafted replies that sound authentically human.' },
                { icon: <MapPin className="h-5 w-5" />, title: 'Multi-Location Management', desc: 'Manage reviews across all your locations from one central hub. Perfect for franchises, agencies, and multi-site businesses.' },
                { icon: <Sparkles className="h-5 w-5" />, title: 'AI Review Suggestions', desc: '3 fresh, natural review options per category — customers pick one and submit instantly. Less friction, more reviews.' },
              ].map((f, i) => (
                <Reveal key={f.title} delay={i * 0.08}>
                  <div className="border rounded-xl p-6 bg-card h-full">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                      style={{ background: 'hsl(43 96% 56% / 0.12)', color: '#D97706' }}
                    >
                      {f.icon}
                    </div>
                    <p className="font-semibold text-foreground mb-1">{f.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="py-20 border-t bg-muted/30">
          <div className="max-w-5xl mx-auto px-6">
            <Reveal>
              <div className="text-center mb-14">
                <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#D97706' }}>Results</p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">Real Businesses. Real Results.</h2>
              </div>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  quote: '"We went from 23 Google reviews to 340 in 90 days. Our phone hasn\'t stopped ringing since."',
                  name: 'Marcus T.',
                  role: 'Owner, Elite Auto Detailing',
                  result: '+1,378% reviews in 90 days',
                },
                {
                  quote: '"We went from 3.8 stars to 4.9 stars in 6 weeks. Now we show up first for every search in our area."',
                  name: 'Priya S.',
                  role: 'Director, Serenity Med Spa',
                  result: '3.8★ → 4.9★ in 6 weeks',
                },
                {
                  quote: '"Managing reviews for 12 locations used to be a nightmare. GETMORE made it effortless."',
                  name: 'James W.',
                  role: 'Franchise Owner, 12 Locations',
                  result: '4.1★ → 4.8★ across 12 locations',
                },
              ].map((t, i) => (
                <Reveal key={t.name} delay={i * 0.12}>
                  <div className="border rounded-xl p-6 bg-card flex flex-col h-full">
                    <div className="flex gap-0.5 mb-4">
                      {Array(5).fill(null).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">{t.quote}</p>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                      <span
                        className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: 'hsl(43 96% 56% / 0.12)', color: '#D97706' }}
                      >
                        {t.result}
                      </span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" className="py-20 border-t">
          <div className="max-w-4xl mx-auto px-6">
            <Reveal>
              <div className="text-center mb-14">
                <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#D97706' }}>Pricing</p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">Simple, Transparent Pricing</h2>
                <p className="mt-3 text-muted-foreground">Start free. Scale as you grow. No hidden fees, ever.</p>
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
                  features: ['3 Business Locations', 'Unlimited review requests', 'Advanced analytics', 'WhatsApp + SMS + Email', 'AI response suggestions', 'Priority support'],
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
                    className="border rounded-xl p-7 flex flex-col h-full"
                    style={plan.featured ? { borderColor: '#D97706', borderWidth: 2, background: 'hsl(43 96% 56% / 0.04)' } : { background: 'hsl(var(--card))' }}
                  >
                    {plan.featured && (
                      <span
                        className="self-start text-xs font-bold px-2.5 py-0.5 rounded-full mb-3"
                        style={{ background: '#D97706', color: '#fff' }}
                      >
                        Most Popular
                      </span>
                    )}
                    <h3 className="font-bold text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>
                    <div className="mb-5">
                      <span className="text-3xl font-bold" style={{ color: plan.featured ? '#D97706' : 'inherit' }}>{plan.price}</span>
                      <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
                    </div>
                    <ul className="space-y-2 flex-1 mb-6">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#D97706' }} /> {f}
                        </li>
                      ))}
                    </ul>
                    <Link to="/register">
                      <Button
                        className="w-full"
                        variant={plan.featured ? 'default' : 'outline'}
                        style={plan.featured ? { background: '#D97706', color: '#fff', border: 'none' } : {}}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20 border-t bg-muted/30">
          <div className="max-w-2xl mx-auto px-6">
            <Reveal>
              <div className="text-center mb-12">
                <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#D97706' }}>FAQ</p>
                <h2 className="text-3xl font-bold text-foreground">Questions? We've Got Answers.</h2>
              </div>
            </Reveal>
            <div className="space-y-3">
              {[
                { q: "Is this against Google's terms of service?", a: "GETMORE is fully compliant with Google's review policies. We never pay for reviews or use any black-hat tactics. We simply make it easy for genuine customers to share their real experiences." },
                { q: 'How quickly will I see results?', a: "Most businesses see their first new reviews within 24–48 hours. Significant rating improvements typically happen within 30–90 days, depending on your customer volume." },
                { q: 'What happens to negative feedback?', a: "Our private feedback filter intercepts unhappy customers before they post publicly. They're redirected to a private resolution form, giving you the chance to make things right." },
                { q: 'Do I need technical skills?', a: "Zero technical skills required. If you can use a smartphone, you can set up GETMORE. Our guided onboarding takes under 5 minutes." },
                { q: 'Can I manage multiple locations?', a: "Yes! Our Growth and Enterprise plans let you manage reviews across all your locations from one central dashboard, with individual reporting for each site." },
              ].map((item, i) => (
                <Reveal key={i} delay={i * 0.05}>
                  <details className="border rounded-xl bg-card group">
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-medium text-sm text-foreground">
                      {item.q}
                      <span style={{ color: '#D97706' }} className="ml-4 shrink-0 text-lg leading-none">+</span>
                    </summary>
                    <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 border-t">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <Reveal>
              <div
                className="border rounded-2xl p-12"
                style={{ borderColor: 'hsl(43 96% 56% / 0.3)', background: 'hsl(43 96% 56% / 0.05)' }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                  Ready to <span style={{ color: '#D97706' }}>GetMore</span> of Everything?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Join 10,000+ businesses already using GETMORE to dominate their local Google rankings. No credit card required.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link to="/register">
                    <Button size="lg" className="px-8 gap-2" style={{ background: '#D97706', color: '#fff', border: 'none' }}>
                      Start Free Trial <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <a href="mailto:hello@getmore.app">
                    <Button size="lg" variant="outline" className="px-8">Talk to Sales</Button>
                  </a>
                </div>
                <div className="flex flex-wrap justify-center gap-6 mt-6">
                  {['Free 14-day trial', '10,000+ businesses trust us', 'Setup in 5 minutes'].map(t => (
                    <span key={t} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5" style={{ color: '#D97706' }} /> {t}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="py-10 border-t">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <img
                src="/getmore-logo.png"
                alt="GETMORE"
                style={{ width: 200, height: 'auto' }}
                className="object-contain select-none mb-3"
                draggable="false"
              />
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                The world's most powerful Google review platform for local businesses.
              </p>
              <p className="text-sm font-semibold" style={{ color: '#D97706' }}>Powered By DMAX</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Integrations', 'Changelog'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold text-sm text-foreground mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t gap-3">
            <p className="text-sm text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 inline mr-1" />
              © {new Date().getFullYear()} GETMORE. All rights reserved.
            </p>
            <div className="flex gap-4">
              {['Twitter', 'LinkedIn', 'Instagram', 'Facebook'].map(s => (
                <a key={s} href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
