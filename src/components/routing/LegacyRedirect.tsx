import { Navigate, useLocation, useParams } from 'react-router-dom'

/**
 * Redirects a retired URL to its replacement, preserving both route params
 * and the query string — so a shared link with ?name=... survives the move.
 *
 * These live in one block at the very end of <Routes> so a legacy pattern can
 * never shadow a live route.
 */
export function LegacyRedirect({
  to,
}: {
  to: (params: Readonly<Record<string, string | undefined>>) => string
}) {
  const params = useParams()
  const { search } = useLocation()
  const target = to(params)
  const [pathname, ownQuery] = target.split('?')
  const mergedSearch = ownQuery
    ? `?${ownQuery}${search ? `&${search.slice(1)}` : ''}`
    : search
  return <Navigate replace to={{ pathname, search: mergedSearch }} />
}
