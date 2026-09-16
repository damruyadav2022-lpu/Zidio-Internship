import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './hooks/useTheme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { AppLayout } from './layouts/AppLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { ProductPage } from './pages/public/ProductPage';
import { SolutionsPage } from './pages/public/SolutionsPage';
import { PricingPage } from './pages/public/PricingPage';
import { DocsPage } from './pages/public/DocsPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// App Pages
import { OverviewPage } from './pages/app/OverviewPage';
import { CustomersPage } from './pages/app/CustomersPage';
import { SegmentationPage } from './pages/app/SegmentationPage';
import { ChurnPage } from './pages/app/ChurnPage';
import { ForecastPage } from './pages/app/ForecastPage';
import { InventoryPage } from './pages/app/InventoryPage';
import { MLOpsPage } from './pages/app/MLOpsPage';
import { AlertsPage } from './pages/app/AlertsPage';
import { SettingsPage } from './pages/app/SettingsPage';
import { BillingPage } from './pages/app/BillingPage';
import { IntegrationsPage } from './pages/app/IntegrationsPage';
import { AuditLogsPage } from './pages/app/AuditLogsPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Verifying RetailPulse credentials...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Create TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
              {/* Public Marketing & Educational Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/product" element={<ProductPage />} />
                <Route path="/solutions" element={<SolutionsPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/docs" element={<DocsPage />} />
              </Route>

              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Authenticated SaaS Platform Routes */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/app/overview" replace />} />
                <Route path="overview" element={<OverviewPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="segmentation" element={<SegmentationPage />} />
                <Route path="churn" element={<ChurnPage />} />
                <Route path="forecast" element={<ForecastPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="mlops" element={<MLOpsPage />} />
                <Route path="integrations" element={<IntegrationsPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route path="alerts" element={<AlertsPage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
