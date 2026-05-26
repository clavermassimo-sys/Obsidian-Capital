/* ============================================================
   Obsidian Capital — Root Application Component
   ============================================================ */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// ── Lazy-loaded Pages ─────────────────────────────────────────
// Split every top-level page into its own chunk for faster initial load.

const LoginPage       = lazy(() => import('@/pages/LoginPage'));
const RegisterPage    = lazy(() => import('@/pages/RegisterPage'));
const DashboardPage   = lazy(() => import('@/pages/DashboardPage'));
const TradingPage     = lazy(() => import('@/pages/TradingPage'));
const PortfolioPage   = lazy(() => import('@/pages/PortfolioPage'));
const HistoryPage     = lazy(() => import('@/pages/HistoryPage'));
const AccountPage     = lazy(() => import('@/pages/AccountPage'));

// ── Loading Fallback ──────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-obsidian">
      <div className="flex flex-col items-center gap-4">
        {/* Animated gold ring */}
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-gold/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold animate-spin" />
        </div>
        <span className="text-xs font-sans tracking-[0.2em] uppercase text-off-white/30">
          Loading
        </span>
      </div>
    </div>
  );
}

// ── Route Guards ──────────────────────────────────────────────

/** Redirect authenticated users away from auth pages */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

/** Redirect unauthenticated users to login */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// ── App ───────────────────────────────────────────────────────

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public ─────────────────────────────────────── */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* ── Protected ──────────────────────────────────── */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/trade"
          element={
            <PrivateRoute>
              <TradingPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/trade/:ticker"
          element={
            <PrivateRoute>
              <TradingPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/portfolio"
          element={
            <PrivateRoute>
              <PortfolioPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/history"
          element={
            <PrivateRoute>
              <HistoryPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/account"
          element={
            <PrivateRoute>
              <AccountPage />
            </PrivateRoute>
          }
        />

        {/* ── Fallbacks ──────────────────────────────────── */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
