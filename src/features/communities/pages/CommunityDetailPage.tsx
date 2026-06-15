import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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

const CommunityDetailPage = () => {
  const navigate = useNavigate()
  const { communityId } = useParams<{ communityId: string }>()
  const queryClient = useQueryClient()
  const [composerOpen, setComposerOpen] = useState(false)

  const {
    data: community,
    isLoading: communityLoading,
    isError: communityError,
  } = useCommunity(communityId)

  const {
    data: conversations,
    isLoading: conversationsLoading,
    isError: conversationsError,
  } = useCommunityConversations(communityId)

  const joinMutation = useMutation({
    mutationFn: () =>
      axiosPrivate.post(`/api/communities/${communityId}/members`, {}, {
        timeout: TIMEOUT_LENGTH_MS,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId!) })
    },
  })

  const leaveMutation = useMutation({
    mutationFn: () =>
      axiosPrivate.delete(`/api/communities/${communityId}/members`, {
        timeout: TIMEOUT_LENGTH_MS,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId!) })
    },
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
      <div className="relative bg-card border-b border-border px-6 py-5 flex items-center justify-center">
        <img src={logo} alt="Next Level Dads" className="h-10 absolute top-4 left-3" />
        <h1 className="text-2xl font-heading font-semibold text-foreground">
          {community.name}
        </h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="-ml-2 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Community header */}
        <div className="space-y-3">
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
              size="sm"
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
              size="sm"
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-semibold text-foreground">
              Conversations
            </h2>
            {!composerOpen && (
              <Button
                size="sm"
                className="rounded-full gap-1.5"
                onClick={() => setComposerOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Start a conversation
              </Button>
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
          ) : !conversations || conversations.length === 0 ? (
            <EmptyState
              title="No conversations yet"
              description="Be the first to start one."
            />
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <ConversationCard key={conv.id} conversation={conv} />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

export default CommunityDetailPage
