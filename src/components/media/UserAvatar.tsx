import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { initials } from '@/utils/format'
import { cn } from '@/lib/utils'

/**
 * The single avatar treatment for the app.
 *
 * Built on Radix so a broken image URL falls back to initials. The
 * hand-rolled `<img>` + initials-div pairs this replaces only handled a
 * *missing* url, so an avatar whose upload 404s rendered as a broken image.
 */

export type UserAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type UserAvatarProps = {
  name: string | null | undefined
  src?: string | null
  /** xs 32 · sm 40 · md 56 · lg 80 · xl 128 (px) */
  size?: UserAvatarSize
  /** 'rounded' is the card and profile-hero treatment. */
  shape?: 'circle' | 'rounded'
  className?: string
}

const SIZE: Record<UserAvatarSize, string> = {
  xs: 'w-8 h-8 text-caption',
  sm: 'w-10 h-10 text-label',
  md: 'w-14 h-14 text-subhead',
  lg: 'w-20 h-20 text-heading',
  xl: 'w-32 h-32 text-display',
}

export function UserAvatar({
  name,
  src,
  size = 'sm',
  shape = 'circle',
  className,
}: UserAvatarProps) {
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-lg'
  return (
    <Avatar className={cn(SIZE[size], radius, 'shrink-0', className)}>
      <AvatarImage src={src ?? undefined} alt={name ?? ''} className={radius} />
      <AvatarFallback
        className={cn(radius, 'bg-primary text-primary-foreground font-heading font-semibold')}
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
