import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Star, Shield, BarChart3, Users, Zap, MessageSquare,
  QrCode, ChevronRight, ArrowRight, Check, Menu, X,
  TrendingUp, Download, Phone, Building2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

/* ── Scroll animation hook ──────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      className={cn('transition-all duration-700', className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ── Dashboard preview mockup ───────────────────────────────────────── */
function DashboardMockup() {
  const bars = [30, 45, 35, 60, 50, 75, 65, 90, 80, 100];
  return (
    <div className="relative">
      <div className="bg-[#1A1A1A] rounded-[20px] border border-white/[0.08] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
        {/* Window chrome */}
        <div className="bg-[#111111] px-4 py-3 flex items-center gap-2 border-b border-white/[0.06]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-2 text-[11px] text-white/30 font-sora font-bold tracking-wide">GETMORE</span>
          <span className="text-[10px] text-white/20 ml-1">— Super Admin</span>
        </div>
        <div className="flex" style={{ height: 300 }}>
          {/* Mini sidebar */}
          <div className="w-12 bg-[#111111] border-r border-white/[0.06] flex flex-col items-center py-3 gap-3 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[#FBBF24]/20 flex items-center justify-center mb-1">
              <Star className="w-3.5 h-3.5 text-[#FBBF24]" />
            </div>
            {[1,2,3,4].map(i => (
              <div key={i} className={cn('w-7 h-7 rounded-lg flex items-center justify-center', i===1 && 'bg-[#FBBF24]/10')}>
                <div className={cn('w-3.5 h-3.5 rounded-sm', i===1 ? 'bg-[#FBBF24]' : 'bg-white/15')} />
              </div>
            ))}
          </div>
          {/* Content */}
          <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-hidden">
            {/* KPI row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { val:'1,284', label:'REVIEWS',  badge:'↑ +23%',    color:'#10B981' },
                { val:'847',   label:'WA SENT',  badge:'68% rate',  color:'#3B82F6' },
                { val:'42',    label:'CLIENTS',  badge:'38 active', color:'#FBBF24' },
              ].map(({ val, label, badge, color }) => (
                <div key={label} className="bg-[#1E1E1E] rounded-xl p-2.5 border border-white/[0.05]">
                  <div className="text-white font-sora font-black text-base leading-tight">{val}</div>
                  <div className="text-[9px] text-white/35 mt-0.5 tracking-wide">{label}</div>
                  <div className="text-[8px] font-semibold mt-1.5 px-1.5 py-0.5 rounded inline-block"
                    style={{ color, background: `${color}18` }}>{badge}</div>
                </div>
              ))}
            </div>
            {/* Charts */}
            <div className="grid gap-2 flex-1" style={{ gridTemplateColumns:'1.4fr 1fr' }}>
              <div className="bg-[#1E1E1E] rounded-xl p-2.5 border border-white/[0.05]">
                <div className="text-[9px] text-white/40 font-semibold uppercase tracking-wider mb-2">Monthly Review Growth</div>
                <div className="flex items-end gap-1" style={{ height: 70 }}>
                  {bars.map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm"
                      style={{ height:`${h}%`, background:'linear-gradient(180deg,#FBBF24,#D97706)', opacity:0.85 }} />
                  ))}
                </div>
              </div>
              <div className="bg-[#1E1E1E] rounded-xl p-2.5 border border-white/[0.05]">
                <div className="text-[9px] text-white/40 font-semibold uppercase tracking-wider mb-2">Recent Activity</div>
                {[
                  { dot:'#10B981', text:'Barber Pro — ★★★★★' },
                  { dot:'#FBBF24', text:'City Clinic — WA sent' },
                  { dot:'#3B82F6', text:'Glow Salon' },
                  { dot:'#10B981', text:'Elite Gym — ★★★★★' },
                ].map(({ dot, text }, i) => (
                  <div key={i} className="flex items-center gap-1.5 py-1.5 border-b border-white/[0.04] last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
                    <div className="text-[8px] text-white/55 font-medium">{text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Floating badges */}
      <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl px-3 py-2 shadow-xl border border-gray-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-base">⭐</div>
        <div>
          <div className="text-[13px] font-bold text-gray-900">+23 reviews today</div>
          <div className="text-[11px] text-gray-400">Across all businesses</div>
        </div>
      </div>
      <div className="absolute -top-4 -right-4 bg-[#111111] rounded-xl px-3 py-2 flex items-center gap-2 border border-[#FBBF24]/30 shadow-lg">
        <span className="text-sm">📲</span>
        <span className="text-[12px] font-bold text-[#FBBF24]">WhatsApp sent</span>
      </div>
    </div>
  );
}

/* ── Animated Hero Headline ─────────────────────────────────────────── */
const CYCLE_WORDS = ['Customers.', 'Trust.', 'Growth.'];

const GOLD = {
  background: 'linear-gradient(135deg,#FBBF24 0%,#F59E0B 50%,#D97706 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

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
      {/* Line 1 — fully static */}
      <div>
        <span style={{ color: '#fff' }}>Get</span>
        <span style={GOLD}>More</span>
        <span style={{ color: '#fff' }}> Reviews.</span>
      </div>

      {/* Line 2 — "GetMore" fixed, only last word cycles */}
      <div>
        <span style={{ color: '#fff' }}>Get</span>
        <span style={GOLD}>More</span>
        <span style={{ color: '#fff' }}> </span>
        {/*
          Clip container: overflow:hidden hides words sliding in/out.
          mode="wait" ensures only ONE word is mounted at a time —
          the old word fully exits before the new one enters.
        */}
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
              animate={{ y: '0%',   opacity: 1 }}
              exit={{    y: '-110%', opacity: 0 }}
              transition={{ duration: 0.48, ease: [0.42, 0, 0.58, 1] }}
              style={{ display: 'block', whiteSpace: 'nowrap', ...GOLD }}
            >
              {CYCLE_WORDS[idx]}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
    </div>
  );
}

/* ── Navbar ─────────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  const navLinks = [
    ['#how-it-works','How It Works'],
    ['#features','Features'],
    ['#analytics','Analytics'],
    ['#for-who','For Who'],
  ];
  return (
    <>
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[#111111]/[0.97] backdrop-blur-md shadow-[0_1px_0_rgba(255,255,255,0.06)]'
          : 'bg-transparent',
      )}>
        <div className="max-w-[1200px] mx-auto px-8 flex items-center justify-between" style={{ height: 84 }}>
          <img
            src="/getmore-logo.png"
            alt="GETMORE"
            className="object-contain flex-shrink-0"
            style={{ width: 200, height: 'auto', maxHeight: 54 }}
            draggable="false"
          />
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(([href, label]) => (
              <a key={href} href={href}
                className="text-white/60 hover:text-white text-[14px] font-medium transition-colors">
                {label}
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-white/70 hover:text-[#FBBF24] text-[14px] font-medium transition-colors">
              Sign In
            </Link>
            <Link to="/login"
              className="bg-[#FBBF24] hover:bg-[#D97706] text-[#111111] font-bold text-[14px] px-5 py-2.5 rounded-xl transition-all hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(251,191,36,0.4)]">
              Start Free Trial
            </Link>
          </div>
          <button className="md:hidden text-white p-1" onClick={() => setOpen(o => !o)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="fixed inset-0 z-40 bg-[#111111] flex flex-col items-center justify-center gap-8" onClick={() => setOpen(false)}>
          <img src="/getmore-logo.png" alt="GETMORE" className="object-contain mb-2"
            style={{ width: 180, height: 'auto', maxHeight: 50 }} draggable="false" />
          {navLinks.map(([href, label]) => (
            <a key={href} href={href} className="text-white text-2xl font-bold font-sora">{label}</a>
          ))}
          <Link to="/login" className="text-[#FBBF24] text-2xl font-bold font-sora">Sign In</Link>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════════════════════════════ */
export default function Landing() {
  const FEATURES = [
    { icon: Zap,         title: 'AI Review Suggestions',
      desc: 'Generate natural, professional review suggestions based on services and customer experiences.' },
    { icon: Phone,       title: 'WhatsApp Automation Message',
      desc: 'Send review requests directly to customers through WhatsApp.' },
    { icon: QrCode,      title: 'QR Code Reviews',
      desc: 'Allow customers to leave reviews instantly using QR codes.' },
    { icon: Shield,      title: 'Private Negative Feedback Collection',
      desc: 'Redirect unhappy customers to private feedback instead of public negative reviews.' },
    { icon: BarChart3,   title: 'Review Analytics',
      desc: 'Track review growth, customer responses, conversion rates, and business performance.' },
    { icon: Users,       title: 'Customer Management',
      desc: 'Store customer details, services received, review status, and communication history.' },
    { icon: Building2,   title: 'Multi-Business Management',
      desc: 'Manage multiple businesses and locations from a single dashboard.' },
  ];

  const STEPS = [
    { n: '01', title: 'Add Customer',
      desc: 'Capture customer name, phone number, and service provided.' },
    { n: '02', title: 'Send Review Request',
      desc: 'Send personalized review requests directly through WhatsApp.' },
    { n: '03', title: 'Customer Selects Service',
      desc: 'Customers select the service they received.' },
    { n: '04', title: 'AI Generates Review Suggestions',
      desc: 'GETMORE instantly generates multiple review suggestions tailored to the selected service.' },
    { n: '05', title: 'Customer Posts Review',
      desc: 'One click copies the review and redirects directly to the Google Review page.' },
    { n: '06', title: 'Track Performance',
      desc: 'Monitor reviews, feedback, conversions, and customer activity from one dashboard.' },
  ];

  const JOURNEY = [
    { emoji: '🏪', label: 'Customer Visits Business' },
    { emoji: '📲', label: 'WhatsApp Request Sent / Scan QR' },
    { emoji: '💇', label: 'Service Selected' },
    { emoji: '🤖', label: 'AI Review Generated' },
    { emoji: '📋', label: 'Review Copied' },
    { emoji: '⭐', label: 'Google Review Submitted' },
    { emoji: '🙏', label: 'Thank You Page' },
    { emoji: '✅', label: 'Review Collection Completed', gold: true },
  ];

  const INDUSTRIES = [
    { emoji: '💇', label: 'Salons' },
    { emoji: '🍽️', label: 'Restaurants' },
    { emoji: '🏥', label: 'Clinics' },
    { emoji: '🦷', label: 'Dental Practices' },
    { emoji: '💪', label: 'Gyms' },
    { emoji: '🏠', label: 'Real Estate Agencies' },
    { emoji: '📢', label: 'Marketing Agencies' },
    { emoji: '🛒', label: 'Retail Stores' },
    { emoji: '🔧', label: 'Service Businesses' },
    { emoji: '🏢', label: 'Multi-Location Businesses' },
  ];

  const WHY = [
    { icon: '⚡', title: 'Less Customer Effort',
      desc: 'AI generates the review. Customers copy, paste, and post in seconds.' },
    { icon: '📈', title: 'Higher Review Conversion',
      desc: 'More customers complete the review process compared to manual requests.' },
    { icon: '⭐', title: 'Professional Review Collection',
      desc: 'Collect high-quality, natural-sounding reviews that build trust.' },
    { icon: '🤖', title: 'AI-Powered Review Suggestions',
      desc: 'Reviews are tailored to the specific service — never generic.' },
    { icon: '🛡️', title: 'Private Negative Feedback Protection',
      desc: 'Keep unhappy customers off Google and resolve issues privately.' },
    { icon: '⚙️', title: 'Simple Setup',
      desc: 'Up and running in minutes with no technical knowledge required.' },
    { icon: '📊', title: 'Powerful Analytics',
      desc: 'Real-time visibility into reviews, feedback, and business performance.' },
    { icon: '🚀', title: 'Scalable For Growth',
      desc: 'From one location to hundreds of businesses, GETMORE scales with you.' },
  ];

  const BENEFITS = [
    [TrendingUp, 'Increase Google Reviews'],
    [MessageSquare, 'Avoid one word review'],
    [BarChart3, 'Improve Local SEO Rankings'],
    [Users, 'Build Customer Trust'],
    [Shield, 'Protect Online Reputation'],
    [Star, 'Track Review Performance'],
    [Zap, 'Grow Business Visibility'],
  ];

  const ANALYTICS_ITEMS = [
    { icon: Star,          label: 'Google Reviews' },
    { icon: MessageSquare, label: 'Private Negative Feedback' },
    { icon: Users,         label: 'Customer Activity' },
    { icon: Zap,           label: 'Service Performance' },
    { icon: TrendingUp,    label: 'Conversion Rates' },
    { icon: BarChart3,     label: 'Monthly Growth Trends' },
    { icon: QrCode,        label: 'QR Code Performance' },
    { icon: Download,      label: 'Export reports anytime.' },
  ];

  return (
    <div className="bg-white text-gray-900 overflow-x-hidden">
      <Navbar />

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="min-h-screen bg-[#111111] flex items-center pt-[104px] pb-16 relative overflow-hidden">
        {/* Grid bg */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage:'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize:'60px 60px' }} />
        {/* Gold glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[700px] h-[700px] rounded-full"
            style={{ background:'radial-gradient(circle,rgba(251,191,36,0.07) 0%,transparent 70%)' }} />
        </div>
        <div className="max-w-[1200px] mx-auto px-6 relative w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col gap-7">
              <Reveal>
                <span className="inline-flex items-center gap-2 bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20 text-[13px] font-semibold px-4 py-1.5 rounded-full">
                  <Star className="w-3.5 h-3.5 fill-[#FBBF24]" /> AI-Powered Google Review Growth Platform
                </span>
              </Reveal>
              <div>
                <AnimatedHeadline />
              </div>
              <Reveal delay={200}>
                <p className="text-white/50 text-[17px] leading-relaxed max-w-[520px]">
                  GETMORE helps businesses collect more Google reviews through AI-powered review suggestions, WhatsApp Automated Message to collect review, QR codes, private negative feedback collection, and real-time analytics.
                </p>
              </Reveal>
              <Reveal delay={300}>
                <div className="flex flex-wrap gap-3">
                  <Link to="/login"
                    className="inline-flex items-center gap-2 bg-[#FBBF24] hover:bg-[#D97706] text-[#111111] font-bold px-7 py-3.5 rounded-[14px] text-[15px] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(251,191,36,0.4)]">
                    <Zap className="w-4 h-4" /> Start Free Trial
                  </Link>
                  <Link to="/login"
                    className="inline-flex items-center gap-2 border border-white/20 text-white hover:bg-white/[0.08] font-semibold px-7 py-3.5 rounded-[14px] text-[15px] transition-all hover:-translate-y-0.5">
                    Book Demo <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </Reveal>
              <Reveal delay={400}>
                <div className="flex gap-8 pt-2">
                  {[['3x','More Reviews'],['68%','Conversion Rate'],['5★','Avg Rating']].map(([num, label], i) => (
                    <div key={i} className={cn('flex flex-col', i > 0 && 'border-l border-white/10 pl-8')}>
                      <span className="font-sora font-black text-[#FBBF24] text-2xl leading-none">{num}</span>
                      <span className="text-white/35 text-[11px] font-medium mt-1">{label}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
            <Reveal delay={200}>
              <DashboardMockup />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── WHY GETMORE ────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 text-[13px] font-semibold px-4 py-1.5 rounded-full">
                  <Shield className="w-3.5 h-3.5" /> WHY GETMORE
                </span>
              </Reveal>
              <Reveal delay={100}>
                <h2 className="font-sora font-black mt-4 leading-[1.1] tracking-tight" style={{ fontSize:'clamp(28px,3.5vw,42px)' }}>
                  Turn Every Customer Into A Review Opportunity
                </h2>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-gray-500 text-[17px] leading-relaxed mt-4 max-w-[500px]">
                  Most happy customers never leave a review because it takes too much effort. GETMORE removes the friction by generating ready-to-use review suggestions that customers can copy and post in seconds.
                </p>
              </Reveal>
              <div className="flex flex-col gap-3 mt-8">
                {BENEFITS.map(([Icon, text], i) => (
                  <Reveal key={text} delay={i * 60}>
                    <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-200 hover:border-[#FBBF24] hover:shadow-[0_4px_16px_rgba(251,191,36,0.1)] transition-all group">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-amber-700" />
                      </div>
                      <span className="text-[15px] font-semibold">{text}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#FBBF24] ml-auto transition-colors" />
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
            <Reveal delay={150}>
              <div className="bg-white rounded-2xl p-8 shadow-[0_12px_48px_rgba(0,0,0,0.1)] border border-gray-100">
                <h3 className="font-sora font-bold text-[16px] mb-5">Platform Performance</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['3','x','More Reviews vs Manual'],
                    ['68','%','Review Conversion Rate'],
                    ['4.8','★','Avg Rating Collected'],
                    ['2','min','Average Setup Time'],
                  ].map(([val, unit, label]) => (
                    <div key={label} className="flex flex-col items-center bg-gray-50 rounded-xl p-5 text-center">
                      <span className="font-sora font-black text-[38px] leading-none">
                        {val}<span className="text-[#FBBF24]">{unit}</span>
                      </span>
                      <span className="text-gray-500 text-[13px] font-medium mt-2 leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-5 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="text-[13px] font-bold text-amber-800 mb-2">AI-Generated Review Example</div>
                  <div className="text-[13px] text-amber-900 italic leading-relaxed">
                    "Amazing haircut at Glow Salon! The attention to detail was fantastic, and the team was super professional. Highly recommend for anyone looking for premium service."
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-[#FBBF24] text-[#FBBF24]" />)}
                    </div>
                    <span className="text-[12px] text-amber-700 font-semibold">AI-Generated · Ready to post</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <section className="py-24 bg-white" id="how-it-works">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 text-[13px] font-semibold px-4 py-1.5 rounded-full">
              HOW IT WORKS
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="font-sora font-black mt-4 leading-[1.1] tracking-tight"
              style={{ fontSize:'clamp(28px,4vw,46px)' }}>
              From Visit To Review — 6 Simple Steps
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-14">
            {STEPS.map(({ n, title, desc }, i) => (
              <Reveal key={n} delay={i * 70}>
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-7 text-left hover:border-[#FBBF24] hover:shadow-[0_8px_32px_rgba(251,191,36,0.12)] hover:-translate-y-1 transition-all group relative overflow-hidden h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FBBF24]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-11 h-11 rounded-xl bg-[#111111] text-[#FBBF24] font-sora font-black text-[15px] flex items-center justify-center mb-4 relative">
                    {n}
                  </div>
                  <h3 className="font-sora font-bold text-[17px] mb-2">{title}</h3>
                  <p className="text-gray-500 text-[14px] leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────── */}
      <section className="py-24 bg-[#111111]" id="features">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20 text-[13px] font-semibold px-4 py-1.5 rounded-full">
              <Star className="w-3.5 h-3.5 fill-[#FBBF24]" /> FEATURES
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="font-sora font-black text-white mt-4 leading-[1.1] tracking-tight"
              style={{ fontSize:'clamp(28px,4vw,46px)' }}>
              Everything You Need To Dominate Google Reviews
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.06] rounded-2xl overflow-hidden mt-14">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 60}>
                <div className="bg-[#111111] p-8 text-left hover:bg-[#181818] transition-colors h-full">
                  <div className="w-12 h-12 rounded-[14px] bg-[#FBBF24]/10 border border-[#FBBF24]/20 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-[#FBBF24]" />
                  </div>
                  <h3 className="font-sora font-bold text-white text-[15px] mb-2.5">{title}</h3>
                  <p className="text-white/40 text-[14px] leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CUSTOMER JOURNEY ───────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 text-[13px] font-semibold px-4 py-1.5 rounded-full">
              CUSTOMER JOURNEY
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="font-sora font-black mt-4 leading-[1.1] tracking-tight"
              style={{ fontSize:'clamp(28px,4vw,46px)' }}>
              The Complete Review Journey
            </h2>
          </Reveal>
          <Reveal delay={250}>
            <div className="flex flex-wrap items-start justify-center gap-1 mt-14">
              {JOURNEY.map(({ emoji, label, gold }, i) => (
                <div key={label} className="flex items-start">
                  <div className="flex flex-col items-center gap-3 px-2 py-2" style={{ width: 108 }}>
                    <div className={cn(
                      'w-14 h-14 rounded-xl flex items-center justify-center text-2xl border-2 shadow-sm transition-all hover:scale-105 cursor-default',
                      gold ? 'bg-[#111111] border-[#FBBF24]' : 'bg-white border-gray-200 hover:border-[#FBBF24]',
                    )}>{emoji}</div>
                    <span className="text-[11px] font-semibold text-gray-500 text-center leading-tight">{label}</span>
                  </div>
                  {i < JOURNEY.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-[#FBBF24] shrink-0 mt-5 hidden sm:block" />
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PRIVATE FEEDBACK PROTECTION ────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 text-[13px] font-semibold px-4 py-1.5 rounded-full">
                  <Shield className="w-3.5 h-3.5" /> PRIVATE Negative FEEDBACK PROTECTION
                </span>
              </Reveal>
              <Reveal delay={100}>
                <h2 className="font-sora font-black mt-4 leading-[1.1] tracking-tight"
                  style={{ fontSize:'clamp(26px,3.5vw,42px)' }}>
                  Protect Your Online Reputation
                </h2>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-gray-500 text-[17px] leading-relaxed mt-4 max-w-[500px]">
                  When customers provide low ratings, GETMORE redirects them to a private negative feedback form instead of sending them to Google Reviews.
                </p>
              </Reveal>
              <div className="flex flex-col gap-3 mt-7">
                {['Resolve issues privately','Prevent unnecessary negative reviews','Improve customer satisfaction','Protect business reputation'].map((t, i) => (
                  <Reveal key={t} delay={i * 60}>
                    <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-200 hover:border-[#FBBF24] hover:shadow-[0_4px_16px_rgba(251,191,36,0.1)] transition-all">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-[15px] font-semibold">{t}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
            <Reveal delay={150}>
              <div className="relative">
                <div className="bg-white rounded-2xl overflow-hidden shadow-[0_12px_48px_rgba(0,0,0,0.12)] border border-gray-200">
                  <div className="p-6 flex items-center gap-3" style={{ background:'linear-gradient(to right,#111111,#1F1F1F)' }}>
                    <div className="w-11 h-11 rounded-xl bg-[#FBBF24]/15 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-[#FBBF24]" />
                    </div>
                    <div>
                      <div className="text-white font-sora font-bold text-[16px]">Private Negative Feedback</div>
                      <div className="text-white/40 text-[12px] mt-0.5">Redirected from Google Reviews</div>
                    </div>
                  </div>
                  <div className="p-6 divide-y divide-gray-100">
                    {['Customer kept off Google Reviews','Issue captured in private form','Business notified immediately','Google rating stays protected'].map(t => (
                      <div key={t} className="flex items-center gap-3 py-3.5">
                        <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-emerald-600" />
                        </div>
                        <span className="text-[14px] font-medium">{t}</span>
                      </div>
                    ))}
                    <div className="pt-4">
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                        <div className="text-[13px] font-bold text-emerald-800">Result: Google rating stays protected ✓</div>
                        <div className="text-[12px] text-emerald-700 mt-1">Customer issue resolved. Business reputation intact.</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl px-3.5 py-2.5 shadow-lg border border-gray-200 flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[13px] font-bold text-red-600">Negative review blocked</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── ANALYTICS & REPORTING ──────────────────────────────────── */}
      <section className="py-24 bg-[#111111]" id="analytics">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20 text-[13px] font-semibold px-4 py-1.5 rounded-full">
              <BarChart3 className="w-3.5 h-3.5" /> ANALYTICS & REPORTING
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="font-sora font-black text-white mt-4 leading-[1.1] tracking-tight"
              style={{ fontSize:'clamp(28px,4vw,46px)' }}>
              Monitor Every Review, Every Conversion
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-14">
            {ANALYTICS_ITEMS.map(({ icon: Icon, label }, i) => (
              <Reveal key={label} delay={i * 50}>
                <div className="bg-[#1A1A1A] border border-white/[0.07] rounded-2xl p-7 text-left hover:border-[#FBBF24]/30 hover:-translate-y-1 transition-all group">
                  <div className="w-11 h-11 rounded-[14px] bg-[#FBBF24]/10 border border-[#FBBF24]/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#FBBF24]" />
                  </div>
                  <h4 className="font-sora font-bold text-white text-[15px]">{label}</h4>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IS GETMORE FOR ─────────────────────────────────────── */}
      <section className="py-24 bg-gray-50" id="for-who">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 text-[13px] font-semibold px-4 py-1.5 rounded-full">
              WHO IS GETMORE FOR
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="font-sora font-black mt-4 leading-[1.1] tracking-tight"
              style={{ fontSize:'clamp(28px,4vw,46px)' }}>
              Perfect For Every Customer-Facing Business
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-12">
            {INDUSTRIES.map(({ emoji, label }, i) => (
              <Reveal key={label} delay={i * 40}>
                <div className="bg-white border-2 border-gray-200 rounded-xl p-5 flex flex-col items-center gap-3 font-semibold hover:border-[#FBBF24] hover:bg-amber-50 hover:text-amber-900 hover:-translate-y-0.5 transition-all cursor-default">
                  <span className="text-3xl">{emoji}</span>
                  <span className="text-[13px] text-center leading-tight">{label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY BUSINESSES CHOOSE GETMORE ──────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 text-[13px] font-semibold px-4 py-1.5 rounded-full">
              WHY BUSINESSES CHOOSE GETMORE
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="font-sora font-black mt-4 leading-[1.1] tracking-tight"
              style={{ fontSize:'clamp(28px,4vw,46px)' }}>
              Why Businesses Choose GETMORE
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
            {WHY.map(({ icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 50}>
                <div className="p-7 rounded-2xl border-2 border-gray-200 text-left hover:border-[#FBBF24] hover:shadow-[0_8px_24px_rgba(251,191,36,0.1)] hover:-translate-y-1 transition-all h-full">
                  <div className="text-3xl mb-3">{icon}</div>
                  <h4 className="font-sora font-bold text-[15px] mb-2">{title}</h4>
                  <p className="text-gray-500 text-[14px] leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────── */}
      <section className="py-28 bg-[#111111] relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[800px] h-[400px] rounded-full"
            style={{ background:'radial-gradient(ellipse,rgba(251,191,36,0.1) 0%,transparent 70%)' }} />
        </div>
        <div className="max-w-[1200px] mx-auto px-6 text-center relative">
          <Reveal>
            <h2 className="font-sora font-black text-white leading-[1.08] tracking-tight"
              style={{ fontSize:'clamp(32px,5vw,58px)' }}>
              Ready To <span className="text-[#FBBF24]">GetMore Reviews?</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-white/50 text-[18px] mt-5 max-w-[540px] mx-auto leading-relaxed">
              Start collecting more Google reviews, improving customer trust, and growing your business with GETMORE.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="flex flex-wrap gap-3 justify-center mt-9">
              <Link to="/login"
                className="inline-flex items-center gap-2 bg-[#FBBF24] hover:bg-[#D97706] text-[#111111] font-bold px-8 py-4 rounded-[14px] text-[16px] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(251,191,36,0.4)]">
                <Zap className="w-5 h-5" /> Start Free Trial
              </Link>
              <Link to="/login"
                className="inline-flex items-center gap-2 border border-white/20 text-white hover:bg-white/[0.08] font-semibold px-8 py-4 rounded-[14px] text-[16px] transition-all hover:-translate-y-0.5">
                Book Demo <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={300}>
            <div className="flex flex-wrap justify-center gap-8 mt-10">
              {['No credit card required','Setup in 2 minutes','Cancel anytime'].map(t => (
                <div key={t} className="flex items-center gap-2 text-white/35 text-[13px]">
                  <Check className="w-4 h-4" /> {t}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="bg-[#0A0A0A] border-t border-white/[0.06] pt-16 pb-8">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-white/[0.06]">
            {/* Brand column */}
            <div>
              <img
                src="/getmore-logo.png"
                alt="GETMORE"
                className="object-contain"
                style={{ width: 240, height: 'auto', maxHeight: 68 }}
                draggable="false"
              />
              <p className="text-white/60 text-[16px] font-medium leading-relaxed mt-4">
                GetMore Reviews.<br/>
                GetMore Customers.<br/>
                GetMore Trust, GetMore Growth
              </p>
              <p className="text-[#FBBF24] text-[14px] font-semibold mt-4">Powered By DMAX</p>
            </div>
            {/* Products */}
            <div>
              <h5 className="text-white/50 text-[12px] font-bold uppercase tracking-widest mb-4">Products</h5>
              {['Features','Pricing','Contact','Support'].map(label => (
                <a key={label} href="#"
                  className="block text-white/35 hover:text-[#FBBF24] text-[14px] mb-2.5 transition-colors">
                  {label}
                </a>
              ))}
            </div>
            {/* Legal */}
            <div>
              <h5 className="text-white/50 text-[12px] font-bold uppercase tracking-widest mb-4">Legal</h5>
              {['Privacy Policy','Terms Of Service'].map(label => (
                <a key={label} href="#"
                  className="block text-white/35 hover:text-[#FBBF24] text-[14px] mb-2.5 transition-colors">
                  {label}
                </a>
              ))}
            </div>
            {/* CTA column */}
            <div className="flex flex-col gap-3">
              <h5 className="text-white/50 text-[12px] font-bold uppercase tracking-widest mb-1">Get Started</h5>
              <Link to="/login"
                className="inline-flex items-center justify-center gap-2 bg-[#FBBF24] hover:bg-[#D97706] text-[#111111] font-bold px-5 py-3 rounded-xl text-[14px] transition-all hover:-translate-y-px">
                <Zap className="w-4 h-4" /> Start Free Trial
              </Link>
              <Link to="/login"
                className="inline-flex items-center justify-center gap-2 border border-white/20 text-white hover:bg-white/[0.06] font-semibold px-5 py-3 rounded-xl text-[14px] transition-all">
                Book Demo
              </Link>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
            <p className="text-white/20 text-[13px]">
              Copyright &copy; GETMORE. All Rights Reserved.
            </p>
            <p className="text-white/15 text-[12px]">
              GetMore Reviews · GetMore Customers · GetMore Trust · GetMore Growth
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
