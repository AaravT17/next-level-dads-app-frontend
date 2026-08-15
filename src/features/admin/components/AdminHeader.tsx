import { Link } from 'react-router-dom'
import { Bell, PanelLeft, Search } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { ROUTES } from '@/lib/routes'

interface AdminHeaderProps {
  onToggleSidebar: () => void
}

export function AdminHeader({
  onToggleSidebar,
}: AdminHeaderProps) {
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
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 py-3">
      {/* Sidebar toggle */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label="Toggle admin sidebar"
      >
        <PanelLeft className="h-5 w-5" />
      </Button>

      {/* Future global admin search */}
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          type="search"
          placeholder="Search organizations, dads, events..."
          className="pl-9"
          readOnly
        />

        {/*
          TODO:
          Implement global admin search across organizations,
          users, events, and other dashboard resources.
        */}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Environment/context badge */}
        <Badge variant="outline">
          Internal
        </Badge>

        {/* Future notifications */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          disabled
        >
          <Bell className="h-5 w-5" />
        </Button>

        {/*
          TODO:
          Implement admin notifications for new applications,
          events, resources, moderation items, etc.
        */}

        {/* Current admin */}
        <Button
          variant="ghost"
          size="icon"
          asChild
          aria-label={`Open profile for ${adminName}`}
        >
          <Link to={ROUTES.PROFILE}>
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {getInitials(adminName)}
              </AvatarFallback>
            </Avatar>
          </Link>
        </Button>
      </div>
    </header>
  )
}