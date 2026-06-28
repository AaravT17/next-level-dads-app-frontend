import { useState, useMemo, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import BottomNav from '@/components/BottomNav'
import DadCard from '@/components/DadCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search, X, Loader2, RefreshCw } from 'lucide-react'
import logo from '@/assets/logo.png'
import { ROUTES } from '@/lib/routes'
import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS, PROFILES_PAGE_LIMIT } from '@/config/constants'
import {
  ConnectionResponse,
  ConnectionsFilters,
  ConnectionsCursor,
} from '@/types/users'

async function fetchConnections(
  filters: ConnectionsFilters,
  cursor?: ConnectionsCursor,
): Promise<ConnectionResponse[]> {
  const params = new URLSearchParams()
  if (filters.name) {
    params.append('name', filters.name)
  }
  if (cursor) {
    params.append('cursor_id', cursor.cursor_id)
    params.append('cursor_updated_at', cursor.cursor_updated_at)
  }
  const res = await axiosPrivate.get<ConnectionResponse[]>(
    '/api/connections/connected',
    {
      params,
      timeout: TIMEOUT_LENGTH_MS,
    },
  )
  return res.data
}

const Connections = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  // Parse URL params for initial state
  const getStringParam = useCallback(
    (key: string) => searchParams.get(key) || '',
    [searchParams],
  )

  const urlSearch = getStringParam('name')
  const [searchQuery, setSearchQuery] = useState(urlSearch)

  const filters: ConnectionsFilters = useMemo(
    () => ({ name: urlSearch }),
    [urlSearch],
  )

  // Reset other profile list caches when entering Connections section
  useLayoutEffect(() => {
    queryClient.removeQueries({ queryKey: ['discover', 'profiles'] })
    queryClient.removeQueries({ queryKey: ['connections', 'requests'] })
    queryClient.removeQueries({ queryKey: ['profile'] })
  }, [queryClient])

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['connections', 'connected', filters],
    queryFn: ({ pageParam }) => fetchConnections(filters, pageParam),
    initialPageParam: undefined as ConnectionsCursor | undefined,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PROFILES_PAGE_LIMIT) return undefined
      const lastItem = lastPage[lastPage.length - 1]
      return {
        cursor_id: lastItem.connection_id,
        cursor_updated_at: lastItem.connection_updated_at,
      }
    },
  })

  const connections = useMemo(() => data?.pages.flat() ?? [], [data])

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Sync input field with URL params when navigating back
  useEffect(() => {
    setSearchQuery(urlSearch)
  }, [urlSearch])

  const clearSearch = () => {
    setSearchQuery('')
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev)
      newParams.delete('name')
      return newParams
    })
  }

  const handleSearch = () => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev)
      if (searchQuery) {
        newParams.set('name', searchQuery)
      } else {
        newParams.delete('name')
      }
      return newParams
    })
  }

  const handleRefresh = () => {
    queryClient.removeQueries({ queryKey: ['connections', 'connected'] })
    queryClient.removeQueries({ queryKey: ['profile'] })
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border">
        <div className="max-w-md mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <img
              src={logo}
              alt="Next Level Dads"
              className="h-8"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(ROUTES.PROFILE)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-heading font-semibold text-foreground">
              Connections
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-4 animate-fade-in">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSearch()
          }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 rounded-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Failed to load connections. Please try again.
              </p>
            </div>
          ) : connections.length > 0 ? (
            <>
              {connections.map((connection) => (
                <DadCard
                  key={connection.id}
                  {...connection}
                />
              ))}
              <div
                ref={sentinelRef}
                className="h-4"
              />
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No connections yet</p>
            </div>
          )}
        </div>

        <div className="pt-4">
          <Button
            variant="outline"
            className="w-full rounded-full"
            onClick={handleRefresh}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

export default Connections
