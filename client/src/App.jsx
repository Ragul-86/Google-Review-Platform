import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ClientLayout } from '@/layouts/ClientLayout';

// Auth pages
import Login from '@/pages/auth/Login';
import SetPassword from '@/pages/auth/SetPassword';

// Admin pages
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminClients from '@/pages/admin/Clients';
import AdminCategories from '@/pages/admin/Categories';
import AdminReviews from '@/pages/admin/Reviews';
import AdminAnalytics from '@/pages/admin/Analytics';
import AdminReports from '@/pages/admin/Reports';
import AdminSettings from '@/pages/admin/Settings';
import AdminUsers from '@/pages/admin/Users';

// Client pages
import ClientDashboard from '@/pages/client/Dashboard';
import ClientReviews from '@/pages/client/Reviews';
import ClientFeedback from '@/pages/client/Feedback';
import ClientQRCodes from '@/pages/client/QRCodes';
import ClientAnalytics from '@/pages/client/Analytics';
import ClientCustomers  from '@/pages/client/Customers';
import ClientServices   from '@/pages/client/Services';
import ScratchCardSettings from '@/pages/client/ScratchCardSettings';
import RewardManagement from '@/pages/client/RewardManagement';
import ClientCategories from '@/pages/client/Categories';
import ClientReports from '@/pages/client/Reports';
import ClientSettings from '@/pages/client/Settings';

// Public pages
import ReviewPage from '@/pages/public/ReviewPage';
import Landing from '@/pages/Landing';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Root */}
              <Route path="/" element={<Landing />} />

              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/set-password" element={<SetPassword />} />

              {/* Public review page */}
              <Route path="/review/:slug" element={<ReviewPage />} />

              {/* Super Admin routes */}
              <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/clients" element={<AdminClients />} />
                  <Route path="/admin/categories" element={<AdminCategories />} />
                  <Route path="/admin/reviews" element={<AdminReviews />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  <Route path="/admin/reports" element={<AdminReports />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                </Route>
              </Route>

              {/* Client Admin routes */}
              <Route element={<ProtectedRoute allowedRoles={['clientadmin']} />}>
                <Route element={<ClientLayout />}>
                  <Route path="/client" element={<Navigate to="/client/dashboard" replace />} />
                  <Route path="/client/dashboard" element={<ClientDashboard />} />
                  <Route path="/client/reviews" element={<ClientReviews />} />
                  <Route path="/client/feedback" element={<ClientFeedback />} />
                  <Route path="/client/qrcodes"    element={<ClientQRCodes />} />
                  <Route path="/client/customers"  element={<ClientCustomers />} />
                  <Route path="/client/services"   element={<ClientServices />} />
                  <Route path="/client/rewards" element={<RewardManagement />} />
                  <Route path="/client/scratch-card-settings" element={<ScratchCardSettings />} />
                  <Route path="/client/analytics" element={<ClientAnalytics />} />
                  <Route path="/client/categories" element={<ClientCategories />} />
                  <Route path="/client/reports" element={<ClientReports />} />
                  <Route path="/client/settings" element={<ClientSettings />} />
                </Route>
              </Route>

              {/* 404 */}
              <Route path="*" element={
                <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
                  <h1 className="text-4xl font-bold mb-2">404</h1>
                  <p className="text-muted-foreground">Page not found</p>
                </div>
              } />
            </Routes>
          </BrowserRouter>
          <Toaster richColors position="top-right" duration={3000} closeButton toastOptions={{ style: { fontSize: '14px' } }} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
