import { useState, useMemo, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import BottomNav from '@/components/BottomNav'
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
import { Search, X, Loader2, RefreshCw, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { communityDetail } from '@/lib/routes'
import logo from '@/assets/logo.png'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/routes'
import axiosPrivate from '@/api/axiosPrivate'
import {
  TIMEOUT_LENGTH_MS,
  COMMUNITIES_PAGE_LIMIT,
  EVENTS_PAGE_LIMIT,
} from '@/config/constants'
import { Community, DiscoverCommunitiesCursor } from '@/types/communities'
import { Event, DiscoverEventsCursor } from '@/types/events'

async function fetchMyCommunities(
  name: string,
  cursor?: DiscoverCommunitiesCursor,
): Promise<Community[]> {
  const params = new URLSearchParams()
  if (name) {
    params.append('name', name)
  }
  if (cursor) {
    params.append('cursor_id', cursor.cursor_id)
    params.append('cursor_created_at', cursor.cursor_created_at)
  }
  const res = await axiosPrivate.get<Community[]>('/api/users/me/communities', {
    params,
    timeout: TIMEOUT_LENGTH_MS,
  })
  return res.data
}

async function fetchMyEvents(
  name: string,
  cursor?: DiscoverEventsCursor,
): Promise<Event[]> {
  const params = new URLSearchParams()
  if (name) {
    params.append('name', name)
  }
  if (cursor) {
    params.append('cursor_id', cursor.cursor_id)
    params.append('cursor_starts_at', cursor.cursor_starts_at)
  }
  const res = await axiosPrivate.get<Event[]>('/api/users/me/events', {
    params,
    timeout: TIMEOUT_LENGTH_MS,
  })
  return res.data
}

const Groups = () => {
  const { tab = 'communities' } = useParams<{ tab: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Parse URL params for initial state
  const getStringParam = useCallback(
    (key: string) => searchParams.get(key) || '',
    [searchParams],
  )

  // Communities tab state - initialize from URL params
  const urlCommunitySearch = getStringParam('community_name')
  const [communitySearchQuery, setCommunitySearchQuery] =
    useState(urlCommunitySearch)

  // Events tab state - initialize from URL params
  const urlEventSearch = getStringParam('event_name')
  const [eventSearchQuery, setEventSearchQuery] = useState(urlEventSearch)

  // Create community modal state
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false)
  const [newCommunityName, setNewCommunityName] = useState('')
  const [newCommunityDescription, setNewCommunityDescription] = useState('')

  const handleCreateCommunityOpenChange = (open: boolean) => {
    setIsCreateCommunityOpen(open)
    if (!open) {
      setNewCommunityName('')
      setNewCommunityDescription('')
    }
  }

  const createCommunity = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      axiosPrivate.post<{ id: string }>('/api/communities/', data, {
        timeout: TIMEOUT_LENGTH_MS,
      }),
    onSuccess: (res) => {
      queryClient.removeQueries({ queryKey: ['groups', 'communities'] })
      handleCreateCommunityOpenChange(false)
      navigate(communityDetail(res.data.id))
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create community. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const handleCreateCommunity = () => {
    if (!newCommunityName.trim()) return
    createCommunity.mutate({
      name: newCommunityName.trim(),
      description: newCommunityDescription.trim() || undefined,
    })
  }

  // Reset Discover communities/events caches when entering Groups section
  useLayoutEffect(() => {
    queryClient.removeQueries({ queryKey: ['discover', 'communities'] })
    queryClient.removeQueries({ queryKey: ['discover', 'events'] })
    queryClient.removeQueries({ queryKey: ['community'] })
    queryClient.removeQueries({ queryKey: ['event'] })
  }, [queryClient])

  // fetch my communities using URL params
  const {
    data: communitiesData,
    isLoading: communitiesLoading,
    isError: communitiesError,
    fetchNextPage: fetchNextCommunities,
    hasNextPage: hasNextCommunities,
    isFetchingNextPage: isFetchingNextCommunities,
  } = useInfiniteQuery({
    queryKey: ['groups', 'communities', urlCommunitySearch],
    queryFn: ({ pageParam }) =>
      fetchMyCommunities(urlCommunitySearch, pageParam),
    initialPageParam: undefined as DiscoverCommunitiesCursor | undefined,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    getNextPageParam: (lastPage) => {
      if (lastPage.length < COMMUNITIES_PAGE_LIMIT) return undefined
      const lastItem = lastPage[lastPage.length - 1]
      return {
        cursor_id: lastItem.id,
        cursor_created_at: lastItem.created_at,
      }
    },
  })

  // fetch my events using URL params
  const {
    data: eventsData,
    isLoading: eventsLoading,
    isError: eventsError,
    fetchNextPage: fetchNextEvents,
    hasNextPage: hasNextEvents,
    isFetchingNextPage: isFetchingNextEvents,
  } = useInfiniteQuery({
    queryKey: ['groups', 'events', urlEventSearch],
    queryFn: ({ pageParam }) => fetchMyEvents(urlEventSearch, pageParam),
    initialPageParam: undefined as DiscoverEventsCursor | undefined,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    getNextPageParam: (lastPage) => {
      if (lastPage.length < EVENTS_PAGE_LIMIT) return undefined
      const lastItem = lastPage[lastPage.length - 1]
      return {
        cursor_id: lastItem.id,
        cursor_starts_at: lastItem.starts_at,
      }
    },
  })

  const communities = useMemo(
    () => communitiesData?.pages.flat() ?? [],
    [communitiesData],
  )
  const events = useMemo(() => eventsData?.pages.flat() ?? [], [eventsData])

  // infinite scroll sentinels
  const communitiesSentinelRef = useRef<HTMLDivElement>(null)
  const eventsSentinelRef = useRef<HTMLDivElement>(null)

  // communities infinite scroll
  useEffect(() => {
    const sentinel = communitiesSentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextCommunities &&
          !isFetchingNextCommunities
        ) {
          fetchNextCommunities()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextCommunities, isFetchingNextCommunities, fetchNextCommunities])

  // events infinite scroll
  useEffect(() => {
    const sentinel = eventsSentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextEvents &&
          !isFetchingNextEvents
        ) {
          fetchNextEvents()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextEvents, isFetchingNextEvents, fetchNextEvents])

  // Sync input fields with URL params when navigating back
  useEffect(() => {
    setCommunitySearchQuery(urlCommunitySearch)
  }, [urlCommunitySearch])

  useEffect(() => {
    setEventSearchQuery(urlEventSearch)
  }, [urlEventSearch])

  const clearCommunitySearch = () => {
    setCommunitySearchQuery('')
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev)
      newParams.delete('community_name')
      return newParams
    })
  }

  const clearEventSearch = () => {
    setEventSearchQuery('')
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev)
      newParams.delete('event_name')
      return newParams
    })
  }

  const handleCommunitySearch = () => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev)
      if (communitySearchQuery) {
        newParams.set('community_name', communitySearchQuery)
      } else {
        newParams.delete('community_name')
      }
      return newParams
    })
  }

  const handleEventSearch = () => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev)
      if (eventSearchQuery) {
        newParams.set('event_name', eventSearchQuery)
      } else {
        newParams.delete('event_name')
      }
      return newParams
    })
  }

  const handleRefreshCommunities = () => {
    queryClient.removeQueries({ queryKey: ['groups', 'communities'] })
    queryClient.removeQueries({ queryKey: ['community'] })
  }

  const handleRefreshEvents = () => {
    queryClient.removeQueries({ queryKey: ['groups', 'events'] })
    queryClient.removeQueries({ queryKey: ['event'] })
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative bg-card border-b border-border px-6 py-5 flex items-center justify-center">
        <img
          src={logo}
          alt="Next Level Dads"
          className="h-10 absolute top-4 left-3"
        />
        <div className="text-center">
          <h1 className="text-2xl font-heading font-semibold text-foreground">
            Groups
          </h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6">
        <div className="w-full">
          <div className="w-full grid grid-cols-2 bg-card border-b border-border h-12 mb-2">
            <Link
              to={ROUTES.GROUPS_COMMUNITIES}
              className={cn(
                'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all',
                tab === 'communities' &&
                  'border-b-2 border-primary text-foreground',
                tab !== 'communities' && 'text-muted-foreground',
              )}
            >
              Communities
            </Link>
            <Link
              to={ROUTES.GROUPS_EVENTS}
              className={cn(
                'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all',
                tab === 'events' && 'border-b-2 border-primary text-foreground',
                tab !== 'events' && 'text-muted-foreground',
              )}
            >
              Events
            </Link>
          </div>

          {tab === 'communities' && (
            <div className="space-y-4 animate-fade-in">
              <Dialog
                open={isCreateCommunityOpen}
                onOpenChange={handleCreateCommunityOpenChange}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full rounded-full font-semibold text-foreground bg-white"
                    style={{ borderColor: '#D8A24A' }}
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
                      <label
                        htmlFor="community-name"
                        className="text-sm font-medium text-foreground"
                      >
                        Name <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="community-name"
                        placeholder="Community name"
                        value={newCommunityName}
                        onChange={(e) => setNewCommunityName(e.target.value)}
                        maxLength={100}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="community-description"
                        className="text-sm font-medium text-foreground"
                      >
                        Description
                      </label>
                      <Textarea
                        id="community-description"
                        placeholder="What is this community about?"
                        value={newCommunityDescription}
                        onChange={(e) => setNewCommunityDescription(e.target.value)}
                        maxLength={500}
                        className="mt-1 min-h-24"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleCreateCommunity}
                      disabled={!newCommunityName.trim() || createCommunity.isPending}
                    >
                      {createCommunity.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <form
                className="relative mb-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleCommunitySearch()
                }}
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search communities..."
                  value={communitySearchQuery}
                  onChange={(e) => setCommunitySearchQuery(e.target.value)}
                  className="pl-10 pr-10 rounded-full"
                />
                {communitySearchQuery && (
                  <button
                    type="button"
                    onClick={clearCommunitySearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              <div className="space-y-4">
                {communitiesLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : communitiesError ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Failed to load communities. Please try again.
                    </p>
                  </div>
                ) : communities.length > 0 ? (
                  <>
                    {communities.map((community) => (
                      <CommunityCard
                        key={community.id}
                        {...community}
                      />
                    ))}
                    <div
                      ref={communitiesSentinelRef}
                      className="h-4"
                    />
                    {isFetchingNextCommunities && (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      No joined communities yet
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={handleRefreshCommunities}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          )}

          {tab === 'events' && (
            <div className="space-y-4 animate-fade-in">
              <form
                className="relative mb-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleEventSearch()
                }}
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search events..."
                  value={eventSearchQuery}
                  onChange={(e) => setEventSearchQuery(e.target.value)}
                  className="pl-10 pr-10 rounded-full"
                />
                {eventSearchQuery && (
                  <button
                    type="button"
                    onClick={clearEventSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              <div className="space-y-4">
                {eventsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : eventsError ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Failed to load events. Please try again.
                    </p>
                  </div>
                ) : events.length > 0 ? (
                  <>
                    {events.map((event) => (
                      <EventCard
                        key={event.id}
                        {...event}
                      />
                    ))}
                    <div
                      ref={eventsSentinelRef}
                      className="h-4"
                    />
                    {isFetchingNextEvents && (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      No registered events yet
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={handleRefreshEvents}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

export default Groups
