import { useState, useMemo, useEffect, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { AppBar } from '@/components/layout/AppBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { Segmented } from '@/components/layout/Segmented'
import { QueryState } from '@/components/feedback/QueryState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { InfiniteSentinel } from '@/components/feedback/InfiniteSentinel'
import {
  CommunityListSkeleton,
  EventListSkeleton,
} from '@/components/feedback/skeletons/CardSkeletons'
import CommunityCard from '@/components/CommunityCard'
import EventCard from '@/components/EventCard'
import { Input } from '@/components/ui/input'
import axiosPrivate from '@/api/axiosPrivate'
import {
  TIMEOUT_LENGTH_MS,
  COMMUNITIES_PAGE_LIMIT,
  EVENTS_PAGE_LIMIT,
} from '@/config/constants'
import type { GroupScope } from '@/lib/routes'
import type { Community, DiscoverCommunitiesCursor } from '@/types/communities'
import type { Event, DiscoverEventsCursor } from '@/types/events'

/**
 * A scoped collection: communities or events, filtered by whether you have
 * joined them.
 *
 * Communities and events are separate destinations now, so only one kind is
 * ever on screen. That collapses what used to be two parallel queries behind
 * `enabled` flags into a single query parameterised by kind.
 */

export type CollectionKind = 'communities' | 'events'

type Cursor = DiscoverCommunitiesCursor | DiscoverEventsCursor
type Item = Community | Event

const ENDPOINT: Record<CollectionKind, Record<GroupScope, string>> = {
  communities: { joined: '/api/users/me/communities', all: '/api/communities/' },
  events: { joined: '/api/users/me/events', all: '/api/events/' },
}

const PAGE_LIMIT: Record<CollectionKind, number> = {
  communities: COMMUNITIES_PAGE_LIMIT,
  events: EVENTS_PAGE_LIMIT,
}

const SCOPE_OPTIONS: { value: GroupScope; label: string }[] = [
  { value: 'joined', label: 'Joined' },
  { value: 'all', label: 'All' },
]

async function fetchPage(
  kind: CollectionKind,
  scope: GroupScope,
  name: string,
  cursor?: Cursor,
): Promise<Item[]> {
  const params = new URLSearchParams()
  if (name) params.append('name', name)
  if (cursor) {
    params.append('cursor_id', cursor.cursor_id)
    if ('cursor_created_at' in cursor) {
      params.append('cursor_created_at', cursor.cursor_created_at)
    } else {
      params.append('cursor_starts_at', cursor.cursor_starts_at)
    }
  }
  const res = await axiosPrivate.get<Item[]>(ENDPOINT[kind][scope], {
    params,
    timeout: TIMEOUT_LENGTH_MS,
  })
  return res.data
}

function nextCursor(kind: CollectionKind, last: Item): Cursor {
  return kind === 'communities'
    ? { cursor_id: last.id, cursor_created_at: (last as Community).created_at }
    : { cursor_id: last.id, cursor_starts_at: (last as Event).starts_at }
}

export type ScopedCollectionListProps = {
  kind: CollectionKind
  /** Rendered next to the search field — the Create Community dialog, say. */
  action?: ReactNode
  /** Section heading. Omit when the page's AppBar already names the list. */
  heading?: string
  /** Defaults to a two-column grid; pass a single column for a narrow aside. */
  gridClassName?: string
  /**
   * Stack the controls instead of putting them on one row.
   *
   * Needed in the side column: `sm:` responds to the viewport, not the
   * container, so on a wide screen a narrow column would still get the
   * side-by-side layout and overflow.
   */
  dense?: boolean
}

/**
 * The list itself, without page chrome, so it can be a full page (Events) or
 * a column beside the feed (Groups).
 */
export function ScopedCollectionList({
  kind,
  action,
  heading,
  gridClassName = 'grid gap-4 sm:grid-cols-2',
  dense = false,
}: ScopedCollectionListProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const scope: GroupScope = searchParams.get('scope') === 'all' ? 'all' : 'joined'
  const urlSearch = searchParams.get('name') ?? ''
  const [searchInput, setSearchInput] = useState(urlSearch)

  useEffect(() => setSearchInput(urlSearch), [urlSearch])

  const query = useInfiniteQuery({
    queryKey: [kind, scope, { name: urlSearch }],
    queryFn: ({ pageParam }) => fetchPage(kind, scope, urlSearch, pageParam),
    initialPageParam: undefined as Cursor | undefined,
    staleTime: 1000 * 60 * 2,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_LIMIT[kind]) return undefined
      return nextCursor(kind, lastPage[lastPage.length - 1])
    },
  })

  const items = useMemo(() => query.data?.pages.flat() ?? [], [query.data])

  const setParam = (key: string, value: string | null) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })

  const scopeLabel = scope === 'joined' ? 'joined' : 'all'

  return (
    <section
      aria-labelledby={heading ? `${kind}-heading` : undefined}
      className="space-y-4"
    >
      {heading && (
        <h2 id={`${kind}-heading`} className="font-heading text-heading text-foreground">
          {heading}
        </h2>
      )}

      <div className={dense ? 'w-full' : 'w-full sm:max-w-xs'}>
        <Segmented
          ariaLabel={`Show ${kind}`}
          options={SCOPE_OPTIONS}
          value={scope}
          onChange={(next) => setParam('scope', next === 'joined' ? null : next)}
        />
      </div>

      <div
        className={
          dense
            ? 'flex flex-col gap-3'
            : 'flex flex-col gap-3 sm:flex-row sm:items-center sm:max-w-2xl'
        }
      >
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault()
            setParam('name', searchInput || null)
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder={`Search ${scopeLabel} ${kind}...`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label={`Search ${kind}`}
            className="pl-10 pr-10 rounded-md"
          />
          {searchInput && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setSearchInput('')
                setParam('name', null)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {action}
      </div>

      <QueryState
        query={{
          isPending: query.isPending,
          isError: query.isError,
          error: query.error,
          data: items,
          refetch: query.refetch,
          isRefetching: query.isRefetching,
        }}
        noun={kind}
        skeleton={kind === 'communities' ? <CommunityListSkeleton /> : <EventListSkeleton />}
        empty={
          <EmptyState
            title={
              urlSearch
                ? `No ${kind} found`
                : scope === 'joined'
                  ? `You haven't joined any ${kind} yet`
                  : `No ${kind} yet`
            }
            description={
              urlSearch
                ? 'Try a different search.'
                : scope === 'joined'
                  ? `Browse all ${kind} to find one to join.`
                  : 'Check back soon.'
            }
            action={
              scope === 'joined' && !urlSearch
                ? { label: `Browse all ${kind}`, onClick: () => setParam('scope', 'all') }
                : undefined
            }
          />
        }
      >
        {(list) => (
          <ul role="list" className={gridClassName}>
            {list.map((item) =>
              kind === 'communities' ? (
                <li key={item.id}>
                  <CommunityCard {...(item as Community)} />
                </li>
              ) : (
                <li key={item.id}>
                  <EventCard {...(item as Event)} />
                </li>
              ),
            )}
          </ul>
        )}
      </QueryState>

      <InfiniteSentinel
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
        noun={kind}
      />
    </section>
  )
}

/** Full-page version: page chrome plus the list. */
export function ScopedCollectionPage({
  kind,
  title,
  action,
}: {
  kind: CollectionKind
  title: string
  action?: ReactNode
}) {
  return (
    <>
      <AppBar title={title} width="wide" />
      <PageContainer width="wide" className="animate-fade-in">
        <ScopedCollectionList kind={kind} action={action} />
      </PageContainer>
    </>
  )
}
