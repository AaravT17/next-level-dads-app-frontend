import { NavLink } from 'react-router-dom'
import {
  Building2,
  Home,
  LayoutDashboard,
  MessageSquare,
  Shield,
} from 'lucide-react'
import logo from '@/assets/logo.png'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

type AdminNavigationItem = {
  label: string
  to: string
  end?: boolean
  icon: React.ComponentType<{ className?: string }>
}

const adminNavigationItems: AdminNavigationItem[] = [
  {
    label: 'Overview',
    to: ROUTES.ADMIN,
    end: true,
    icon: LayoutDashboard,
  },
  {
    label: 'Organizations',
    to: ROUTES.ADMIN_ORGANIZATIONS,
    icon: Building2,
  },
  {
    label: 'Partner Messaging',
    to: ROUTES.ADMIN_MESSAGING,
    icon: MessageSquare,
  },
  {
    label: 'Moderation Center',
    to: ROUTES.ADMIN_MODERATION,
    icon: Shield,
  },

  // TODO: Add Events navigation.
]

export function AdminSidebar() {
  const { user } = useAuth()

  const adminName = user?.name ?? 'Admin'

  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Branding */}
      <div className="flex min-h-20items-center gap-3 px-5 py-5">
        <img
          src={logo}
          alt="Next Level Dads"
          className="h-10 w-10 object-contain"
        />

        <div>
          <p className="font-semibold">
            Next Level Dads
          </p>

          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Internal Dashboard
          </p>
        </div>
      </div>

      <Separator />

      {/* Main navigation */}
      <div className="flex-1 px-3 py-5">
        <p className="mb-2 px-3 text-sm font-medium text-muted-foreground">
          Workspace
        </p>

        <nav
          aria-label="Admin Dashboard Navigation"
          className="space-y-1"
        >
          {adminNavigationItems.map(
            ({ label, to, end, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ),
          )}
        </nav>

        {/* Future admin route */}
        {/*
          TODO:
          Add Events here.

          Example:

          <NavLink to={ROUTES.ADMIN_EVENTS}>
            Events
          </NavLink>
        */}

        <div className="mt-8">
          <p className="mb-2 px-3 text-sm font-medium text-muted-foreground">
            Ecosystem
          </p>

          <nav
            aria-label="Next Level Dads Ecosystem Navigation"
            className="space-y-1"
          >
            <NavLink
              to={ROUTES.DISCOVER}
              className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Home className="h-4 w-4" />
              <span>Back to dad app</span>
            </NavLink>

            {/*
              TODO:
              Add link to Partner Portal once the deployed
              partner portal route/domain is available.
            */}
          </nav>
        </div>
      </div>

      {/* Current logged in admin info*/}
      <div>
        <Separator />

        <div className="flex items-center gap-3 px-5 py-4">
          <Avatar>
            <AvatarFallback>
              {getInitials(adminName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {adminName}
            </p>

            <p className="text-xs text-muted-foreground">
              NLD Admin
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}