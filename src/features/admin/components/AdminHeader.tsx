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
    <div className="flex h-14 items-center gap-4 px-4 py-3">
      {/* Sidebar toggle */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label="Toggle admin sidebar"
        className="hover:bg-transparent hover:text-primary transition-colors [&_svg]:size-5"
      >
        <PanelLeft />
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

       {/* Environment badge */}
      <Badge 
        variant="outline"
        className="bg-muted text-muted-foreground">
        Internal
      </Badge>

      <div className="ml-auto flex items-center">
        {/* Future notifications */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="hover:bg-transparent hover:text-primary transition-colors [&_svg]:size-5"
          disabled
        >
          <Bell className="h-5 w-5" />
        </Button>

        {/*
          TODO:
          Implement admin notifications for new applications,
          events, resources, moderation items, etc.
        */}

        {/* Current admin logged in*/}
        <Button
          variant="ghost"
          size="icon"
          asChild
          aria-label={`Open profile for ${adminName}`}
          className="hover:bg-transparent hover:opacity-80 transition-opacity"
        >
          <Link to={ROUTES.PROFILE}>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-secondary-foreground text-background">
                {getInitials(adminName)}
              </AvatarFallback>
            </Avatar>
          </Link>
        </Button>
      </div>
    </div>
  )
}