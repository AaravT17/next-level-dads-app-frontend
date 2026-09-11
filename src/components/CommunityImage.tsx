import { useState } from 'react'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CommunityImageProps {
  /** The community's photo, or null when it has none. */
  src: string | null
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
 * The photo is decorative: every surface renders it beside the community's
 * name, so an alt would only repeat what is already read out.
 */
export function CommunityImage({
  src,
  className,
  size = 80,
  iconClassName = 'w-7 h-7',
}: CommunityImageProps) {
  // Keyed by URL rather than a bare boolean: a card recycled onto a different
  // community gets a fresh chance to load instead of inheriting the failure.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = src !== null && src !== failedSrc

  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden rounded-md bg-muted',
        !showImage && 'flex items-center justify-center',
        className,
      )}
      style={{ width: size, height: size }}
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
