import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import { AppBar } from '@/components/layout/AppBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { InfiniteSentinel } from '@/components/feedback/InfiniteSentinel'
import { QueryState } from '@/components/feedback/QueryState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { DadListSkeleton } from '@/components/feedback/skeletons/CardSkeletons'
import DadCard from '@/components/DadCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCw, Search, X, SlidersHorizontal } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import axiosPrivate from '@/api/axiosPrivate'
import {
  TIMEOUT_LENGTH_MS,
  PROFILES_PAGE_LIMIT,
  DISCOVER_DADS_FILTERS_AGE_RANGES,
  STAGE_OPTIONS,
  PROVINCE_OPTIONS,
} from '@/config/constants'
import { Profile, DiscoverDadsFilters, DiscoverDadsCursor } from '@/types/users'

/**
 * Browse dads.
 *
 * Was the first of three unrelated tabs inside a 1,146-line Discover screen.
 * The communities and events tabs moved to Groups, where the same objects now
 * live under a joined/all scope instead of being duplicated across sections.
 */

async function fetchDiscoverProfiles(
  filters: DiscoverDadsFilters,
  cursor?: DiscoverDadsCursor,
): Promise<Profile[]> {
  const params = new URLSearchParams()
  filters.interests.forEach((i) => params.append('interests', i))
  filters.children_age_ranges.forEach((r) =>
    params.append('children_age_ranges', r),
  )
  filters.provinces.forEach((p) => params.append('provinces', p))
  filters.age_ranges.forEach((r) => params.append('age_ranges', r))
  if (filters.name) params.append('name', filters.name)
  if (cursor) {
    params.append('cursor_id', cursor.cursor_id)
    params.append('cursor_created_at', cursor.cursor_created_at)
  }
  const res = await axiosPrivate.get<Profile[]>('/api/users/', {
    params,
    timeout: TIMEOUT_LENGTH_MS,
  })
  return res.data
}

async function fetchInterests(): Promise<string[]> {
  const res = await axiosPrivate.get<string[]>('/api/interests/', {
    timeout: TIMEOUT_LENGTH_MS,
  })
  return res.data
}


const DadsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const getArrayParam = useCallback((key: string) => searchParams.getAll(key), [searchParams])
  const getStringParam = useCallback((key: string) => searchParams.get(key) || '', [searchParams])

  const urlDadSearch = getStringParam('dad_name')
  const [dadSearchQuery, setDadSearchQuery] = useState(urlDadSearch)

  const urlChildrenAges = useMemo(() => getArrayParam('children_age_ranges'), [getArrayParam])
  const urlInterests = useMemo(() => getArrayParam('interests'), [getArrayParam])
  const urlProvinces = useMemo(() => getArrayParam('provinces'), [getArrayParam])
  const urlAgeRanges = useMemo(() => getArrayParam('age_ranges'), [getArrayParam])

  const [pendingChildrenAges, setPendingChildrenAges] = useState<string[]>(urlChildrenAges)
  const [pendingInterests, setPendingInterests] = useState<string[]>(urlInterests)
  const [pendingLocations, setPendingLocations] = useState<string[]>(urlProvinces)
  const [pendingDadAges, setPendingDadAges] = useState<string[]>(urlAgeRanges)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [interestSearchQuery, setInterestSearchQuery] = useState('')

  // Reset pending filters to URL state when the sheet closes without applying
  const handleFiltersOpenChange = (open: boolean) => {
    if (!open) {
      setPendingChildrenAges(urlChildrenAges)
      setPendingInterests(urlInterests)
      setPendingLocations(urlProvinces)
      setPendingDadAges(urlAgeRanges)
    }
    setFiltersOpen(open)
  }

  const dadsFilters: DiscoverDadsFilters = useMemo(
    () => ({
      interests: urlInterests,
      children_age_ranges: urlChildrenAges,
      provinces: urlProvinces,
      age_ranges: urlAgeRanges,
      name: urlDadSearch,
    }),
    [urlInterests, urlChildrenAges, urlProvinces, urlAgeRanges, urlDadSearch],
  )

  const {
    data: dadsData,
    isLoading: dadsLoading,
    isError: dadsError,
    error: dadsQueryError,
    refetch: refetchDads,
    isRefetching: isRefetchingDads,
    fetchNextPage: fetchNextDads,
    hasNextPage: hasNextDads,
    isFetchingNextPage: isFetchingNextDads,
  } = useInfiniteQuery({
    queryKey: ['dads', dadsFilters],
    queryFn: ({ pageParam }) => fetchDiscoverProfiles(dadsFilters, pageParam),
    initialPageParam: undefined as DiscoverDadsCursor | undefined,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PROFILES_PAGE_LIMIT) return undefined
      const lastItem = lastPage[lastPage.length - 1]
      return { cursor_id: lastItem.id, cursor_created_at: lastItem.created_at }
    },
  })

  const profiles = useMemo(() => dadsData?.pages.flat() ?? [], [dadsData])

  const hasActiveFilters =
    urlInterests.length > 0 ||
    urlChildrenAges.length > 0 ||
    urlProvinces.length > 0 ||
    urlAgeRanges.length > 0 ||
    urlDadSearch !== ''

  const { data: interestOptions = [] } = useQuery({
    queryKey: ['interests'],
    queryFn: fetchInterests,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (axios.isAxiosError(dadsQueryError) && dadsQueryError.response?.status === 429) {
      toast.error('Too many requests. Please slow down.')
    }
  }, [dadsQueryError])

  // Sync input with URL params when navigating back
  useEffect(() => {
    setDadSearchQuery(urlDadSearch)
  }, [urlDadSearch])

  useEffect(() => {
    setPendingChildrenAges(urlChildrenAges)
    setPendingInterests(urlInterests)
    setPendingLocations(urlProvinces)
    setPendingDadAges(urlAgeRanges)
  }, [urlChildrenAges, urlInterests, urlProvinces, urlAgeRanges])

  const togglePendingChildrenAge = (stage: string) => {
    setPendingChildrenAges((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage],
    )
  }
  const togglePendingInterest = (interest: string) => {
    setPendingInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    )
  }
  const togglePendingLocation = (location: string) => {
    setPendingLocations((prev) =>
      prev.includes(location) ? prev.filter((l) => l !== location) : [...prev, location],
    )
  }
  const togglePendingDadAge = (ageRange: string) => {
    setPendingDadAges((prev) =>
      prev.includes(ageRange) ? prev.filter((a) => a !== ageRange) : [...prev, ageRange],
    )
  }

  const applyDadsFilters = () => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev)
      newParams.delete('children_age_ranges')
      newParams.delete('interests')
      newParams.delete('provinces')
      newParams.delete('age_ranges')
      pendingChildrenAges.forEach((v) => newParams.append('children_age_ranges', v))
      pendingInterests.forEach((v) => newParams.append('interests', v))
      pendingLocations.forEach((v) => newParams.append('provinces', v))
      pendingDadAges.forEach((v) => newParams.append('age_ranges', v))
      return newParams
    })
    setFiltersOpen(false)
  }

  const clearDadsFilters = () => {
    setPendingChildrenAges([])
    setPendingInterests([])
    setPendingLocations([])
    setPendingDadAges([])
    setDadSearchQuery('')
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev)
      newParams.delete('children_age_ranges')
      newParams.delete('interests')
      newParams.delete('provinces')
      newParams.delete('age_ranges')
      newParams.delete('dad_name')
      return newParams
    })
  }

  const clearDadSearch = () => {
    setDadSearchQuery('')
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev)
      newParams.delete('dad_name')
      return newParams
    })
  }

  const handleDadSearch = () => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev)
      if (dadSearchQuery) {
        newParams.set('dad_name', dadSearchQuery)
      } else {
        newParams.delete('dad_name')
      }
      return newParams
    })
  }

  const handleRefreshDads = () => {
    queryClient.removeQueries({ queryKey: ['dads'] })
    queryClient.removeQueries({ queryKey: ['profile'] })
  }

  return (
    <>
      <AppBar title="Dads" width="wide" />

      <PageContainer width="wide" className="animate-fade-in">
  <div className="space-y-4 animate-fade-in">
    <div className="mb-4 flex items-center gap-3">
    <form
      className="relative flex-1 sm:max-w-md"
      onSubmit={(e) => {
        e.preventDefault()
        handleDadSearch()
      }}
    >
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
      <Input
        placeholder="Search dads..."
        value={dadSearchQuery}
        onChange={(e) => setDadSearchQuery(e.target.value)}
        className="pl-10 pr-10 rounded-md"
      />
      {dadSearchQuery && (
        <button
          type="button"
          onClick={clearDadSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </form>

    <div className="shrink-0">
      <Sheet
        open={filtersOpen}
        onOpenChange={handleFiltersOpenChange}
      >
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="rounded-md"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Filter Dads</SheetTitle>
            <SheetDescription>
              Refine your search to find the perfect connections
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Children's Age
              </h3>
              <p className="text-caption text-muted-foreground">
                Select all that apply
              </p>
              <div className="flex gap-2 flex-wrap">
                {STAGE_OPTIONS.map((stage) => (
                  <Badge
                    key={stage.value}
                    variant={
                      pendingChildrenAges.includes(stage.value)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer rounded-md"
                    onClick={() =>
                      togglePendingChildrenAge(stage.value)
                    }
                  >
                    {stage.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Interests
              </h3>
              <p className="text-caption text-muted-foreground">
                Search and select interests
              </p>

              {/* Selected interests display */}
              {pendingInterests.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-2">
                  {pendingInterests.map((interest) => (
                    <Badge
                      key={interest}
                      variant="default"
                      className="cursor-pointer rounded-md"
                      onClick={() => togglePendingInterest(interest)}
                    >
                      {interest} ✕
                    </Badge>
                  ))}
                </div>
              )}

              {/* Interest search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search interests..."
                  value={interestSearchQuery}
                  onChange={(e) =>
                    setInterestSearchQuery(e.target.value)
                  }
                  className="pl-9"
                />
              </div>

              {/* Filtered interest suggestions */}
              {interestSearchQuery && (
                <div className="max-h-40 overflow-y-auto border border-border rounded-md bg-card">
                  {interestOptions
                    .filter(
                      (interest) =>
                        interest
                          .toLowerCase()
                          .includes(
                            interestSearchQuery.toLowerCase(),
                          ) && !pendingInterests.includes(interest),
                    )
                    .map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => {
                          togglePendingInterest(interest)
                          setInterestSearchQuery('')
                        }}
                      >
                        {interest}
                      </button>
                    ))}
                  {interestOptions.filter(
                    (interest) =>
                      interest
                        .toLowerCase()
                        .includes(
                          interestSearchQuery.toLowerCase(),
                        ) && !pendingInterests.includes(interest),
                  ).length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No matching interests
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Location
              </h3>
              <p className="text-caption text-muted-foreground">
                Select all that apply
              </p>
              <div className="flex gap-2 flex-wrap">
                {PROVINCE_OPTIONS.map((province) => (
                  <Badge
                    key={province.value}
                    variant={
                      pendingLocations.includes(province.value)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer rounded-md"
                    onClick={() =>
                      togglePendingLocation(province.value)
                    }
                  >
                    {province.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Age
              </h3>
              <p className="text-caption text-muted-foreground">
                Select all that apply
              </p>
              <div className="flex gap-2 flex-wrap">
                {DISCOVER_DADS_FILTERS_AGE_RANGES.map((range) => (
                  <Badge
                    key={range}
                    variant={
                      pendingDadAges.includes(range)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer rounded-md"
                    onClick={() => togglePendingDadAge(range)}
                  >
                    {range}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <Button
                className="flex-1"
                onClick={applyDadsFilters}
              >
                Apply Filters
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={clearDadsFilters}
              >
                Clear All
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
    </div>

    <div className="space-y-4">
      <QueryState
        query={{
          isPending: dadsLoading,
          isError: dadsError,
          error: dadsQueryError,
          data: profiles,
          refetch: refetchDads,
          isRefetching: isRefetchingDads,
        }}
        noun="dads"
        skeleton={<DadListSkeleton />}
        // A 429 already surfaces as a toast; keep the list on screen rather
        // than replacing it with an error panel.
        ignoreError={(e) => axios.isAxiosError(e) && e.response?.status === 429}
        empty={
          <EmptyState
            title={hasActiveFilters ? 'No dads match your filters' : 'No dads yet'}
            description={
              hasActiveFilters
                ? 'Try widening your search.'
                : 'Check back soon as more dads join.'
            }
            action={
              hasActiveFilters ? { label: 'Clear filters', onClick: clearDadsFilters } : undefined
            }
          />
        }
      >
        {(items) => (
          <ul role="list" className="grid gap-4 sm:grid-cols-2">
            {items.map((profile) => (
              <li key={profile.id}>
                <DadCard {...profile} />
              </li>
            ))}
          </ul>
        )}
      </QueryState>

      <InfiniteSentinel
        hasNextPage={hasNextDads}
        isFetchingNextPage={isFetchingNextDads}
        fetchNextPage={fetchNextDads}
        noun="dads"
      />
    </div>

    <div className="pt-4 flex justify-center">
      <Button
        variant="outline"
        className="w-full sm:w-auto sm:px-8 rounded-md"
        onClick={handleRefreshDads}
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Refresh
      </Button>
    </div>
  </div>
      </PageContainer>
    </>
  )
}

export default DadsPage
