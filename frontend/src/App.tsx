/* ============================================================
   Obsidian Capital — Root Application Component
   ============================================================ */

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AppLayout from './components/layout/AppLayout';
import { useAuth } from './contexts/AuthContext';

// ── Lazy-loaded Pages ─────────────────────────────────────────

const Landing    = React.lazy(() => import('./pages/Landing'));
const Login      = React.lazy(() => import('./pages/Login'));
const Register   = React.lazy(() => import('./pages/Register'));
const Dashboard  = React.lazy(() => import('./pages/Dashboard'));
const Markets    = React.lazy(() => import('./pages/Markets'));
const Charts     = React.lazy(() => import('./pages/Charts'));
const Orders     = React.lazy(() => import('./pages/Orders'));
const Screener   = React.lazy(() => import('./pages/Screener'));
const Private    = React.lazy(() => import('./pages/Private'));
const Settings   = React.lazy(() => import('./pages/Settings'));
const FeeSchedule = React.lazy(() => import('./pages/FeeSchedule'));
const Terms      = React.lazy(() => import('./pages/Terms'));
const Privacy    = React.lazy(() => import('./pages/Privacy'));

// ── Page Transition Wrapper ───────────────────────────────────

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// ── Loading Fallback ──────────────────────────────────────────

const LoadingFallback = () => (
  <div className="min-h-screen bg-obsidian flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
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

// ── Route Guards ──────────────────────────────────────────────

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingFallback />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingFallback />;
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

// ── Animated Routes ───────────────────────────────────────────

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* ── Public / Marketing ──────────────────────────── */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <PageTransition>
                <Landing />
              </PageTransition>
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <PageTransition>
                <Login />
              </PageTransition>
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <PageTransition>
                <Register />
              </PageTransition>
            </PublicRoute>
          }
        />

        {/* ── Legal Pages (public) ─────────────────────────── */}
        <Route
          path="/fees"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <PageTransition>
                <FeeSchedule />
              </PageTransition>
            </Suspense>
          }
        />
        <Route
          path="/terms"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <PageTransition>
                <Terms />
              </PageTransition>
            </Suspense>
          }
        />
        <Route
          path="/privacy"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <PageTransition>
                <Privacy />
              </PageTransition>
            </Suspense>
          }
        />

        {/* ── Protected — nested inside AppLayout ────────── */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <PageTransition>
                  <Dashboard />
                </PageTransition>
              </Suspense>
            }
          />
          <Route
            path="markets"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <PageTransition>
                  <Markets />
                </PageTransition>
              </Suspense>
            }
          />
          <Route
            path="charts"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <PageTransition>
                  <Charts />
                </PageTransition>
              </Suspense>
            }
          />
          <Route
            path="charts/:symbol"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <PageTransition>
                  <Charts />
                </PageTransition>
              </Suspense>
            }
          />
          <Route
            path="orders"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <PageTransition>
                  <Orders />
                </PageTransition>
              </Suspense>
            }
          />
          <Route
            path="screener"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <PageTransition>
                  <Screener />
                </PageTransition>
              </Suspense>
            }
          />
          <Route
            path="private"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <PageTransition>
                  <Private />
                </PageTransition>
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <PageTransition>
                  <Settings />
                </PageTransition>
              </Suspense>
            }
          />
          <Route
            path="settings/:tab"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <PageTransition>
                  <Settings />
                </PageTransition>
              </Suspense>
            }
          />
        </Route>

        {/* ── Fallback ────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

// ── App ───────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <AnimatedRoutes />
      </Suspense>
    </BrowserRouter>
  );
}
