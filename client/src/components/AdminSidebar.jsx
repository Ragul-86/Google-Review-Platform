import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Tag, MessageSquare,
  BarChart3, Settings, LogOut, Zap,
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

export function AdminSidebar({ collapsed, mobileOpen, onClose }) {
  const { logout } = useAuth();
  const navigate    = useNavigate();
  const { pathname } = useLocation();

  const active = (to) => pathname === to || pathname.startsWith(to + '/');

  async function handleLogout() {
    await logout();
    toast.success('Logged out');
    navigate('/login');
    onClose?.();
  }

  const itemBase = cn(
    'relative flex items-center gap-3 w-full rounded-lg text-[15px]',
    'transition-all duration-150 select-none cursor-pointer h-[48px]',
  );

  const collapsedBase = 'md:justify-center md:px-0 md:mx-auto md:w-11';

  return (
    <TooltipProvider delayDuration={0}>
      {/* ── Mobile backdrop ─────────────────────────────── */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* ── Sidebar shell ───────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col h-screen',
          'bg-white border-r border-gray-200 overflow-hidden shrink-0',
          'transition-all duration-300 ease-in-out',
          'md:relative md:z-auto md:translate-x-0',
          collapsed ? 'md:w-[72px]' : 'md:w-[280px]',
          'w-[280px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >

        {/* ── Brand ───────────────────────────────────────── */}
        <div
          className={cn(
            'flex items-center shrink-0 border-b border-gray-100',
            collapsed
              ? 'md:flex-col md:justify-center md:py-5 md:px-0 px-5 py-5 gap-3'
              : 'px-5 py-5 gap-3.5',
          )}
        >
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
            <Zap size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div className={cn('min-w-0 flex-1 overflow-hidden', collapsed && 'md:hidden')}>
            <p className="font-bold text-gray-900 text-[16px] leading-tight whitespace-nowrap">Review Boost</p>
            <p className="text-[12px] text-gray-400 mt-0.5 font-medium">Super Admin</p>
          </div>
        </div>

        {/* ── Navigation ──────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {NAV.map((item) => {
            const isActive = active(item.to);
            return (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>
                  <div className="relative">
                    {/* Left accent line — only when active */}
                    {isActive && (
                      <span
                        className={cn(
                          'absolute left-0 top-[7px] bottom-[7px] w-[3px] bg-primary rounded-r-full',
                          collapsed && 'md:hidden',
                        )}
                      />
                    )}

                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className={cn(
                        itemBase,
                        isActive
                          ? [
                              /* Active: light bg lift + bold black */
                              'bg-gray-50 text-gray-900 font-semibold',
                              'shadow-[0_1px_3px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]',
                            ]
                          : 'text-gray-500 font-medium hover:text-gray-900 hover:bg-gray-50/70',
                        !collapsed && isActive ? 'pl-4 pr-3' : 'px-3',
                        collapsed && collapsedBase,
                      )}
                    >
                      <item.icon
                        className={cn(
                          'shrink-0 transition-colors',
                          isActive ? 'text-gray-900' : 'text-gray-400',
                        )}
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
                  <TooltipContent side="right" className="hidden md:flex font-medium text-xs">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* ── Logout ──────────────────────────────────────── */}
        <div className="shrink-0 border-t border-gray-100 px-3 py-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={cn(
                  itemBase,
                  'text-gray-400 font-medium hover:text-red-600 hover:bg-red-50 px-3',
                  collapsed && collapsedBase,
                )}
              >
                <LogOut className="shrink-0" size={20} strokeWidth={1.75} />
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
