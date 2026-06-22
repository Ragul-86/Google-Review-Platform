import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ClientSidebar } from '@/components/ClientSidebar';
import { useAuth } from '@/context/AuthContext';
import { useIdleLogout } from '@/hooks/useIdleLogout';
import { Menu } from 'lucide-react';

export function ClientLayout() {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const client = user?.client;

  // Auto-logout after 15 min of inactivity (warns 60s before)
  useIdleLogout(15, 60);

  function handleMenuToggle() {
    if (window.innerWidth < 768) setMobileOpen((o) => !o);
    else setCollapsed((c) => !c);
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <ClientSidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Header — hamburger + client logo + business name only */}
        <header className="h-16 border-b border-gray-100 bg-white flex items-center px-4 gap-3 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <button
            onClick={handleMenuToggle}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {client?.businessLogo ? (
            <img
              src={client.businessLogo}
              alt={client.businessName}
              className="h-10 w-10 rounded-xl object-cover border border-gray-200 shadow-sm shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded-xl bg-[#111111] flex items-center justify-center shrink-0">
              <span className="text-[#FBBF24] font-extrabold text-lg leading-none">
                {(client?.businessName || 'B')[0].toUpperCase()}
              </span>
            </div>
          )}

          <span className="font-bold text-gray-900 text-[18px] truncate">
            {client?.businessName || 'My Business'}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
