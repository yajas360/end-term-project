import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { MedicationProvider } from './context/MedicationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Lazy-loaded pages (React.lazy + Suspense for code splitting)
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const MedicationsPage = lazy(() => import('./pages/MedicationsPage'));
const InteractionsPage = lazy(() => import('./pages/InteractionsPage'));
const TrackerPage = lazy(() => import('./pages/TrackerPage'));
const PRNPage = lazy(() => import('./pages/PRNPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Page-level loading fallback
function PageLoader() {
  return (
    <div className="loading-fullscreen" style={{ minHeight: 400 }}>
      <div className="spinner" />
      <span className="text-muted text-sm">Loading page...</span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MedicationProvider>
          {/* Global toast notifications */}
          <Toaster
            position="top-right"
            gutter={8}
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--neutral-800)',
                color: 'var(--neutral-100)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontFamily: 'Inter, sans-serif',
                boxShadow: 'var(--shadow-lg)',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />

          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected routes — wrapped in Layout */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/medications" element={<MedicationsPage />} />
                  <Route path="/interactions" element={<InteractionsPage />} />
                  <Route path="/tracker" element={<TrackerPage />} />
                  <Route path="/prn" element={<PRNPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Route>
              </Route>

              {/* 404 fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </MedicationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
