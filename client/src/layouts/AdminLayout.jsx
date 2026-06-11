import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Menu, Sparkles } from 'lucide-react';

export function AdminLayout() {
  // Desktop: collapsed by default (icons only)
  const [collapsed, setCollapsed] = useState(true); // desktop: icons-only by default
  // Mobile: drawer hidden by default
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleMenuToggle() {
    if (window.innerWidth < 768) {
      setMobileOpen((o) => !o);
    } else {
      setCollapsed((c) => !c);
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* ── Admin header ──────────────────────────────── */}
        <header className="h-14 border-b flex items-center px-4 gap-3 shrink-0 bg-background">
          <button
            onClick={handleMenuToggle}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Super Admin</span>
          </div>
        </header>

        {/* ── Main content ──────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
