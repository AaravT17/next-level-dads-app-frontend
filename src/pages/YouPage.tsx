import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar,
  ChevronRight,
  Pencil,
  Settings,
  Shield,
  UserPlus,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AppBar } from '@/components/layout/AppBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { Badge } from '@/components/ui/badge'
import { ProfileHero } from '@/features/profile/components/ProfileHero'
import {
  ProfileCard,
  ProfileSection,
} from '@/features/profile/components/ProfileSection'
import { ProfileStats } from '@/features/profile/components/ProfileStats'
import { getStageDisplayLabel } from '@/utils/users'
import { useAuth } from '@/contexts/useAuth'
import { ROUTES } from '@/lib/routes'
import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import type { UserStats } from '@/types/users'

/**
 * Your hub.
 *
 * Splits what used to be a single 979-line screen holding a profile view, an
 * edit form, connections, requests, preferences, legal links, logout and
 * account deletion. Incoming connection requests — a primary action — had no
 * entry point at all; they are now a badged row here.
 */

type Row = {
  label: string
  to: string
  icon: LucideIcon
  badge?: number
  description?: string
}

const YouPage = () => {
  const { user } = useAuth()

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

  const hasDetails =
    Boolean(user.about) ||
    user.children_age_ranges.length > 0 ||
    user.interests.length > 0

  const summary = [
    { label: 'Connections', value: stats?.connections ?? 0 },
    { label: 'Communities', value: stats?.communities_joined ?? 0 },
    { label: 'Events', value: stats?.events_registered_for ?? 0 },
  ]

  return (
    <>
      <AppBar title="You" />

      <PageContainer className="space-y-6 animate-fade-in">
        <ProfileHero
          name={user.name}
          age={user.age}
          city={user.city}
          province={user.province}
          avatarUrl={user.avatarUrl}
        />

        <ProfileStats stats={summary} />

        <ProfileCard
          title="Your profile"
          action={
            <Link
              to={ROUTES.YOU_EDIT}
              className="shrink-0 rounded-md text-label font-medium text-primary transition-colors duration-fast hover:underline"
            >
              Edit
            </Link>
          }
        >
          {hasDetails ? (
            <>
              {user.about && (
                <ProfileSection title="About me">
                  <p className="text-body leading-relaxed text-foreground">
                    {user.about}
                  </p>
                </ProfileSection>
              )}

              {user.children_age_ranges.length > 0 && (
                <ProfileSection title="Children's age">
                  <div className="flex flex-wrap gap-2">
                    {user.children_age_ranges.map((stage) => (
                      <Badge key={stage} variant="soft" className="rounded-md text-caption">
                        <Calendar aria-hidden className="w-3 h-3 mr-1" />
                        {getStageDisplayLabel(stage)}
                      </Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {user.interests.length > 0 && (
                <ProfileSection title="Interests">
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map((interest) => (
                      <Badge key={interest} variant="soft" className="rounded-md text-caption">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}
            </>
          ) : (
            /*
              Every field here is required at save time, so this is the
              pre-migration account rather than the normal empty state. Three
              empty headings would make the page barer than no card at all.
            */
            <p className="text-body text-muted-foreground">
              You have not filled in your bio, interests or children's ages yet.{' '}
              <Link to={ROUTES.YOU_EDIT} className="font-medium text-primary hover:underline">
                Add them
              </Link>{' '}
              so other dads know who they are connecting with.
            </p>
          )}
        </ProfileCard>

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
      </PageContainer>
    </>
  )
}

export default YouPage
