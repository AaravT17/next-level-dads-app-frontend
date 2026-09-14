import lightLogo from '@/assets/logo.png'
import darkLogo from '@/assets/logo-dark.png'
import { cn } from '@/lib/utils'

/**
 * The wordmark.
 *
 * Two files rather than one, because the mark is not a single colour and no
 * CSS filter can recolour part of an image. It is gold letters, a near-black
 * chevron on transparent, and a gold bar carrying near-black text. Only the
 * chevron is in trouble on a dark surface — the bar brings its own contrast
 * with it. The dark file changes that one element and leaves the rest of the
 * brand alone.
 *
 * What this replaces was `filter: brightness(0) invert(1)`, which flattened
 * every pixel to white. That did rescue the chevron, at the cost of turning
 * the bar into a blank white rectangle with "LEVEL DADS" invisible inside it.
 *
 * The swap is CSS, keyed off the same `.dark` class as every other token,
 * rather than next-themes in React: the stored theme is not known until after
 * hydration, so a component choosing the file would show the wrong mark for a
 * frame on every load. Only one of the two is ever displayed, and
 * `display: none` keeps the other out of the accessibility tree, so both can
 * carry the same alt text without it being announced twice.
 */
export function AppLogo({
  className,
  /** True in the AppBar, where a nearby heading already names the page. */
  decorative = false,
}: {
  className?: string
  decorative?: boolean
}) {
  const alt = decorative ? '' : 'Next Level Dads'

  return (
    <>
      <img
        src={lightLogo}
        alt={alt}
        aria-hidden={decorative || undefined}
        className={cn('app-logo-light', className)}
      />
      <img
        src={darkLogo}
        alt={alt}
        aria-hidden={decorative || undefined}
        className={cn('app-logo-dark', className)}
      />
    </>
  )
}
