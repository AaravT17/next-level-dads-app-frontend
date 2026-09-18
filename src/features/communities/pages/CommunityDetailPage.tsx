import { useState, useMemo, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Users, Loader2, Plus, UserPlus } from 'lucide-react'
import { AppBar } from '@/components/layout/AppBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CenteredSpinner } from '@/components/feedback/Spinner'
import { InfiniteSentinel } from '@/components/feedback/InfiniteSentinel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCommunity } from '../hooks/useCommunity'
import { useCommunityConversations } from '../hooks/useCommunityConversations'
import { useJoinCommunity, useLeaveCommunity } from '../hooks/useCommunityMembership'
import { useMarkCommunityVisited } from '../hooks/useMarkCommunityVisited'
import { ConversationCard } from '../components/ConversationCard'
import { ConversationComposer } from '../components/ConversationComposer'
import { InviteFriendsDialog } from '../components/InviteFriendsDialog'
import { CommunityPhotoEditor } from '../components/CommunityPhotoEditor'
import { JoinNudgeProvider } from '../components/JoinNudgeProvider'
import { EmptyState } from '@/components/feedback/EmptyState'
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

const CommunityDetailBody = ({ communityId }: { communityId: string | undefined }) => {
  const navigate = useNavigate()
  const [composerOpen, setComposerOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<ConversationSort>('recent')
  const [timeWindow, setTimeWindow] = useState<ConversationTimeWindow>('all')

  // Opening the community is what clears its "new since you last visited" badge.
  // Fires on mount, throttled per community, and never blocks what renders below.
  useMarkCommunityVisited(communityId)

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

  const handleFetchNextConversations = useCallback(() => {
    fetchNextConversations({ throwOnError: true }).catch(() => {
      toast.error("Couldn't load more conversations")
    })
  }, [fetchNextConversations])

  const joinMutation = useJoinCommunity(communityId!)
  const leaveMutation = useLeaveCommunity(communityId!)

  const handleConversationCreated = (conversationId: string) => {
    setComposerOpen(false)
    navigate(conversationDetail(communityId!, conversationId))
  }

  if (communityLoading) {
    return (
      <>
        <AppBar title="Community" leading="back" />
        <PageContainer>
          <CenteredSpinner label="Loading community" />
        </PageContainer>
      </>
    )
  }

  if (communityError || !community) {
    return (
      <>
        <AppBar title="Community" leading="back" />
        <PageContainer>
          <ErrorState noun="this community" />
        </PageContainer>
      </>
    )
  }

  return (
    <>
      <AppBar title={community.name} leading="back" />

      <PageContainer className="space-y-4 animate-fade-in">
        {/*
          Invite sits above the card and ahead of the community's own name:
          it is the one action you take *on behalf of someone else*, so it
          reads as an aside to the page rather than another membership control
          competing with Join beneath the description.
        */}
        <div className="flex">
          <Button
            variant="outline"
            size="sm"
            className="rounded-md gap-1.5"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus aria-hidden className="w-4 h-4" />
            Invite a friend
          </Button>
        </div>

        <InviteFriendsDialog
          communityId={communityId!}
          communityName={community.name}
          open={inviteOpen}
          onOpenChange={setInviteOpen}
        />

        {/* Community header card */}
        <div className="bg-card border-2 border-primary/30 rounded-xl p-5 space-y-4 shadow-md">
          <div className="flex items-start gap-4">
            <CommunityPhotoEditor
              communityId={communityId!}
              imageUrl={community.image_url}
              communityName={community.name}
              canEdit={community.role === 'admin'}
            />
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="text-xl font-heading font-bold text-foreground">{community.name}</h2>
              {community.description && (
                <p className="text-muted-foreground leading-relaxed">{community.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              {community.member_count} members
            </span>
            {community.role && (
              <Badge variant="soft" className="rounded-md text-caption">
                {community.role}
              </Badge>
            )}
          </div>

          {community.is_member ? (
            <Button
              variant="outline"
              className="rounded-md"
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
              className="rounded-md"
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
            <h2 className="text-subhead font-heading font-semibold text-foreground">
              Conversations
            </h2>
            {!composerOpen && (
              <Button
                className="rounded-md gap-1.5"
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
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
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
                    className={`px-3 py-1 rounded-md text-caption font-medium transition-colors ${
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
              <p className="text-muted-foreground text-body">
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
              <InfiniteSentinel
                hasNextPage={hasNextConversations}
                isFetchingNextPage={isFetchingNextConversations}
                fetchNextPage={handleFetchNextConversations}
                noun="posts"
              />
            </>
          )}
        </div>
      </PageContainer>
    </>
  )
}

/**
 * The provider sits above the whole page so that every like, reply and post
 * inside it — however deep — is counted toward the join prompt, and so the
 * header's own Join button clears that count through the same context.
 */
const CommunityDetailPage = () => {
  const { communityId } = useParams<{ communityId: string }>()

  return (
    <JoinNudgeProvider communityId={communityId}>
      <CommunityDetailBody communityId={communityId} />
    </JoinNudgeProvider>
  )
}

export default CommunityDetailPage
