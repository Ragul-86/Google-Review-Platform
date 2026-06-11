import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ClientSidebar } from '@/components/ClientSidebar';
import { useAuth } from '@/context/AuthContext';
import { Menu } from 'lucide-react';

export function ClientLayout() {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user } = useAuth();
  const client = user?.client;

  function handleMenuToggle() {
    if (window.innerWidth < 768) {
      setMobileOpen((o) => !o);
    } else {
      setCollapsed((c) => !c);
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ClientSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">

        {/* ── Header — hamburger + logo + name only ─────── */}
        <header className="h-16 border-b border-gray-100 flex items-center px-4 gap-3 shrink-0 bg-white">

          {/* Hamburger */}
          <button
            onClick={handleMenuToggle}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 shrink-0 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Business logo — 44px */}
          {client?.businessLogo ? (
            <img
              src={client.businessLogo}
              alt={client.businessName}
              className="h-11 w-11 rounded-xl object-cover border border-gray-200 shadow-sm shrink-0"
            />
          ) : (
            <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20
                            flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-lg leading-none">
                {(client?.businessName || 'R')[0].toUpperCase()}
              </span>
            </div>
          )}

          {/* Business name */}
          <span className="font-bold text-gray-900 text-[19px] truncate">
            {client?.businessName || 'My Business'}
          </span>
        </header>

        {/* ── Main content ──────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-gray-50/40">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
