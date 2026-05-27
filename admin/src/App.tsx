import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminTrades from './pages/AdminTrades'
import AdminRevenue from './pages/AdminRevenue'
import AdminCompliance from './pages/AdminCompliance'

function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="trades" element={<AdminTrades />} />
        <Route path="revenue" element={<AdminRevenue />} />
        <Route path="compliance" element={<AdminCompliance />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default App
