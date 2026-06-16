import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Users, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import BottomNav from '@/components/BottomNav'
import logo from '@/assets/logo.png'
import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import { useCommunity } from '../hooks/useCommunity'
import { useCommunityConversations } from '../hooks/useCommunityConversations'
import { communityKeys } from '../hooks/communityKeys'
import { ConversationCard } from '../components/ConversationCard'
import { ConversationComposer } from '../components/ConversationComposer'
import { EmptyState } from '../components/EmptyState'
import { conversationDetail } from '@/lib/routes'
import type { ConversationSort, ConversationTimeWindow } from '@/types/communities'

const FILTERS: { value: ConversationSort; label: string }[] = [
  { value: 'recent', label: 'Recent' },
  { value: 'popular', label: 'Popular' },
  { value: 'active', label: 'Most Active' },
]

const TIME_WINDOWS: { value: ConversationTimeWindow; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
]

const CommunityDetailPage = () => {
  const navigate = useNavigate()
  const { communityId } = useParams<{ communityId: string }>()
  const queryClient = useQueryClient()
  const [composerOpen, setComposerOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<ConversationSort>('recent')
  const [timeWindow, setTimeWindow] = useState<ConversationTimeWindow>('all')

  const {
    data: community,
    isLoading: communityLoading,
    isError: communityError,
  } = useCommunity(communityId)

  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    isError: conversationsError,
    fetchNextPage: fetchNextConversations,
    hasNextPage: hasNextConversations,
    isFetchingNextPage: isFetchingNextConversations,
  } = useCommunityConversations(communityId, activeFilter, timeWindow)

  const conversations = useMemo(
    () => conversationsData?.pages.flat() ?? [],
    [conversationsData],
  )

  const conversationsSentinelRef = useRef<HTMLDivElement>(null)

  const handleFetchNextConversations = useCallback(() => {
    fetchNextConversations({ throwOnError: true }).catch(() => {
      toast.error("Couldn't load more conversations")
    })
  }, [fetchNextConversations])

  useEffect(() => {
    const sentinel = conversationsSentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextConversations && !isFetchingNextConversations) {
          handleFetchNextConversations()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextConversations, isFetchingNextConversations, handleFetchNextConversations])

  const joinMutation = useMutation({
    mutationFn: () =>
      axiosPrivate.post(`/api/communities/${communityId}/members`, {}, {
        timeout: TIMEOUT_LENGTH_MS,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId!) })
    },
    onError: () => toast.error("Couldn't join community"),
  })

  const leaveMutation = useMutation({
    mutationFn: () =>
      axiosPrivate.delete(`/api/communities/${communityId}/members`, {
        timeout: TIMEOUT_LENGTH_MS,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId!) })
    },
    onError: () => toast.error("Couldn't leave community"),
  })

  const handleConversationCreated = (conversationId: string) => {
    setComposerOpen(false)
    navigate(conversationDetail(communityId!, conversationId))
  }

  if (communityLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="relative bg-card border-b border-border px-6 py-5 flex items-center justify-center">
          <img src={logo} alt="Next Level Dads" className="h-10 absolute top-4 left-3" />
          <h1 className="text-2xl font-heading font-semibold text-foreground">Community</h1>
        </div>
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
        <BottomNav />
      </div>
    )
  }

  if (communityError || !community) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="relative bg-card border-b border-border px-6 py-5 flex items-center justify-center">
          <img src={logo} alt="Next Level Dads" className="h-10 absolute top-4 left-3" />
          <h1 className="text-2xl font-heading font-semibold text-foreground">Community</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load community. Please try again.</p>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative bg-card border-b-2 border-primary px-6 py-7 flex items-center justify-center shadow-sm">
        <img src={logo} alt="Next Level Dads" className="h-10 absolute top-4 left-3" />
        <h1 className="text-2xl font-heading font-semibold text-foreground">
          {community.name}
        </h1>
      </div>

      <div className="max-w-md mx-auto px-4 pt-3 pb-6 space-y-4">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => navigate(-1)}
          className="-ml-2 text-muted-foreground font-bold"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>

        {/* Community header card */}
        <div className="bg-card border-2 border-primary/30 rounded-xl p-5 space-y-4 shadow-md">
          <h2 className="text-xl font-heading font-bold text-foreground">{community.name}</h2>
          {community.description && (
            <p className="text-muted-foreground leading-relaxed">{community.description}</p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              {community.member_count} members
            </span>
            {community.role && (
              <Badge variant="soft" className="rounded-full text-xs">
                {community.role}
              </Badge>
            )}
          </div>

          {community.is_member ? (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => leaveMutation.mutate()}
              disabled={leaveMutation.isPending}
            >
              {leaveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Leave Community'
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Join Community'
              )}
            </Button>
          )}
        </div>

        {/* Conversations section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-lg font-heading font-semibold text-foreground">
              Conversations
            </h2>
            {!composerOpen && (
              <Button
                className="rounded-full gap-1.5"
                onClick={() => setComposerOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Start a conversation
              </Button>
            )}
          </div>

          {/* Filter pills */}
          <div className="space-y-2">
            <div className="flex gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setActiveFilter(f.value)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === f.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {activeFilter !== 'recent' && (
              <div className="flex gap-2 flex-wrap">
                {TIME_WINDOWS.map((w) => (
                  <button
                    key={w.value}
                    onClick={() => setTimeWindow(w.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      timeWindow === w.value
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {composerOpen && (
            <ConversationComposer
              communityId={communityId!}
              onSuccess={handleConversationCreated}
              onCancel={() => setComposerOpen(false)}
            />
          )}

          {conversationsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversationsError ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                Failed to load conversations. Please try again.
              </p>
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState
              title="No conversations yet"
              description="Be the first to start one."
            />
          ) : (
            <>
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <ConversationCard key={conv.id} conversation={conv} />
                ))}
              </div>
              <div ref={conversationsSentinelRef} className="h-4" />
              {isFetchingNextConversations && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

export default CommunityDetailPage
