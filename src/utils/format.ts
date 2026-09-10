/**
 * Shared display formatters.
 *
 * These names encode *semantics*, not shape. Before this module the codebase
 * had five functions called `formatTime` that returned different things
 * ("3:45 PM", "Mar 4", "2h ago"), which is exactly why a caller could never
 * tell from the name what it would render. Pick by meaning, not by type.
 */

/** Up to two uppercase initials. Returns '?' when there is no usable name. */
export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const letters = name
    .split(' ')
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)
  return letters || '?'
}

/** Just the given name: "Marcus Lee" -> "Marcus". Falls back to the whole string. */
export function firstName(name: string | null | undefined): string {
  if (!name) return ''
  return name.trim().split(/\s+/)[0] || ''
}

/** Clock time only: "3:45 PM". For items already grouped under a known day. */
export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Clock time if today, otherwise a short date: "3:45 PM" | "Mar 4".
 * For list rows spanning multiple days, such as chat previews.
 */
export function formatListTimestamp(iso: string): string {
  const date = new Date(iso)
  const isToday = date.toDateString() === new Date().toDateString()
  return isToday
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

/** Elapsed time: "5m ago" | "2h ago", falling back to a locale date past a day. */
export function formatRelative(iso: string): string {
  const date = new Date(iso)
  const mins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return date.toLocaleDateString()
}

/** Event day: "Tue, Mar 4". */
export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** Event start time: "6:30 PM". */
export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-CA', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Date and time together, for admin and moderation tables: "Mar 4, 6:30 PM". */
export function formatAdminDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Event price: "Free" for zero, otherwise "$12.00". */
export function formatPrice(price: string): string {
  const value = Number(price)
  if (value === 0) return 'Free'
  return `$${value.toFixed(2)}`
}

/**
 * `mailto:` / `tel:` hrefs built from API-supplied contact details.
 *
 * The values are typed by whoever submitted the event, not validated, and land
 * straight in an href, so a value containing `?subject=`, `&bcc=`, a comma or a
 * newline could otherwise add mail headers or extra recipients when the link
 * opens.
 *
 * Only the characters that can do that are escaped. `encodeURIComponent` would
 * also percent-encode `@`, and while RFC 6068 permits that, not every mail
 * handler decodes it before parsing the address — so the safe-looking choice
 * risks breaking ordinary addresses for no extra protection. `%` is in the set
 * so an address containing one cannot smuggle an escape of its own; the single
 * pass never re-reads what it emits.
 */
const MAILTO_UNSAFE = /[%?&#,;<>"\s]/g

export function mailtoHref(email: string): string {
  const encoded = email.replace(
    MAILTO_UNSAFE,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`,
  )
  return `mailto:${encoded}`
}

/** Keeps only the characters a dial string can contain. */
export function telHref(phone: string): string {
  // A literal space, not \s: \s admits newlines and tabs, which have no place
  // in a dial string.
  return `tel:${phone.replace(/[^0-9+()\-.#* ]/g, '')}`
}
