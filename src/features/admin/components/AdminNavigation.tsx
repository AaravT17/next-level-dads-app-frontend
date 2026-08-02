import { NavLink } from 'react-router-dom'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

type AdminNavigationItem = {
  label: string
  to: string
  end?: boolean
}

const adminNavigationItems: AdminNavigationItem[] =[
    { 
        label: 'Overview',
        to: ROUTES.ADMIN,
        end: true,
    },
    {
        label: 'Organizations',
        to: ROUTES.ADMIN_ORGANIZATIONS,
    },
    { 
        label: 'Partner Messaging',
        to: ROUTES.ADMIN_MESSAGING,
    },
    {
        label: 'Moderation Center',
        to: ROUTES.ADMIN_MODERATION,
    },
]

export function AdminNavigation() {
    return (
        <nav aria-label="Admin Dashboard Navigation" className="space-y-1">
            {adminNavigationItems.map(( { label, to, end }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                        cn(
                            'block rounded-md px-3 py-2 text-sm font-medium transition-colors', 
                            isActive ? 'bg-primary text-primary-foreground'
                                     : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                        )
                    }
                >
                    {label}
                </NavLink>
            ))}
        </nav>
    )
}