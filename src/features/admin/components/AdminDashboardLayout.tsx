import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { useState } from 'react';
import { AdminHeader } from './AdminHeader';

export function AdminDashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true)

    return (
        
        <div className="flex min-h-screen bg-background">
            {/* Left side: sidebar */}
             {sidebarOpen && (
                <aside className="w-64 shrink-0 border-r border-border bg-card">
                    <AdminSidebar />
                </aside>
            )}

            {/* Right side: header + page */}
            <div className="flex min-w-0 flex-1 flex-col flex-col">
                <AdminHeader
                    onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
                />

                <main className="flex-1 overflow-auto px-10 py-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}