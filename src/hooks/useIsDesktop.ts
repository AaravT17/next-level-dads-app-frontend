import { useEffect, useState } from 'react'

/** Tailwind's lg breakpoint — where the side rail and two-pane chat appear. */
const DESKTOP_BREAKPOINT = 1024

/**
 * Whether the viewport is wide enough for the desktop layout.
 *
 * Used where the difference is structural rather than cosmetic — the chat
 * screen renders one pane or two — so a CSS-only `hidden lg:flex` would mean
 * mounting both trees and hiding one, including a hidden <main>.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= DESKTOP_BREAKPOINT,
  )

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    setIsDesktop(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}
