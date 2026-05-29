import { ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { isAdminAuthenticated } from './services/api'
import AdminLayout from './components/AdminLayout'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminTrades from './pages/AdminTrades'
import AdminRevenue from './pages/AdminRevenue'
import AdminCompliance from './pages/AdminCompliance'
import AdminCommissions from './pages/AdminCommissions'

function RequireAuth({ children }: { children: ReactNode }) {
  if (!isAdminAuthenticated()) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="trades" element={<AdminTrades />} />
        <Route path="revenue" element={<AdminRevenue />} />
        <Route path="commissions" element={<AdminCommissions />} />
        <Route path="compliance" element={<AdminCompliance />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default App
