import { Outlet } from 'react-router-dom';
import { AdminNavigation } from './AdminNavigation';

export function AdminDashboardLayout() {
  return (
    
<div className="min-h-screen bg-background">
    <header className="border-b border-border bg-card px-6 py-4">
        <h1 className="text-lg font-semibold">Admin Dashboard</h1>
    </header>

    <div className="flex min-h-[calc(100vh-65px)]">
        <aside className="w-64 border-r border-border bg-card p-4">
            <AdminNavigation />
        </aside>

        <main className="flex-1 p-6">
            <Outlet />
        </main>
    </div>
</div>
  )
}