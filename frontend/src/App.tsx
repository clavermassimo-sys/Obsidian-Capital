/* ============================================================
   Obsidian Capital — Root Application Component
   ============================================================ */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// ── Lazy-loaded Pages ─────────────────────────────────────────
// Split every top-level page into its own chunk for faster initial load.

const LandingPage     = lazy(() => import('@/pages/Landing'));
const LoginPage       = lazy(() => import('@/pages/Login'));
const RegisterPage    = lazy(() => import('@/pages/Register'));
const DashboardPage   = lazy(() => import('@/pages/Dashboard'));
const MarketsPage     = lazy(() => import('@/pages/Markets'));
const PrivatePage     = lazy(() => import('@/pages/Private'));
const ChartsPage      = lazy(() => import('@/pages/Charts'));
const ScreenerPage    = lazy(() => import('@/pages/Screener'));

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
        {/* ── Public / Marketing ─────────────────────────── */}
        <Route path="/" element={<LandingPage />} />

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
          path="/markets"
          element={
            <PrivateRoute>
              <MarketsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/private"
          element={
            <PrivateRoute>
              <PrivatePage />
            </PrivateRoute>
          }
        />
        {/* Charts and Screener pages */}
        <Route path="/charts"    element={<PrivateRoute><ChartsPage /></PrivateRoute>} />
        <Route path="/orders"    element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/screener"  element={<PrivateRoute><ScreenerPage /></PrivateRoute>} />
        <Route path="/watchlist" element={<PrivateRoute><MarketsPage /></PrivateRoute>} />
        <Route path="/settings"  element={<PrivateRoute><DashboardPage /></PrivateRoute>} />

        {/* ── Fallbacks ──────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
