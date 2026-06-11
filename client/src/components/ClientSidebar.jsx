import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Inbox, BarChart3, QrCode,
  Users, Tag, FileDown, Settings, LogOut, Wrench,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

const NAV = [
  { to: '/client/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/client/reviews',    label: 'Reviews',    icon: MessageSquare },
  { to: '/client/feedback',   label: 'Feedback',   icon: Inbox },
  { to: '/client/analytics',  label: 'Analytics',  icon: BarChart3 },
  { to: '/client/qrcodes',    label: 'QR Codes',   icon: QrCode },
  { to: '/client/customers',  label: 'Customers',  icon: Users },
  { to: '/client/services',   label: 'Services',   icon: Wrench },
  { to: '/client/categories', label: 'Categories', icon: Tag },
  { to: '/client/reports',    label: 'Reports',    icon: FileDown },
  { to: '/client/settings',   label: 'Settings',   icon: Settings },
];

export function ClientSidebar({ collapsed, mobileOpen, onClose }) {
  const { logout, user } = useAuth();
  const navigate   = useNavigate();
  const { pathname } = useLocation();
  const client     = user?.client;

  const active = (to) => pathname === to || pathname.startsWith(to + '/');

  async function handleLogout() {
    await logout();
    toast.success('Logged out');
    navigate('/login');
    onClose?.();
  }

  /* ─── shared item style ──────────────────────────────────────────── */
  const itemBase = cn(
    'relative flex items-center gap-3.5 w-full rounded-lg text-[13.5px] font-medium',
    'transition-colors duration-150 select-none cursor-pointer',
    'h-[50px]',
  );

  const itemActive   = 'bg-primary/[0.08] text-primary font-semibold';
  const itemInactive = 'text-gray-500 hover:text-gray-900 hover:bg-gray-50';

  /* ─── collapsed icon-only wrapper ───────────────────────────────── */
  const collapsedBase = 'md:justify-center md:px-0 md:mx-auto md:w-10';

  return (
    <TooltipProvider delayDuration={0}>
      {/* ── Mobile backdrop ───────────────────────────── */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* ── Sidebar shell ─────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col h-screen',
          'bg-white border-r border-gray-100 overflow-hidden shrink-0',
          'transition-all duration-300 ease-in-out',
          /* desktop — stay in flex flow */
          'md:relative md:z-auto md:translate-x-0',
          collapsed ? 'md:w-[72px]' : 'md:w-[250px]',
          /* mobile drawer */
          'w-[250px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >

        {/* ── Brand area ────────────────────────────────── */}
        <div
          className={cn(
            'flex items-center shrink-0 border-b border-gray-100',
            collapsed
              ? 'md:flex-col md:justify-center md:py-5 md:px-0 px-5 py-5 gap-3'
              : 'px-5 py-5 gap-4',
          )}
        >
          {/* Logo — 48px */}
          {client?.businessLogo ? (
            <img
              src={client.businessLogo}
              alt={client.businessName}
              className="h-12 w-12 rounded-xl object-cover border border-gray-200 shadow-sm shrink-0"
            />
          ) : (
            <div
              className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10
                         border border-primary/20 flex items-center justify-center shrink-0"
            >
              <span className="text-primary font-bold text-[22px] leading-none">
                {(client?.businessName || 'R')[0].toUpperCase()}
              </span>
            </div>
          )}

          {/* Name + subtitle — hidden on desktop collapsed */}
          <div className={cn('min-w-0 flex-1 overflow-hidden', collapsed && 'md:hidden')}>
            <p className="font-bold text-gray-900 text-[15px] leading-tight truncate">
              {client?.businessName || 'My Business'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Business Dashboard</p>
          </div>
        </div>

        {/* ── Navigation ────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV.map((item) => {
            const isActive = active(item.to);
            return (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>
                  {/* Relative wrapper for left-border indicator */}
                  <div className="relative">
                    {/* Active left indicator — only on expanded desktop */}
                    {isActive && (
                      <span
                        className={cn(
                          'absolute left-0 top-[8px] bottom-[8px] w-[3px] bg-primary rounded-r-full',
                          collapsed && 'md:hidden',
                        )}
                      />
                    )}
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className={cn(
                        itemBase,
                        isActive ? itemActive : itemInactive,
                        /* expanded: left indent to clear indicator */
                        !collapsed && isActive ? 'pl-4 pr-3' : 'px-3',
                        /* desktop collapsed: center icon */
                        collapsed && collapsedBase,
                      )}
                    >
                      <item.icon
                        className={cn(
                          'shrink-0 transition-colors',
                          isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-700',
                        )}
                        size={20}
                        strokeWidth={isActive ? 2 : 1.75}
                      />
                      <span className={cn('truncate leading-none', collapsed && 'md:hidden')}>
                        {item.label}
                      </span>
                    </NavLink>
                  </div>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="hidden md:flex font-medium text-xs">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* ── Sidebar footer — DMAX branding + Logout ───── */}
        <div className="shrink-0 border-t border-gray-100 px-3 pt-3 pb-3 space-y-1">

          {/* Powered by DMAX */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg',
                  collapsed && 'md:justify-center md:px-0',
                )}
              >
                {/* DMAX logo — 28px height */}
                <img
                  src="/dmax-logo.png"
                  alt="DMAX"
                  className="h-7 w-auto shrink-0 opacity-70"
                />
                <div className={cn('min-w-0 overflow-hidden', collapsed && 'md:hidden')}>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider leading-none">
                    Powered by
                  </p>
                  <p className="text-[12px] font-bold text-gray-500 leading-tight mt-0.5">
                    DMAX
                  </p>
                </div>
              </div>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="hidden md:flex text-xs">
                Powered by DMAX
              </TooltipContent>
            )}
          </Tooltip>

          {/* Logout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={cn(
                  itemBase,
                  'text-gray-500 hover:text-red-600 hover:bg-red-50',
                  'px-3',
                  collapsed && collapsedBase,
                )}
              >
                <LogOut
                  className="shrink-0 text-gray-400"
                  size={20}
                  strokeWidth={1.75}
                />
                <span className={cn('truncate', collapsed && 'md:hidden')}>Logout</span>
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="hidden md:flex font-medium text-xs">
                Logout
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
