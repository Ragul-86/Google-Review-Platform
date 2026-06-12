import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Tag, MessageSquare,
  BarChart3, Settings, LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

const NAV = [
  { to: '/admin/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/admin/clients',    label: 'Clients',     icon: Building2 },
  { to: '/admin/categories', label: 'Categories',  icon: Tag },
  { to: '/admin/reviews',    label: 'Reviews',     icon: MessageSquare },
  { to: '/admin/analytics',  label: 'Analytics',   icon: BarChart3 },
  { to: '/admin/settings',   label: 'Settings',    icon: Settings },
];

/* ── GETMORE Logo ────────────────────────────────────────────────── */
function GetmoreLogo({ collapsed }) {
  return (
    <div className={cn('flex items-center gap-3 shrink-0', collapsed && 'md:justify-center')}>
      {/* Gold star-badge icon */}
      <div className="h-10 w-10 rounded-xl bg-[#FBBF24] flex items-center justify-center shrink-0 shadow-lg shadow-[#FBBF24]/30">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
          <path
            d="M12 2L14.4 8.6H21.5L15.9 12.5L18.2 19.1L12 15.2L5.8 19.1L8.1 12.5L2.5 8.6H9.6Z"
            fill="#111111"
            strokeWidth="0"
          />
        </svg>
      </div>
      {/* Text — hidden when collapsed on desktop */}
      <div className={cn('min-w-0 overflow-hidden', collapsed && 'md:hidden')}>
        <p className="font-sora font-extrabold text-white text-[18px] leading-tight tracking-tight">
          GETMORE
        </p>
        <p className="text-[10px] font-medium text-[#FBBF24] mt-0.5 tracking-wide uppercase">
          Get More Reviews
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════ */
export function AdminSidebar({ collapsed, mobileOpen, onClose }) {
  const { logout } = useAuth();
  const navigate    = useNavigate();
  const { pathname } = useLocation();

  const active = (to) => pathname === to || pathname.startsWith(to + '/');

  async function handleLogout() {
    await logout();
    toast.success('Signed out');
    navigate('/login');
    onClose?.();
  }

  const itemBase = cn(
    'relative flex items-center gap-3 w-full rounded-xl text-[14px] font-medium',
    'transition-all duration-150 select-none cursor-pointer h-[48px]',
  );
  const collapsedBase = 'md:justify-center md:px-0 md:mx-auto md:w-11';

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* Sidebar shell */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col h-screen',
          'bg-[#111111] overflow-hidden shrink-0',
          'transition-all duration-300 ease-in-out',
          'md:relative md:z-auto md:translate-x-0',
          collapsed ? 'md:w-[72px]' : 'md:w-[280px]',
          'w-[280px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* ── Brand ───────────────────────────────────────────────── */}
        <div
          className={cn(
            'flex items-center shrink-0 border-b border-white/8 px-5 py-5',
            collapsed ? 'md:justify-center md:px-0' : '',
          )}
        >
          <GetmoreLogo collapsed={collapsed} />
        </div>

        {/* ── Navigation ──────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV.map((item) => {
            const isActive = active(item.to);
            return (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>
                  <div className="relative">
                    {/* Gold left border on active item */}
                    {isActive && !collapsed && (
                      <span className="absolute left-0 top-[8px] bottom-[8px] w-[3px] bg-[#FBBF24] rounded-r-full" />
                    )}
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className={cn(
                        itemBase,
                        isActive
                          ? 'bg-white/8 text-[#FBBF24] font-semibold pl-5 pr-3'
                          : 'text-white/60 hover:text-white hover:bg-white/6 px-3',
                        !isActive && 'px-3',
                        collapsed && collapsedBase,
                      )}
                    >
                      <item.icon
                        className={cn('shrink-0', isActive ? 'text-[#FBBF24]' : 'text-white/50')}
                        size={20}
                        strokeWidth={isActive ? 2.2 : 1.75}
                      />
                      <span className={cn('truncate leading-none', collapsed && 'md:hidden')}>
                        {item.label}
                      </span>
                    </NavLink>
                  </div>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="hidden md:flex font-medium text-xs bg-[#111111] text-white border-white/10">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* ── Footer: DMAX brand + Logout ─────────────────────────── */}
        <div className="shrink-0 border-t border-white/8 px-3 py-3 space-y-1">
          {/* Powered by DMAX */}
          <div className={cn('flex items-center gap-2.5 px-3 py-2 mb-1', collapsed && 'md:justify-center md:px-0')}>
            <img src="/dmax-logo.png" alt="DMAX" className="h-6 w-auto shrink-0 opacity-60" />
            <div className={cn('min-w-0 overflow-hidden', collapsed && 'md:hidden')}>
              <p className="text-[9px] font-semibold text-white/30 uppercase tracking-widest leading-none">Powered by</p>
              <p className="text-[12px] font-bold text-white/50 leading-tight mt-0.5">DMAX</p>
            </div>
          </div>

          {/* Logout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={cn(
                  itemBase,
                  'text-white/40 hover:text-red-400 hover:bg-red-500/10 px-3',
                  collapsed && collapsedBase,
                )}
              >
                <LogOut className="shrink-0" size={20} strokeWidth={1.75} />
                <span className={cn('truncate', collapsed && 'md:hidden')}>Logout</span>
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="hidden md:flex font-medium text-xs bg-[#111111] text-white border-white/10">
                Logout
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
