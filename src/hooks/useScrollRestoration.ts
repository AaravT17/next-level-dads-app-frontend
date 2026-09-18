import { useEffect, useLayoutEffect, type RefObject } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Restores a scroll container's position when you navigate back to it.
 *
 * Positions are recorded by the scroll listener only, never on cleanup. Two
 * different failures come from saving on the way out: an unmounted container
 * reports scrollTop 0 because it is already detached, and a container that
 * survives the navigation — switching tabs on the same route — has already
 * been reset to 0 by the layout effect below before cleanup runs. Either way
 * the good value gets overwritten with zero.
 *
 * The app scrolls inside <main> rather than the document, so neither the
 * browser's native restoration nor React Router's <ScrollRestoration> (which
 * needs a data router) applies here.
 *
 * Positions are keyed by history entry, so going back to a feed returns you to
 * where you were, while opening a new screen starts at the top.
 */

const positions = new Map<string, number>()

/** Content arrives asynchronously, so the target height may not exist yet. */
const MAX_RESTORE_FRAMES = 40

/**
 * How many history entries to remember a position for.
 *
 * A Map keeps insertion order, so the oldest key is the first one. Without a
 * cap this grew by one entry per history entry for as long as the tab stayed
 * open, and nothing ever removed them.
 */
const MAX_TRACKED_POSITIONS = 50

function remember(key: string, top: number): void {
  if (!positions.has(key) && positions.size >= MAX_TRACKED_POSITIONS) {
    const oldest = positions.keys().next().value
    if (oldest !== undefined) positions.delete(oldest)
  }
  positions.set(key, top)
}

export function useScrollRestoration(ref: RefObject<HTMLElement>, enabled = true) {
  const { key } = useLocation()
  const navigationType = useNavigationType()

  useLayoutEffect(() => {
    if (!enabled) return

    const el = ref.current
    if (!el) return

    const saved = navigationType === 'POP' ? positions.get(key) : undefined
    if (saved === undefined) {
      el.scrollTop = 0
      return
    }

    // Keep re-applying until the list is tall enough to hold the position —
    // the query cache rehydrates over a few frames.
    let frame = 0
    let attempts = 0
    let cancelled = false

    // The loop runs for up to 40 frames, and `saved` is captured, so a user who
    // starts scrolling during it gets dragged back to where they were. Their
    // first real input hands control over.
    const cancel = () => {
      cancelled = true
    }
    el.addEventListener('wheel', cancel, { passive: true, once: true })
    el.addEventListener('touchstart', cancel, { passive: true, once: true })
    window.addEventListener('keydown', cancel, { once: true })

    const restore = () => {
      const node = ref.current
      if (!node || cancelled) return
      node.scrollTop = saved
      attempts += 1
      if (Math.abs(node.scrollTop - saved) > 1 && attempts < MAX_RESTORE_FRAMES) {
        frame = requestAnimationFrame(restore)
      }
    }
    restore()
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('wheel', cancel)
      el.removeEventListener('touchstart', cancel)
      window.removeEventListener('keydown', cancel)
    }
  }, [ref, key, navigationType, enabled])

  useEffect(() => {
    if (!enabled) return

    const el = ref.current
    if (!el) return

    const onScroll = () => remember(key, el.scrollTop)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [ref, key, enabled])
}
