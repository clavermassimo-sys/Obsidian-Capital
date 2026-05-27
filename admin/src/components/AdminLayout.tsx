import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-obsidian overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-obsidian">
        <Outlet />
      </main>
    </div>
  )
}
