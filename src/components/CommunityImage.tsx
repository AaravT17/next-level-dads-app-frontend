import { useState } from 'react'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { initials } from '@/utils/format'
import { communityTileGradient } from '@/lib/communityTile'

export interface CommunityImageProps {
  /** The community's photo, or null when it has none. */
  src: string | null
  /**
   * The community's name, used to build the fallback tile.
   *
   * Optional because one caller genuinely has no name to give: the create
   * dialog renders this before anything has been typed. Without it the tile
   * falls back to the old grey glyph, which is the honest thing to show for a
   * community that does not exist yet.
   */
  name?: string | null
  className?: string
  /** Intrinsic size in px, written to width/height so the box never reflows while loading. */
  size?: number
  /** Scales the fallback glyph with the box. */
  iconClassName?: string
}

/**
 * A community's photo, with the same fallback everywhere it appears.
 *
 * Communities without a photo are normal, and a URL can also go stale if the
 * file behind it disappears, so both cases land on one placeholder instead of a
 * broken image. The wrapper keeps its size in either case, which is what stops
 * a list from shifting as photos load in.
 *
 * The placeholder is a monogram on a colour drawn from the name — see
 * communityTile. It replaced a single grey glyph, which made every photoless
 * community look like every other one in a list.
 *
 * The photo is decorative: every surface renders it beside the community's
 * name, so an alt would only repeat what is already read out. The monogram is
 * decorative for the same reason — it is the first letters of the name sitting
 * next to the name.
 */
export function CommunityImage({
  src,
  name,
  className,
  size = 80,
  iconClassName = 'w-7 h-7',
}: CommunityImageProps) {
  // Keyed by URL rather than a bare boolean: a card recycled onto a different
  // community gets a fresh chance to load instead of inheriting the failure.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = src !== null && src !== failedSrc
  const showMonogram = !showImage && Boolean(name?.trim())

  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden rounded-md',
        !showImage && 'flex items-center justify-center',
        !showMonogram && 'bg-muted',
        className,
      )}
      style={{
        width: size,
        height: size,
        // Only set on the monogram branch, so a photo keeps its own background
        // and the glyph branch keeps the muted token.
        ...(showMonogram ? { backgroundImage: communityTileGradient(name) } : null),
      }}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(src)}
          className="w-full h-full object-cover"
        />
      ) : showMonogram ? (
        <span
          aria-hidden
          className="font-heading font-semibold leading-none text-white"
          // Scaled off the box rather than a Tailwind step, because the same
          // component renders at 44px in a chat bubble and 96px on a community
          // page, and two initials have to fit both without a size prop per
          // call site.
          style={{ fontSize: Math.round(size * 0.36) }}
        >
          {initials(name)}
        </span>
      ) : (
        <Users
          aria-hidden
          className={cn('text-muted-foreground/60', iconClassName)}
          strokeWidth={1.5}
        />
      )}
    </div>
  )
}
