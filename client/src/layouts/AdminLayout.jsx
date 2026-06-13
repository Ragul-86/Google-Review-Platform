import { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/AdminSidebar';
import { useAuth } from '@/context/AuthContext';
import { Menu, ChevronDown, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ── Page meta per route ─────────────────────────────────────────── */
const PAGE_META = {
  '/admin/dashboard':  { title: 'Dashboard',   desc: 'Platform-wide performance and activity overview' },
  '/admin/clients':    { title: 'Clients',      desc: 'Manage business accounts, owners, and subscriptions' },
  '/admin/categories': { title: 'Categories',   desc: 'Category templates per business type' },
  '/admin/reviews':    { title: 'Reviews',      desc: 'All reviews and feedback across the platform' },
  '/admin/analytics':  { title: 'Analytics',    desc: 'Trends, ratings, and platform performance metrics' },
  '/admin/settings':   { title: 'Settings',     desc: 'Profile, security, and platform configuration' },
};

/* ── Profile dropdown ────────────────────────────────────────────── */
function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (user?.name || user?.email || 'SA')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border transition-all',
          open ? 'bg-gray-50 border-gray-200' : 'border-transparent hover:bg-gray-50 hover:border-gray-200',
        )}
      >
        {/* Avatar — gold ring */}
        <div className="h-8 w-8 rounded-lg bg-[#111111] ring-2 ring-[#FBBF24]/60 flex items-center justify-center shrink-0">
          <span className="text-[#FBBF24] text-xs font-bold font-sora">{initials}</span>
        </div>
        <div className="hidden sm:block text-left min-w-0">
          <p className="text-[13px] font-semibold text-gray-900 leading-none truncate max-w-[120px]">
            {user?.name || 'Super Admin'}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[120px]">{user?.email}</p>
        </div>
        <ChevronDown className={cn('h-3.5 w-3.5 text-gray-400 transition-transform shrink-0', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 min-w-[200px]">
            <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
              <p className="text-sm font-semibold text-gray-900">{user?.name || 'Super Admin'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
            </div>
            <button
              onClick={() => { setOpen(false); window.location.href = '/admin/settings'; }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-4 w-4 text-gray-400" /> Settings
            </button>
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════ */
export function AdminLayout() {
  const [collapsed, setCollapsed]   = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout }            = useAuth();
  const { pathname }                = useLocation();
  const navigate                    = useNavigate();

  const meta = PAGE_META[pathname] ?? { title: 'Admin', desc: '' };

  function handleMenuToggle() {
    if (window.innerWidth < 768) setMobileOpen((o) => !o);
    else setCollapsed((c) => !c);
  }

  async function handleLogout() {
    await logout();
    toast.success('Signed out');
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <AdminSidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* ── Header ──────────────────────────────────────────────── */}
        <header className="h-16 border-b border-gray-100 bg-white flex items-center px-4 md:px-6 gap-4 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {/* Left: hamburger + page title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={handleMenuToggle}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden md:block min-w-0">
              <h1 className="text-[17px] font-bold text-gray-900 leading-tight">{meta.title}</h1>
              {meta.desc && <p className="text-[12px] text-gray-400 mt-0.5 truncate">{meta.desc}</p>}
            </div>
          </div>

          {/* Right: Super Admin badge (gold) + profile */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 bg-[#111111] border border-white/10 px-3 py-1.5 rounded-full">
              <img src="/getmore-logo.svg" alt="GETMORE" className="h-5 w-auto object-contain" draggable="false" />
              <span className="text-[#FBBF24] text-[11px] font-bold font-sora tracking-wide">Super Admin</span>
            </div>
            <ProfileMenu user={user} onLogout={handleLogout} />
          </div>
        </header>

        {/* ── Main content ────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
