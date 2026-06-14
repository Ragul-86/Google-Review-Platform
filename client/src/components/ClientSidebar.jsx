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
  const navigate    = useNavigate();
  const { pathname } = useLocation();
  const client      = user?.client;

  const active = (to) => pathname === to || pathname.startsWith(to + '/');

  async function handleLogout() {
    await logout();
    toast.success('Logged out');
    navigate('/login');
    onClose?.();
  }

  const itemBase = [
    'relative flex items-center gap-3 w-full rounded-xl text-[14px] font-medium',
    'transition-all duration-150 select-none cursor-pointer h-[48px]',
  ].join(' ');
  const collapsedBase = 'md:justify-center md:px-0 md:mx-auto md:w-11';

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={[
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* Sidebar shell */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex flex-col h-screen',
          'bg-[#111111] overflow-hidden shrink-0',
          'transition-all duration-300 ease-in-out',
          'md:relative md:z-auto md:translate-x-0',
          collapsed ? 'md:w-[72px]' : 'md:w-[280px]',
          'w-[280px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        {/* Brand area */}
        <div
          className={[
            'flex items-center shrink-0 border-b border-white/[0.08]',
            collapsed ? 'md:flex-col md:justify-center md:py-5 md:px-0 px-5 py-5 gap-3' : 'px-5 py-5 gap-4',
          ].join(' ')}
        >
          {client?.businessLogo ? (
            <img
              src={client.businessLogo}
              alt={client.businessName}
              className="h-11 w-11 rounded-xl object-cover border-2 border-[#FBBF24]/40 shadow-lg shrink-0"
            />
          ) : (
            <div className="h-11 w-11 rounded-xl bg-[#FBBF24] flex items-center justify-center shrink-0 shadow-lg">
              <span className="text-[#111111] font-extrabold text-[20px] leading-none">
                {(client?.businessName || 'B')[0].toUpperCase()}
              </span>
            </div>
          )}
          <div className={['min-w-0 flex-1 overflow-hidden', collapsed ? 'md:hidden' : ''].join(' ')}>
            <p className="font-bold text-white text-[14px] leading-tight break-words line-clamp-2">
              {client?.businessName || 'My Business'}
            </p>
            <p className="text-[11px] text-[#FBBF24]/70 mt-0.5 font-medium">Business Dashboard</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {NAV.map((item) => {
            const isActive = active(item.to);
            return (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>
                  <div className="relative">
                    {isActive && !collapsed && (
                      <span className="absolute left-0 top-[8px] bottom-[8px] w-[3px] bg-[#FBBF24] rounded-r-full" />
                    )}
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className={[
                        itemBase,
                        isActive
                          ? 'bg-white/[0.08] text-[#FBBF24] font-semibold pl-5 pr-3'
                          : 'text-white/55 hover:text-white hover:bg-white/[0.06] px-3',
                        collapsed ? collapsedBase : '',
                      ].join(' ')}
                    >
                      <item.icon
                        className={isActive ? 'shrink-0 text-[#FBBF24]' : 'shrink-0 text-white/45'}
                        size={20}
                        strokeWidth={isActive ? 2.2 : 1.75}
                      />
                      <span className={['truncate leading-none', collapsed ? 'md:hidden' : ''].join(' ')}>
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

        {/* Footer */}
        <div className="shrink-0 border-t border-white/[0.08] px-3 pt-3 pb-3 space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={[
                  collapsed ? 'md:justify-center md:px-0' : '',
                  'client-brand-block',
                ].join(' ')}
              >
                <img
                  src="/getmore-logo.png"
                  alt="GETMORE"
                  draggable="false"
                  className={['client-brand-logo select-none', collapsed ? 'md:mx-auto' : ''].join(' ')}
                />
                <div className={['min-w-0 overflow-hidden', collapsed ? 'md:hidden' : ''].join(' ')}>
                  <p className="text-[9px] font-semibold text-white/30 uppercase tracking-widest leading-none">Powered by</p>
                  <p className="text-[12px] font-bold text-white/50 leading-tight mt-0.5">DMAX</p>
                </div>
              </div>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="hidden md:flex text-xs bg-[#111111] text-white border-white/10">
                Powered by DMAX
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={[
                  itemBase,
                  'text-white/40 hover:text-red-400 hover:bg-red-500/10 px-3',
                  collapsed ? collapsedBase : '',
                ].join(' ')}
              >
                <LogOut className="shrink-0 text-white/35" size={20} strokeWidth={1.75} />
                <span className={['truncate', collapsed ? 'md:hidden' : ''].join(' ')}>Logout</span>
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
