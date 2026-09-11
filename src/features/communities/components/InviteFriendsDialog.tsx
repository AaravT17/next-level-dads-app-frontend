import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Check, Loader2, Search, UserPlus } from 'lucide-react'
import axiosPrivate from '@/api/axiosPrivate'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/media/UserAvatar'
import { PROFILES_PAGE_LIMIT, TIMEOUT_LENGTH_MS } from '@/config/constants'
import { cn } from '@/lib/utils'
import type { ConnectionResponse, ConnectionsCursor } from '@/types/users'
import { useInviteToCommunity } from '../hooks/useInviteToCommunity'

/** Mirrors COMMUNITY_INVITE_MAX_RECIPIENTS on the server, which enforces it. */
const MAX_RECIPIENTS = 10

const SEARCH_DEBOUNCE_MS = 300

export type InviteFriendsDialogProps = {
  communityId: string
  communityName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Pick connections to invite to a community.
 *
 * Selection is capped at {@link MAX_RECIPIENTS}: each invite is a DM, so an
 * uncapped picker turns one tap into a broadcast. The cap is enforced on the
 * server too — this only keeps the user from building a doomed selection.
 *
 * Selected people are held in a Map rather than a list of ids so the chips
 * survive a search that filters them out of the loaded pages.
 */
export function InviteFriendsDialog({
  communityId,
  communityName,
  open,
  onOpenChange,
}: InviteFriendsDialogProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selected, setSelected] = useState<Map<string, string>>(new Map())

  const invite = useInviteToCommunity(communityId)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['connections', 'community-invite', { name: debouncedSearch }],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('name', debouncedSearch)
      if (pageParam) {
        params.append('cursor_id', pageParam.cursor_id)
        params.append('cursor_updated_at', pageParam.cursor_updated_at)
      }
      const res = await axiosPrivate.get<ConnectionResponse[]>(
        '/api/connections/connected',
        { params, timeout: TIMEOUT_LENGTH_MS },
      )
      return res.data
    },
    initialPageParam: undefined as ConnectionsCursor | undefined,
    enabled: open,
    staleTime: 0,
    gcTime: 0,
    getNextPageParam: (lastPage): ConnectionsCursor | undefined => {
      if (lastPage.length < PROFILES_PAGE_LIMIT) return undefined
      const last = lastPage[lastPage.length - 1]
      return {
        cursor_id: last.connection_id,
        cursor_updated_at: last.connection_updated_at,
      }
    },
  })

  const connections = useMemo(() => data?.pages.flat() ?? [], [data])

  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const isFull = selected.size >= MAX_RECIPIENTS

  const toggle = useCallback((connection: ConnectionResponse) => {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(connection.id)) {
        next.delete(connection.id)
      } else if (next.size < MAX_RECIPIENTS) {
        next.set(connection.id, connection.name)
      }
      return next
    })
  }, [])

  const deselect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelected(new Map())
      setSearch('')
      setDebouncedSearch('')
    }
    onOpenChange(next)
  }

  const handleInvite = () => {
    if (selected.size === 0 || invite.isPending) return
    invite.mutate([...selected.keys()], {
      onSuccess: () => handleOpenChange(false),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Invite a friend</DialogTitle>
          <DialogDescription>
            We&apos;ll send each of them a message with a link to {communityName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search
              aria-hidden
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4"
            />
            <Input
              placeholder="Search connections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-md"
              aria-label="Search connections"
            />
          </div>

          {selected.size > 0 && (
            <div className="flex flex-wrap gap-2">
              {[...selected].map(([id, name]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => deselect(id)}
                  aria-label={`Remove ${name}`}
                  className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md text-sm hover:bg-primary/20 transition-colors"
                >
                  <span>{name.split(' ')[0]}</span>
                  <span aria-hidden className="text-muted-foreground">
                    ×
                  </span>
                </button>
              ))}
            </div>
          )}

          <div
            className="max-h-60 overflow-y-auto space-y-2"
            role="listbox"
            aria-multiselectable
            aria-label="Your connections"
          >
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 aria-hidden className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : isError ? (
              <p className="text-center text-muted-foreground text-sm py-6">
                Couldn&apos;t load your connections.
              </p>
            ) : connections.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">
                {debouncedSearch ? 'No connections match that name.' : 'No connections yet.'}
              </p>
            ) : (
              <>
                {connections.map((connection) => {
                  const isSelected = selected.has(connection.id)
                  // A full selection greys out the rest, but never the ones
                  // already picked — deselecting has to stay available.
                  const isDisabled = isFull && !isSelected
                  return (
                    <button
                      key={connection.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={isDisabled}
                      onClick={() => toggle(connection)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                        isSelected
                          ? 'bg-primary/10 border border-primary'
                          : 'bg-muted/50 hover:bg-muted border border-transparent',
                        isDisabled && 'opacity-40 cursor-not-allowed hover:bg-muted/50',
                      )}
                    >
                      <UserAvatar name={connection.name} src={connection.avatar_url} size="sm" />
                      <span className="flex-1 font-medium truncate">{connection.name}</span>
                      {isSelected && <Check aria-hidden className="w-5 h-5 text-primary" />}
                    </button>
                  )
                })}
                <div ref={sentinelRef} className="h-1" />
                {isFetchingNextPage && (
                  <div className="flex justify-center py-2">
                    <Loader2 aria-hidden className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-caption text-muted-foreground" aria-live="polite">
              {selected.size} of {MAX_RECIPIENTS} selected
            </p>
            <Button
              onClick={handleInvite}
              disabled={selected.size === 0 || invite.isPending}
              className="rounded-md gap-1.5"
            >
              {invite.isPending ? (
                <Loader2 aria-hidden className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus aria-hidden className="w-4 h-4" />
              )}
              Invite
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
