import { useState, useMemo, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, Navigate } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { AppBar } from '@/components/layout/AppBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { TabBar } from '@/components/layout/TabBar'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Search, X } from 'lucide-react'
import { toastError } from '@/lib/toast'
import { ROUTES, communityDetail, groupsTab } from '@/lib/routes'
import type { GroupScope, GroupsTab } from '@/lib/routes'
import axiosPrivate from '@/api/axiosPrivate'
import {
  TIMEOUT_LENGTH_MS,
  COMMUNITIES_PAGE_LIMIT,
  EVENTS_PAGE_LIMIT,
} from '@/config/constants'
import type { Community, DiscoverCommunitiesCursor } from '@/types/communities'
import type { Event, DiscoverEventsCursor } from '@/types/events'

/**
 * Communities and events, in one place.
 *
 * Whether you have joined something is a filter here, not a separate section.
 * Previously /discover/communities and /groups/communities rendered the same
 * card with different meanings, kept apart by two query-cache namespaces that
 * each screen cleared on mount. Joining an item now flips its button instead
 * of making it vanish from the list you found it in.
 */

const SCOPE_ENDPOINT = {
  communities: { joined: '/api/users/me/communities', all: '/api/communities/' },
  events: { joined: '/api/users/me/events', all: '/api/events/' },
} as const

async function fetchCommunities(
  scope: GroupScope,
  name: string,
  cursor?: DiscoverCommunitiesCursor,
): Promise<Community[]> {
  const params = new URLSearchParams()
  if (name) params.append('name', name)
  if (cursor) {
    params.append('cursor_id', cursor.cursor_id)
    params.append('cursor_created_at', cursor.cursor_created_at)
  }
  const res = await axiosPrivate.get<Community[]>(SCOPE_ENDPOINT.communities[scope], {
    params,
    timeout: TIMEOUT_LENGTH_MS,
  })
  return res.data
}

async function fetchEvents(
  scope: GroupScope,
  name: string,
  cursor?: DiscoverEventsCursor,
): Promise<Event[]> {
  const params = new URLSearchParams()
  if (name) params.append('name', name)
  if (cursor) {
    params.append('cursor_id', cursor.cursor_id)
    params.append('cursor_starts_at', cursor.cursor_starts_at)
  }
  const res = await axiosPrivate.get<Event[]>(SCOPE_ENDPOINT.events[scope], {
    params,
    timeout: TIMEOUT_LENGTH_MS,
  })
  return res.data
}

const SCOPE_OPTIONS: { value: GroupScope; label: string }[] = [
  { value: 'joined', label: 'Joined' },
  { value: 'all', label: 'All' },
]

const GroupsPage = () => {
  const { tab } = useParams<{ tab: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const scope: GroupScope = searchParams.get('scope') === 'all' ? 'all' : 'joined'
  const urlSearch = searchParams.get('name') ?? ''
  const [searchInput, setSearchInput] = useState(urlSearch)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  useEffect(() => setSearchInput(urlSearch), [urlSearch])

  const isCommunities = tab === 'communities'

  const communitiesQuery = useInfiniteQuery({
    queryKey: ['communities', scope, { name: urlSearch }],
    queryFn: ({ pageParam }) => fetchCommunities(scope, urlSearch, pageParam),
    initialPageParam: undefined as DiscoverCommunitiesCursor | undefined,
    enabled: isCommunities,
    staleTime: 1000 * 60 * 2,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < COMMUNITIES_PAGE_LIMIT) return undefined
      const last = lastPage[lastPage.length - 1]
      return { cursor_id: last.id, cursor_created_at: last.created_at }
    },
  })

  const eventsQuery = useInfiniteQuery({
    queryKey: ['events', scope, { name: urlSearch }],
    queryFn: ({ pageParam }) => fetchEvents(scope, urlSearch, pageParam),
    initialPageParam: undefined as DiscoverEventsCursor | undefined,
    enabled: !isCommunities,
    staleTime: 1000 * 60 * 2,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < EVENTS_PAGE_LIMIT) return undefined
      const last = lastPage[lastPage.length - 1]
      return { cursor_id: last.id, cursor_starts_at: last.starts_at }
    },
  })

  const communities = useMemo(
    () => communitiesQuery.data?.pages.flat() ?? [],
    [communitiesQuery.data],
  )
  const events = useMemo(() => eventsQuery.data?.pages.flat() ?? [], [eventsQuery.data])

  const createCommunity = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      axiosPrivate.post<{ id: string }>('/api/communities/', data, {
        timeout: TIMEOUT_LENGTH_MS,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
      handleCreateOpenChange(false)
      navigate(communityDetail(res.data.id))
    },
    onError: (error) => {
      toastError(
        axios.isAxiosError(error) && error.response?.status === 429
          ? 'Community creation limit reached. Please try again later.'
          : 'Failed to create community. Please try again.',
      )
    },
  })

  if (tab !== 'communities' && tab !== 'events') {
    return <Navigate to={ROUTES.GROUPS_COMMUNITIES} replace />
  }

  function handleCreateOpenChange(open: boolean) {
    setIsCreateOpen(open)
    if (!open) {
      setNewName('')
      setNewDescription('')
    }
  }

  const setParam = (key: string, value: string | null) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })

  const noun = isCommunities ? 'communities' : 'events'
  const scopeLabel = scope === 'joined' ? 'joined' : 'all'

  const emptyState = (
    <EmptyState
      title={
        urlSearch
          ? `No ${noun} found`
          : scope === 'joined'
            ? `You haven't joined any ${noun} yet`
            : `No ${noun} yet`
      }
      description={
        urlSearch
          ? 'Try a different search.'
          : scope === 'joined'
            ? `Browse all ${noun} to find one to join.`
            : 'Check back soon.'
      }
      action={
        scope === 'joined' && !urlSearch
          ? { label: `Browse all ${noun}`, to: groupsTab(tab as GroupsTab, 'all') }
          : undefined
      }
    />
  )

  return (
    <>
      <AppBar title="Groups" width="wide" />

      <TabBar
        width="wide"
        ariaLabel="Groups sections"
        items={[
          {
            label: 'Communities',
            to: groupsTab('communities', scope),
            isActive: isCommunities,
          },
          { label: 'Events', to: groupsTab('events', scope), isActive: !isCommunities },
        ]}
      />

      <PageContainer width="wide" className="space-y-4 animate-fade-in">
        <div className="flex flex-wrap items-center gap-3 sm:max-w-md">
        <Segmented
          ariaLabel={`Show ${noun}`}
          options={SCOPE_OPTIONS}
          value={scope}
          onChange={(next) => setParam('scope', next === 'joined' ? null : next)}
        />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:max-w-2xl">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault()
            setParam('name', searchInput || null)
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder={`Search ${scopeLabel} ${noun}...`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label={`Search ${noun}`}
            className="pl-10 pr-10 rounded-full"
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

        {isCommunities && (
          <Dialog open={isCreateOpen} onOpenChange={handleCreateOpenChange}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto shrink-0 rounded-full border-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Community
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Create Community</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label htmlFor="community-name" className="text-label text-foreground">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="community-name"
                    placeholder="Community name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    maxLength={100}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="community-description" className="text-label text-foreground">
                    Description
                  </label>
                  <Textarea
                    id="community-description"
                    placeholder="What is this community about?"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    maxLength={500}
                    className="mt-1 min-h-24"
                  />
                </div>
                <Button
                  className="w-full rounded-full"
                  disabled={!newName.trim() || createCommunity.isPending}
                  onClick={() =>
                    createCommunity.mutate({
                      name: newName.trim(),
                      description: newDescription.trim() || undefined,
                    })
                  }
                >
                  {createCommunity.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        </div>

        {isCommunities ? (
          <>
            <QueryState
              query={{
                isPending: communitiesQuery.isPending,
                isError: communitiesQuery.isError,
                error: communitiesQuery.error,
                data: communities,
                refetch: communitiesQuery.refetch,
                isRefetching: communitiesQuery.isRefetching,
              }}
              noun="communities"
              skeleton={<CommunityListSkeleton />}
              empty={emptyState}
            >
              {(items) => (
                <ul role="list" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((community) => (
                    <li key={community.id}>
                      <CommunityCard {...community} />
                    </li>
                  ))}
                </ul>
              )}
            </QueryState>
            <InfiniteSentinel
              hasNextPage={communitiesQuery.hasNextPage}
              isFetchingNextPage={communitiesQuery.isFetchingNextPage}
              fetchNextPage={communitiesQuery.fetchNextPage}
              noun="communities"
            />
          </>
        ) : (
          <>
            <QueryState
              query={{
                isPending: eventsQuery.isPending,
                isError: eventsQuery.isError,
                error: eventsQuery.error,
                data: events,
                refetch: eventsQuery.refetch,
                isRefetching: eventsQuery.isRefetching,
              }}
              noun="events"
              skeleton={<EventListSkeleton />}
              empty={emptyState}
            >
              {(items) => (
                <ul role="list" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((event) => (
                    <li key={event.id}>
                      <EventCard {...event} />
                    </li>
                  ))}
                </ul>
              )}
            </QueryState>
            <InfiniteSentinel
              hasNextPage={eventsQuery.hasNextPage}
              isFetchingNextPage={eventsQuery.isFetchingNextPage}
              fetchNextPage={eventsQuery.fetchNextPage}
              noun="events"
            />
          </>
        )}
      </PageContainer>
    </>
  )
}

export default GroupsPage
