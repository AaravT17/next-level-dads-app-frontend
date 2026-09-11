import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * In-flight indicator for *actions* — a pending button, a "load more" fetch.
 * First loads of a list or detail screen use a skeleton instead, so the page
 * keeps its shape while it fills in.
 *
 * `motion-safe-spin` opts this out of the global reduced-motion freeze in
 * index.css: a spinner that does not spin reads as a hung UI.
 */

export type SpinnerProps = {
  /** sm 16 · md 20 · lg 24 (px) — matches the sizes already in use. */
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Announced to screen readers; pass null on decorative spinners beside text. */
  label?: string | null
}

const SIZE = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' } as const

export function Spinner({ size = 'md', className, label = 'Loading' }: SpinnerProps) {
  return (
    <>
      <Loader2
        aria-hidden
        className={cn(SIZE[size], 'motion-safe-spin animate-spin', className)}
      />
      {label ? <span className="sr-only">{label}</span> : null}
    </>
  )
}

/** Centred page-level spinner, for route-transition and auth-hydration gaps. */
export function CenteredSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex justify-center py-12">
      <Spinner size="lg" className="text-muted-foreground" label={label} />
    </div>
  )
}
