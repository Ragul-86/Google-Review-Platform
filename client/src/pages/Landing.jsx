import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Star, Shield, BarChart3, Users, Zap, MessageSquare,
  QrCode, ChevronRight, ArrowRight, Check, Menu, X,
  TrendingUp, Download, Phone, Building2,
} from 'lucide-react';

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
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
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function DashboardMockup() {
  const bars = [30, 45, 35, 60, 50, 75, 65, 90, 80, 100];
  return (
    <div className="relative">
      <div className="bg-[#1A1A1A] rounded-[20px] border border-white/[0.08] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
        <div className="bg-[#111111] px-4 py-3 flex items-center gap-2 border-b border-white/[0.06]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-2 text-[11px] text-white/30 font-sora font-bold tracking-wide">GETMORE</span>
          <span className="text-[10px] text-white/20 ml-1">— Super Admin</span>
        </div>
        <div className="flex" style={{ height: 300 }}>
          <div className="w-12 bg-[#111111] border-r border-white/[0.06] flex flex-col items-center py-3 gap-3 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[#FBBF24]/20 flex items-center justify-center mb-1">
              <Star className="w-3.5 h-3.5 text-[#FBBF24]" />
            </div>
            {[1,2,3,4].map(i => (
              <div key={i} className={cn('w-7 h-7 rounded-lg flex items-center justify-center', i===1 ? 'bg-[#FBBF24]/10' : '')}>
                <div className={cn('w-3.5 h-3.5 rounded-sm', i===1 ? 'bg-[#FBBF24]' : 'bg-white/15')} />
              </div>
            ))}
          </div>
          <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-hidden">
            <div className="grid grid-cols-3 gap-2">
              {[
                { val:'1,284', label:'REVIEWS',  badge:'↑ +23%',   color:'#10B981' },
                { val:'847',   label:'WA SENT',  badge:'68% rate', color:'#3B82F6' },
                { val:'42',    label:'CLIENTS',  badge:'38 active',color:'#FBBF24' },
              ].map(({ val, label, badge, color }) => (
                <div key={label} className="bg-[#1E1E1E] rounded-xl p-2.5 border border-white/[0.05]">
                  <div className="text-white font-sora font-black text-base leading-tight">{val}</div>
                  <div className="text-[9px] text-white/35 mt-0.5 tracking-wide">{label}</div>
                  <div className="text-[8px] font-semibold mt-1.5 px-1.5 py-0.5 rounded inline-block" style={{ color, background: `${color}18` }}>{badge}</div>
                </div>
              ))}
            </div>
            <div className="grid gap-2 flex-1" style={{ gridTemplateColumns:'1.4fr 1fr' }}>
              <div className="bg-[#1E1E1E] rounded-xl p-2.5 border border-white/[0.05]">
                <div className="text-[9px] text-white/40 font-semibold uppercase tracking-wider mb-2">Monthly Review Growth</div>
                <div className="flex items-end gap-1" style={{ height: 70 }}>
                  {bars.map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm" style={{ height:`${h}%`, background:'linear-gradient(180deg,#FBBF24,#D97706)', opacity:0.85 }} />
                  ))}
                </div>
              </div>
              <div className="bg-[#1E1E1E] rounded-xl p-2.5 border border-white/[0.05]">
                <div className="text-[9px] text-white/40 font-semibold uppercase tracking-wider mb-2">Recent Activity</div>
                {[
                  { dot:'#10B981', text:'Barber Pro — ★★★★★', sub:'Review received' },
                  { dot:'#FBBF24', text:'City Clinic — WA sent', sub:'12 customers' },
                  { dot:'#3B82F6', text:'Glow Salon', sub:'Private feedback' },
                  { dot:'#10B981', text:'Elite Gym — ★★★★★', sub:'Review received' },
                ].map(({ dot, text, sub }, i) => (
                  <div key={i} className="flex items-start gap-1.5 py-1.5 border-b border-white/[0.04] last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ background: dot }} />
                    <div>
                      <div className="text-[8px] text-white/60 font-medium">{text}</div>
                      <div className="text-[7px] text-white/30">{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
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

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  return (
    <>
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'bg-[#111111]/[0.97] backdrop-blur-md shadow-[0_1px_0_rgba(255,255,255,0.06)]' : 'bg-transparent',
      )}>
        <div className="max-w-[1200px] mx-auto px-6 h-[68px] flex items-center justify-between">
          <img src="/getmore-logo.png" alt="GETMORE" className="h-9 w-auto object-contain" draggable="false" />
          <div className="hidden md:flex items-center gap-8">
            {[['#how-it-works','How It Works'],['#features','Features'],['#analytics','Analytics'],['#for-who','Industries']].map(([href,label]) => (
              <a key={href} href={href} className="text-white/60 hover:text-white text-[14px] font-medium transition-colors">{label}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-white/70 hover:text-[#FBBF24] text-[14px] font-medium transition-colors">Sign In</Link>
            <Link to="/login" className="bg-[#FBBF24] hover:bg-[#D97706] text-[#111111] font-bold text-[14px] px-5 py-2.5 rounded-xl transition-all hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(251,191,36,0.4)]">
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
          {[['#how-it-works','How It Works'],['#features','Features'],['#analytics','Analytics'],['#for-who','Industries']].map(([href,label]) => (
            <a key={href} href={href} className="text-white text-2xl font-bold font-sora">{label}</a>
          ))}
          <Link to="/login" className="text-[#FBBF24] text-2xl font-bold font-sora">Sign In</Link>
        </div>
      )}
    </>
  );
}

export default function Landing() {
  const FEATURES = [
    { icon: Zap,          title:'AI Review Suggestions',        desc:'Generate 3 natural, professional review suggestions tailored to each customer\'s actual service experience.' },
    { icon: Phone,        title:'WhatsApp Automation',          desc:'Send personalised review requests directly to customers via WhatsApp. Higher open rates, faster results.' },
    { icon: QrCode,       title:'QR Code Reviews',              desc:'Branded QR codes for tables, receipts, and counters. Customers scan and review instantly — no friction.' },
    { icon: Shield,       title:'Private Feedback Protection',  desc:'Unhappy customers are quietly redirected to a private feedback form, protecting your public Google rating.' },
    { icon: BarChart3,    title:'Review Analytics',             desc:'Track review growth, customer responses, conversion rates, and performance in real-time.' },
    { icon: Users,        title:'Customer Management',          desc:'Store customer details, services, review status, and full communication history in one place.' },
    { icon: Building2,    title:'Multi-Business Management',    desc:'Manage unlimited businesses from a single super-admin dashboard. Built for agencies and franchises.' },
  ];
  const STEPS = [
    { n:'01', title:'Add Customer',             desc:'Capture customer name, phone, and service received in under 30 seconds.' },
    { n:'02', title:'Send Review Request',       desc:'Send a personalised review request directly via WhatsApp with one tap.' },
    { n:'03', title:'Customer Selects Service',  desc:'Customer opens the link and taps the service they received — no login needed.' },
    { n:'04', title:'AI Generates Suggestions',  desc:'3 natural, professional review suggestions generated instantly for that service.' },
    { n:'05', title:'Customer Posts Review',     desc:'One click copies the review and redirects to Google. Done in seconds.' },
    { n:'06', title:'Track Performance',         desc:'Monitor reviews, feedback, and conversions from one real-time dashboard.' },
  ];
  const INDUSTRIES = [
    { emoji:'💇', label:'Salons & Barbershops' },
    { emoji:'🍽️', label:'Restaurants & Cafes' },
    { emoji:'🏥', label:'Clinics & Hospitals' },
    { emoji:'🦷', label:'Dental Practices' },
    { emoji:'💪', label:'Gyms & Fitness' },
    { emoji:'🏠', label:'Real Estate' },
    { emoji:'📢', label:'Marketing Agencies' },
    { emoji:'🛒', label:'Retail Stores' },
    { emoji:'🔧', label:'Service Businesses' },
    { emoji:'🏢', label:'Multi-Location Brands' },
  ];
  const WHY = [
    { icon:'⚡', title:'Less Effort',          desc:'AI writes the review. Customers just copy, paste, post — zero typing required.' },
    { icon:'📈', title:'Higher Conversion',     desc:'68% of customers who open the link post a review — 3x better than asking manually.' },
    { icon:'🛡️', title:'Reputation Protected', desc:'Negative feedback goes private. Your Google rating stays strong.' },
    { icon:'🤖', title:'AI-Powered Quality',    desc:'Reviews sound natural and specific to the service — never generic templates.' },
    { icon:'⚙️', title:'Simple Setup',          desc:'Up and running in under 2 minutes. No technical knowledge needed.' },
    { icon:'📊', title:'Powerful Analytics',    desc:"Real-time dashboard shows exactly what's working across all locations." },
    { icon:'📲', title:'WhatsApp First',         desc:'Meets customers where they already are. No app downloads needed.' },
    { icon:'🚀', title:'Scales With You',        desc:'From one location to 100+ businesses, GETMORE grows with your portfolio.' },
  ];
  const JOURNEY = [
    { emoji:'🏪', label:'Customer Visits' },
    { emoji:'📲', label:'WA Request / QR' },
    { emoji:'💇', label:'Service Selected' },
    { emoji:'🤖', label:'AI Review Generated' },
    { emoji:'📋', label:'Review Copied' },
    { emoji:'⭐', label:'Google Review Posted' },
    { emoji:'✅', label:'Collected!', gold:true },
  ];

  return (
    <div className="bg-white text-gray-900 overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="min-h-screen bg-[#111111] flex items-center pt-[100px] pb-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize:'60px 60px' }} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[700px] h-[700px] rounded-full" style={{ background:'radial-gradient(circle,rgba(251,191,36,0.07) 0%,transparent 70%)' }} />
        </div>
        <div className="max-w-[1200px] mx-auto px-6 relative w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col gap-7">
              <Reveal>
                <span className="inline-flex items-center gap-2 bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20 text-[13px] font-semibold px-4 py-1.5 rounded-full">
                  <Star className="w-3.5 h-3.5 fill-[#FBBF24]" /> AI-Powered Google Review Growth Platform
                </span>
              </Reveal>
              <Reveal delay={100}>
                <h1 className="font-sora font-black text-white leading-[1.06] tracking-tight" style={{ fontSize:'clamp(36px,5vw,66px)' }}>
                  GetMore Reviews.<br/><span className="text-[#FBBF24]">GetMore Growth.</span>
                </h1>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-white/50 text-[17px] leading-relaxed max-w-[520px]">
                  GETMORE helps businesses collect more Google reviews through AI-powered suggestions, WhatsApp automation, QR codes, private feedback protection, and real-time analytics.
                </p>
              </Reveal>
              <Reveal delay={300}>
                <div className="flex flex-wrap gap-3">
                  <Link to="/login" className="inline-flex items-center gap-2 bg-[#FBBF24] hover:bg-[#D97706] text-[#111111] font-bold px-7 py-3.5 rounded-[14px] text-[15px] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(251,191,36,0.4)]">
                    <Zap className="w-4 h-4" /> Start Free Trial
                  </Link>
                  <a href="#how-it-works" className="inline-flex items-center gap-2 border border-white/20 text-white hover:bg-white/[0.08] font-semibold px-7 py-3.5 rounded-[14px] text-[15px] transition-all hover:-translate-y-0.5">
                    See How It Works <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </Reveal>
              <Reveal delay={400}>
                <div className="flex gap-8 pt-2">
                  {[['3x','More Reviews'],['68%','Conversion Rate'],['5★','Avg Rating']].map(([num,label],i) => (
                    <div key={i} className={cn('flex flex-col', i>0 && 'border-l border-white/10 pl-8')}>
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

      {/* WHY GETMORE */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <Reveal><span className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 text-[13px] font-semibold px-4 py-1.5 rounded-full"><Shield className="w-3.5 h-3.5" /> Why GETMORE</span></Reveal>
              <Reveal delay={100}><h2 className="font-sora font-black text-[42px] leading-[1.1] tracking-tight mt-4">Turn Every Customer<br/>Into A Review</h2></Reveal>
              <Reveal delay={200}><p className="text-gray-500 text-[17px] leading-relaxed mt-4 max-w-[500px]">Most happy customers never leave a review because it takes too much effort. GETMORE removes the friction by generating ready-to-use suggestions customers can copy and post in seconds.</p></Reveal>
              <div className="flex flex-col gap-3 mt-7">
                {[['Increase Google Reviews Volume',Star],['Avoid One-Word Generic Reviews',MessageSquare],['Improve Local SEO Rankings',TrendingUp],['Build Customer Trust',Users],['Protect Online Reputation',Shield],['Track Review Performance',BarChart3]].map(([text,Icon],i) => (
                  <Reveal key={text} delay={i*60}>
                    <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-200 hover:border-[#FBBF24] hover:shadow-[0_4px_16px_rgba(251,191,36,0.1)] transition-all group">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-amber-700" /></div>
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
                  {[['3','x','More Reviews vs Manual'],['68','%','Review Conversion Rate'],['4.8','★','Avg Rating Collected'],['2','min','Average Setup Time']].map(([val,unit,label]) => (
                    <div key={label} className="flex flex-col items-center bg-gray-50 rounded-xl p-5 text-center">
                      <span className="font-sora font-black text-[38px] leading-none">{val}<span className="text-[#FBBF24]">{unit}</span></span>
                      <span className="text-gray-500 text-[13px] font-medium mt-2 leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-5 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="text-[13px] font-bold text-amber-800 mb-2">AI-Generated Review Example</div>
                  <div className="text-[13px] text-amber-900 italic leading-relaxed">"Amazing haircut at Glow Salon! The attention to detail was fantastic, and the team was super professional. Highly recommend for anyone looking for premium service."</div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex">{[...Array(5)].map((_,i)=><Star key={i} className="w-3.5 h-3.5 fill-[#FBBF24] text-[#FBBF24]"/>)}</div>
                    <span className="text-[12px] text-amber-700 font-semibold">AI-Generated · Ready to post</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24" id="how-it-works">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <Reveal><span className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 text-[13px] font-semibold px-4 py-1.5 rounded-full">How It Works</span></Reveal>
          <Reveal delay={100}><h2 className="font-sora font-black mt-4 leading-[1.1] tracking-tight" style={{ fontSize:'clamp(28px,4vw,46px)' }}>From Visit To Review<br/>In 6 Simple Steps</h2></Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-14">
            {STEPS.map(({ n, title, desc }, i) => (
              <Reveal key={n} delay={i*70}>
                <div className="bg-white border border-gray-200 rounded-2xl p-7 text-left hover:border-[#FBBF24] hover:shadow-[0_8px_32px_rgba(251,191,36,0.12)] hover:-translate-y-1 transition-all group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FBBF24]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-11 h-11 rounded-xl bg-[#111111] text-[#FBBF24] font-sora font-black text-[16px] flex items-center justify-center mb-4 relative">{n}</div>
                  <h3 className="font-sora font-bold text-[17px] mb-2">{title}</h3>
                  <p className="text-gray-500 text-[14px] leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 bg-[#111111]" id="features">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <Reveal><span className="inline-flex items-center gap-2 bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20 text-[13px] font-semibold px-4 py-1.5 rounded-full"><Star className="w-3.5 h-3.5 fill-[#FBBF24]" /> Features</span></Reveal>
          <Reveal delay={100}><h2 className="font-sora font-black text-white mt-4 leading-[1.1] tracking-tight" style={{ fontSize:'clamp(28px,4vw,46px)' }}>Everything You Need To<br/>Dominate Google Reviews</h2></Reveal>
          <Reveal delay={150}><p className="text-white/40 text-[17px] mt-4 max-w-[520px] mx-auto leading-relaxed">One platform. Every tool. Built for serious review growth.</p></Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.06] rounded-2xl overflow-hidden mt-14">
            {FEATURES.map(({ icon:Icon, title, desc }, i) => (
              <Reveal key={title} delay={i*60}>
                <div className="bg-[#111111] p-8 text-left hover:bg-[#1A1A1A] transition-colors h-full">
                  <div className="w-12 h-12 rounded-[14px] bg-[#FBBF24]/10 border border-[#FBBF24]/20 flex items-center justify-center mb-5"><Icon className="w-5 h-5 text-[#FBBF24]" /></div>
                  <h3 className="font-sora font-bold text-white text-[16px] mb-2.5">{title}</h3>
                  <p className="text-white/40 text-[14px] leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CUSTOMER JOURNEY */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <Reveal><span className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 text-[13px] font-semibold px-4 py-1.5 rounded-full">Customer Journey</span></Reveal>
          <Reveal delay={100}><h2 className="font-sora font-black mt-4 leading-[1.1] tracking-tight" style={{ fontSize:'clamp(28px,4vw,46px)' }}>The Complete Review Journey</h2></Reveal>
          <Reveal delay={200}><p className="text-gray-500 text-[17px] mt-4 max-w-[500px] mx-auto leading-relaxed">Every step designed to convert a happy customer into a published 5-star Google review.</p></Reveal>
          <Reveal delay={250}>
            <div className="flex flex-wrap items-center justify-center mt-14">
              {JOURNEY.map(({ emoji, label, gold }, i) => (
                <div key={label} className="flex items-center">
                  <div className="flex flex-col items-center gap-3 px-3 py-2">
                    <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center text-2xl border-2 shadow-sm transition-all hover:scale-105 cursor-default', gold ? 'bg-[#111111] border-[#FBBF24]' : 'bg-white border-gray-200 hover:border-[#FBBF24]')}>{emoji}</div>
                    <span className="text-[11px] font-semibold text-gray-500 text-center leading-tight max-w-[90px]">{label}</span>
                  </div>
                  {i < JOURNEY.length - 1 && <ArrowRight className="w-4 h-4 text-[#FBBF24] shrink-0 -mt-5 mx-1 hidden sm:block" />}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* PROTECTION */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <Reveal><span className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 text-[13px] font-semibold px-4 py-1.5 rounded-full"><Shield className="w-3.5 h-3.5" /> Reputation Protection</span></Reveal>
              <Reveal delay={100}><h2 className="font-sora font-black mt-4 leading-[1.1] tracking-tight" style={{ fontSize:'clamp(26px,3.5vw,42px)' }}>Protect Your Online Reputation</h2></Reveal>
              <Reveal delay={200}><p className="text-gray-500 text-[17px] leading-relaxed mt-4 max-w-[500px]">When customers give a low rating, GETMORE quietly redirects them to a private feedback form — so unhappy customers reach you directly, not Google.</p></Reveal>
              <div className="flex flex-col gap-3 mt-7">
                {['Resolve Issues Privately','Prevent Unnecessary Negative Reviews','Improve Customer Satisfaction','Protect Business Reputation'].map((t,i) => (
                  <Reveal key={t} delay={i*60}>
                    <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-200 hover:border-[#FBBF24] hover:shadow-[0_4px_16px_rgba(251,191,36,0.1)] transition-all">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><Check className="w-4 h-4 text-emerald-600" /></div>
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
                    <div className="w-11 h-11 rounded-xl bg-[#FBBF24]/15 flex items-center justify-center"><Shield className="w-5 h-5 text-[#FBBF24]" /></div>
                    <div><div className="text-white font-sora font-bold text-[16px]">Private Feedback</div><div className="text-white/40 text-[12px] mt-0.5">Redirected from Google Reviews</div></div>
                  </div>
                  <div className="p-6 divide-y divide-gray-100">
                    {['Customer kept off Google Reviews','Issue captured in private form','Business notified immediately','Google rating stays protected'].map(t => (
                      <div key={t} className="flex items-center gap-3 py-3.5">
                        <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-emerald-600" /></div>
                        <span className="text-[14px] font-medium">{t}</span>
                      </div>
                    ))}
                    <div className="pt-4"><div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200"><div className="text-[13px] font-bold text-emerald-800">Result: Google rating stays protected ✓</div><div className="text-[12px] text-emerald-700 mt-1">Customer issue resolved. Business reputation intact.</div></div></div>
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

      {/* ANALYTICS */}
      <section className="py-24 bg-[#111111]" id="analytics">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <Reveal><span className="inline-flex items-center gap-2 bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20 text-[13px] font-semibold px-4 py-1.5 rounded-full"><BarChart3 className="w-3.5 h-3.5" /> Analytics & Reporting</span></Reveal>
          <Reveal delay={100}><h2 className="font-sora font-black text-white mt-4 leading-[1.1] tracking-tight" style={{ fontSize:'clamp(28px,4vw,46px)' }}>Track Every Review,<br/>Every Conversion</h2></Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-14">
            {[
              { icon:Star,        title:'Google Reviews',      desc:'Track total reviews, monthly growth, and rating distribution.' },
              { icon:MessageSquare, title:'Private Feedback',  desc:'Monitor submissions, resolution status, and satisfaction trends.' },
              { icon:Users,       title:'Customer Activity',   desc:'Full journey — WhatsApp sent to review submitted.' },
              { icon:TrendingUp,  title:'Conversion Rates',    desc:'Funnel analytics showing clicks, opens, and posts.' },
              { icon:QrCode,      title:'QR Performance',      desc:'Track scans and conversions per QR code location.' },
              { icon:Download,    title:'Export Reports',       desc:'One-click XLSX export — reviews, feedback, customers.' },
              { icon:BarChart3,   title:'Growth Trends',        desc:'12-month review charts and business comparisons.' },
              { icon:Zap,         title:'Service Performance',  desc:'See which services generate the most reviews.' },
            ].map(({ icon:Icon, title, desc }, i) => (
              <Reveal key={title} delay={i*50}>
                <div className="bg-[#1A1A1A] border border-white/[0.07] rounded-2xl p-6 text-left hover:border-[#FBBF24]/30 hover:-translate-y-1 transition-all">
                  <Icon className="w-6 h-6 text-[#FBBF24] mb-4" />
                  <h4 className="font-sora font-bold text-white text-[15px] mb-2">{title}</h4>
                  <p className="text-white/35 text-[13px] leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="py-24 bg-gray-50" id="for-who">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <Reveal><span className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 text-[13px] font-semibold px-4 py-1.5 rounded-full">Perfect For</span></Reveal>
          <Reveal delay={100}><h2 className="font-sora font-black mt-4 leading-[1.1] tracking-tight" style={{ fontSize:'clamp(28px,4vw,46px)' }}>Built For Every<br/>Customer-Facing Business</h2></Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-12">
            {INDUSTRIES.map(({ emoji, label }, i) => (
              <Reveal key={label} delay={i*40}>
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2.5 text-[13px] font-semibold hover:border-[#FBBF24] hover:bg-amber-50 hover:text-amber-900 hover:-translate-y-0.5 transition-all cursor-default">
                  <span className="text-2xl">{emoji}</span>{label}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <Reveal><span className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 text-[13px] font-semibold px-4 py-1.5 rounded-full">Why GETMORE</span></Reveal>
          <Reveal delay={100}><h2 className="font-sora font-black mt-4 leading-[1.1] tracking-tight" style={{ fontSize:'clamp(28px,4vw,46px)' }}>Why Businesses Choose GETMORE</h2></Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
            {WHY.map(({ icon, title, desc }, i) => (
              <Reveal key={title} delay={i*50}>
                <div className="p-6 rounded-2xl border-2 border-gray-200 text-left hover:border-[#FBBF24] hover:shadow-[0_8px_24px_rgba(251,191,36,0.1)] hover:-translate-y-1 transition-all">
                  <div className="text-3xl mb-3">{icon}</div>
                  <h4 className="font-sora font-bold text-[15px] mb-2">{title}</h4>
                  <p className="text-gray-500 text-[14px] leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-28 bg-[#111111] relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[800px] h-[400px] rounded-full" style={{ background:'radial-gradient(ellipse,rgba(251,191,36,0.1) 0%,transparent 70%)' }} />
        </div>
        <div className="max-w-[1200px] mx-auto px-6 text-center relative">
          <Reveal><h2 className="font-sora font-black text-white leading-[1.08] tracking-tight" style={{ fontSize:'clamp(32px,5vw,58px)' }}>Ready To <span className="text-[#FBBF24]">GetMore Reviews?</span></h2></Reveal>
          <Reveal delay={100}><p className="text-white/50 text-[18px] mt-5 max-w-[540px] mx-auto leading-relaxed">Start collecting more Google reviews, improving customer trust, and growing your business with GETMORE.</p></Reveal>
          <Reveal delay={200}>
            <div className="flex flex-wrap gap-3 justify-center mt-9">
              <Link to="/login" className="inline-flex items-center gap-2 bg-[#FBBF24] hover:bg-[#D97706] text-[#111111] font-bold px-8 py-4 rounded-[14px] text-[16px] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(251,191,36,0.4)]"><Zap className="w-5 h-5" /> Start Free Trial</Link>
              <a href="#how-it-works" className="inline-flex items-center gap-2 border border-white/20 text-white hover:bg-white/[0.08] font-semibold px-8 py-4 rounded-[14px] text-[16px] transition-all hover:-translate-y-0.5">Book a Demo <ChevronRight className="w-4 h-4" /></a>
            </div>
          </Reveal>
          <Reveal delay={300}>
            <div className="flex flex-wrap justify-center gap-8 mt-10">
              {['No credit card required','Setup in 2 minutes','Cancel anytime'].map(t => (
                <div key={t} className="flex items-center gap-2 text-white/35 text-[13px]"><Check className="w-4 h-4" /> {t}</div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0A0A0A] border-t border-white/[0.06] pt-16 pb-8">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-white/[0.06]">
            <div>
              <img src="/getmore-logo.png" alt="GETMORE" className="h-9 w-auto object-contain mb-4" draggable="false" />
              <p className="text-white/35 text-[13px] leading-relaxed max-w-[220px]">GetMore Reviews. GetMore Customers. GetMore Trust. GetMore Growth.</p>
              <p className="text-white/20 text-[11px] font-bold tracking-widest mt-4">POWERED BY DMAX</p>
            </div>
            {[
              { title:'Product', links:['#features','#how-it-works','#analytics','#for-who'], labels:['Features','How It Works','Analytics','Industries'] },
              { title:'Company', links:['#','#','#','/login'], labels:['About','Contact','Support','Sign In'] },
              { title:'Legal',   links:['#','#','#'],          labels:['Privacy Policy','Terms of Service','Cookie Policy'] },
            ].map(({ title, links, labels }) => (
              <div key={title}>
                <h5 className="text-white/50 text-[12px] font-bold uppercase tracking-widest mb-4">{title}</h5>
                {labels.map((label,i) => (
                  <a key={label} href={links[i]} className="block text-white/35 hover:text-[#FBBF24] text-[14px] mb-2.5 transition-colors">{label}</a>
                ))}
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
            <p className="text-white/20 text-[13px]">Copyright &copy; {new Date().getFullYear()} GETMORE. All Rights Reserved. Powered by DMAX.</p>
            <p className="text-white/15 text-[12px]">GetMore Reviews · GetMore Customers · GetMore Trust · GetMore Growth</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
