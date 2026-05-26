/* ============================================================
   Obsidian Capital — Application Entry Point
   ============================================================ */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from '@/contexts/AuthContext';
import { TradingProvider } from '@/contexts/TradingContext';

import App from './App';
import '@/index.css';

// ── React Query Client ────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 60 seconds before considering it stale
      staleTime: 60 * 1000,
      // Keep unused data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry once on failure; financial data errors often persist
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
      // Don't refetch when window regains focus in development
      refetchOnWindowFocus: import.meta.env.PROD,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ── Root Element ──────────────────────────────────────────────

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    '[Obsidian Capital] Fatal: #root element not found in the document. ' +
    'Ensure index.html contains <div id="root"></div>.'
  );
}

// ── Mount ─────────────────────────────────────────────────────

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TradingProvider>
            <App />
          </TradingProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
