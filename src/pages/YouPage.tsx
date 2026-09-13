import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Baby,
  ChevronRight,
  LogOut,
  MapPin,
  Pencil,
  Settings,
  Shield,
  UserPlus,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AppBar } from '@/components/layout/AppBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { UserAvatar } from '@/components/media/UserAvatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/useAuth'
import { ROUTES } from '@/lib/routes'
import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import type { UserStats } from '@/types/users'

/**
 * Your hub.
 *
 * Shows your profile info, stats, and account navigation.
 */

type Row = {
  label: string
  to: string
  icon: LucideIcon
  badge?: number
  description?: string
}

const YouPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, setAuth } = useAuth()

  const { data: stats } = useQuery({
    queryKey: ['user', 'stats'],
    queryFn: async () => {
      const res = await axiosPrivate.get<UserStats>('/api/users/me/stats', {
        timeout: TIMEOUT_LENGTH_MS,
      })
      return res.data
    },
    staleTime: 1000 * 60,
  })

  const handleLogout = async () => {
    try {
      await axiosPrivate.post('/api/auth/logout', {}, { timeout: TIMEOUT_LENGTH_MS })
    } catch {
      // Log out locally even if the server call fails.
    } finally {
      queryClient.clear()
      setAuth({ user: null, accessToken: null })
      navigate(ROUTES.WELCOME)
    }
  }

  if (!user) return null

  const rows: Row[] = [
    {
      label: 'Connection requests',
      to: ROUTES.REQUESTS,
      icon: UserPlus,
      badge: stats?.requests ?? 0,
      description: 'Dads who want to connect with you',
    },
    {
      label: 'Connections',
      to: ROUTES.CONNECTIONS,
      icon: Users,
      description: 'Dads you are connected with',
    },
    {
      label: 'Edit profile',
      to: ROUTES.YOU_EDIT,
      icon: Pencil,
      description: 'Photo, bio, interests and location',
    },
    {
      label: 'Settings',
      to: ROUTES.YOU_SETTINGS,
      icon: Settings,
      description: 'Preferences, legal and account',
    },
    ...(user.isAdmin
      ? [
          {
            label: 'Moderation dashboard',
            to: ROUTES.ADMIN,
            icon: Shield,
            description: 'Review reported content',
          } satisfies Row,
        ]
      : []),
  ]

  const summary = [
    { label: 'Connections', value: stats?.connections ?? 0 },
    { label: 'Communities', value: stats?.communities_joined ?? 0 },
    { label: 'Events', value: stats?.events_registered_for ?? 0 },
  ]

  return (
    <>
      <AppBar title="You" />

      <PageContainer className="space-y-6 animate-fade-in">
        {/* Avatar + name + location + kids */}
        <section className="flex flex-col items-center text-center gap-3">
          <UserAvatar name={user.name} src={user.avatarUrl} size="xl" shape="rounded" />
          <div>
            <h2 className="font-heading text-heading text-foreground">{user.name}</h2>
            {(user.city || user.province) && (
              <div className="flex items-center justify-center gap-1 text-muted-foreground mt-1">
                <MapPin className="w-4 h-4" />
                <span>{[user.city, user.province].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {user.kid_count != null && user.kid_count > 0 && (
              <div className="flex items-center justify-center gap-1 text-muted-foreground mt-1">
                <Baby className="w-4 h-4" />
                <span>Dad of {user.kid_count}</span>
              </div>
            )}
          </div>
        </section>

        {/* Stats */}
        <section aria-label="Your activity" className="grid grid-cols-3 rounded-lg bg-card shadow-sm">
          {summary.map((item, i) => (
            <div
              key={item.label}
              className={`px-2 py-4 text-center ${i > 0 ? 'border-l border-border' : ''}`}
            >
              <p className="font-heading text-heading text-foreground">{item.value}</p>
              <p className="text-caption text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </section>

        {/* Navigation */}
        <nav aria-label="Account">
          <ul role="list" className="overflow-hidden rounded-lg bg-card shadow-sm">
            {rows.map((row, i) => {
              const Icon = row.icon
              return (
                <li key={row.to} className={i > 0 ? 'border-t border-border' : ''}>
                  <Link
                    to={row.to}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-fast hover:bg-muted/50 active:scale-[0.995]"
                  >
                    <Icon aria-hidden className="w-5 h-5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-label text-foreground">{row.label}</span>
                      {row.description && (
                        <span className="block text-caption text-muted-foreground truncate">
                          {row.description}
                        </span>
                      )}
                    </span>
                    {row.badge ? (
                      <span className="shrink-0 min-w-[1.375rem] rounded-md bg-destructive px-1.5 py-0.5 text-center text-caption font-semibold text-destructive-foreground">
                        {row.badge > 99 ? '99+' : row.badge}
                        <span className="sr-only"> pending</span>
                      </span>
                    ) : null}
                    <ChevronRight aria-hidden className="w-4 h-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Log out */}
        <Button variant="outline" className="w-full rounded-md" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </Button>
      </PageContainer>
    </>
  )
}

export default YouPage
