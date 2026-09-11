import type { ReactNode } from 'react'
import { MapPin } from 'lucide-react'
import { UserAvatar } from '@/components/media/UserAvatar'
import { Spinner } from '@/components/feedback/Spinner'
import { cn } from '@/lib/utils'

/**
 * The avatar-name-location block at the top of a profile screen.
 *
 * Three screens draw this — /dads/:id, /you/edit and /you — and until now each
 * drew it slightly differently: two hand-rolled the avatar that UserAvatar was
 * written to replace, and the name ranged from 20px to 24px depending on which
 * page you were on. One component so the profile you view, the profile you
 * edit and your own hub cannot drift apart again.
 *
 * The name is set at `display`. It is the largest type in the app, and it
 * should be: this block exists to answer "who is this", and every screen that
 * shows it has already given up its whole first fold to the question.
 */

export type ProfileHeroProps = {
  name: string
  /** Rendered as "Nadia, 38". Dropped entirely when unknown — an em dash where
   *  an age should be reads as a broken field rather than an absent one. */
  age?: number | null
  city?: string | null
  province?: string | null
  avatarUrl?: string | null
  /** Small-caps line above the name. Connection status, on /dads/:id. */
  eyebrow?: ReactNode
  /** Pinned to the avatar's lower-right corner — the photo menu on /you/edit.
   *  The caller owns its positioning, since only it knows the control's size. */
  avatarAction?: ReactNode
  /** Dims the avatar behind a spinner while a new photo uploads. */
  isAvatarBusy?: boolean
  /** Actions under the hero, e.g. Connect / Chat. */
  children?: ReactNode
  className?: string
}

export function ProfileHero({
  name,
  age,
  city,
  province,
  avatarUrl,
  eyebrow,
  avatarAction,
  isAvatarBusy = false,
  children,
  className,
}: ProfileHeroProps) {
  // Both halves are independently optional, so a missing province must not
  // leave a dangling comma under the name.
  const location = [city, province].filter(Boolean).join(', ')
  const title = age ? `${name}, ${age}` : name

  return (
    <header className={cn('flex flex-col items-center gap-5 text-center', className)}>
      <div className="relative">
        <UserAvatar
          name={name}
          src={avatarUrl}
          size="xl"
          shape="rounded"
          className={cn(
            'border-4 border-primary/20 shadow-md transition-opacity duration-base',
            isAvatarBusy && 'opacity-50',
          )}
        />
        {isAvatarBusy ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner size="lg" label="Updating photo" />
          </div>
        ) : null}
        {avatarAction}
      </div>

      <div className="space-y-1.5">
        {eyebrow ? (
          <p className="text-overline uppercase text-primary">{eyebrow}</p>
        ) : null}

        <h2 className="font-heading text-display text-foreground">{title}</h2>

        {location ? (
          <p className="flex items-center justify-center gap-1.5 text-body text-muted-foreground">
            <MapPin aria-hidden className="h-4 w-4 shrink-0" />
            {location}
          </p>
        ) : null}
      </div>

      {children}
    </header>
  )
}
