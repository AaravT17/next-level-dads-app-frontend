import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { useState } from 'react';
import { AdminHeader } from './AdminHeader';

export function AdminDashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true)

    // Adjustable admin sidebar background.
    const ADMIN_SIDEBAR_BG = 'bg-[hsl(var(--muted)/0.15)]'

    // Adjustable admin header background.
    const ADMIN_HEADER_BG = 'bg-[hsl(var(--card)/0.45)]'

    return (
        
        <div className="flex min-h-screen">
            {/* Left side: sidebar */}
             {sidebarOpen && (
                <aside className={`w-64 shrink-0 border-r border-border ${ADMIN_SIDEBAR_BG}`}>
                    <AdminSidebar />
                </aside>
            )}

            {/* Right side: header + page */}
            <div className="flex min-w-0 flex-1 flex-col border-b border-border">
                <header className={ADMIN_HEADER_BG}>
                    <AdminHeader
                        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
                    />
                </header>
                <main className="flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}