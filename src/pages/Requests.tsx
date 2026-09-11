import { useState, useMemo, useEffect, useCallback, useLayoutEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
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
import { useBackTarget } from '@/hooks/useBackTarget'
import { useIncomingRequests } from '@/features/connections/hooks/useIncomingRequests'
import { ConnectionsFilters } from '@/types/users'

const Requests = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  // Reached from the You tab, from the profile screen, and from the requests
  // panel on /dads. Back goes wherever the link came from.
  const backTo = useBackTarget(ROUTES.YOU)

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
    queryClient.removeQueries({ queryKey: ['dads'] })
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
  } = useIncomingRequests(filters)

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
      <AppBar title="Connection Requests" leading="back" backTo={backTo} />

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
              className="pl-10 pr-10 rounded-md"
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
            className="w-full rounded-md"
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
