import { useState, useMemo, useEffect, useCallback, useLayoutEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import DadCard from '@/components/DadCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, X, RefreshCw } from 'lucide-react'
import { AppBar } from '@/components/layout/AppBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { QueryState } from '@/components/feedback/QueryState'
import { InfiniteSentinel } from '@/components/feedback/InfiniteSentinel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { DadListSkeleton } from '@/components/feedback/skeletons/CardSkeletons'
import { ROUTES } from '@/lib/routes'
import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS, PROFILES_PAGE_LIMIT } from '@/config/constants'
import {
  ConnectionResponse,
  ConnectionsFilters,
  ConnectionsCursor,
} from '@/types/users'

async function fetchRequests(
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
    '/api/connections/requests',
    {
      params,
      timeout: TIMEOUT_LENGTH_MS,
    },
  )
  return res.data
}

const Requests = () => {
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

  // Reset other profile list caches when entering Requests section
  useLayoutEffect(() => {
    queryClient.removeQueries({ queryKey: ['discover', 'profiles'] })
    queryClient.removeQueries({ queryKey: ['connections', 'connected'] })
    queryClient.removeQueries({ queryKey: ['profile'] })
  }, [queryClient])

  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['connections', 'requests', filters],
    queryFn: ({ pageParam }) => fetchRequests(filters, pageParam),
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

  const requests = useMemo(() => data?.pages.flat() ?? [], [data])

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
    queryClient.removeQueries({ queryKey: ['connections', 'requests'] })
    queryClient.removeQueries({ queryKey: ['profile'] })
  }

  return (
    <>
      <AppBar title="Connection Requests" leading="back" backTo={ROUTES.PROFILE} />

      <PageContainer className="space-y-4 animate-fade-in">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSearch()
          }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 rounded-full"
              aria-label="Search requests"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        <QueryState
          query={{ isPending, isError, error, data: requests, refetch, isRefetching }}
          noun="requests"
          skeleton={<DadListSkeleton />}
          empty={
            <EmptyState
              title="No pending requests"
              description="Connection requests from other dads will appear here."
            />
          }
        >
          {(items) => (
            <ul role="list" className="space-y-4">
              {items.map((request) => (
                <li key={request.id}>
                  <DadCard {...request} />
                </li>
              ))}
            </ul>
          )}
        </QueryState>

        <InfiniteSentinel
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          noun="requests"
        />

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
      </PageContainer>
    </>
  )
}

export default Requests
