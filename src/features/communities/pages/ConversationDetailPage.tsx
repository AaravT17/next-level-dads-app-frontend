import { useState, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import { ChevronRight, Loader2, MessageCircle, Users } from 'lucide-react'
import { AppBar } from '@/components/layout/AppBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CenteredSpinner } from '@/components/feedback/Spinner'
import { InfiniteSentinel } from '@/components/feedback/InfiniteSentinel'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { conversationPromptTypeLabel } from '@/config/constants'
import { useConversation } from '../hooks/useConversation'
import { useConversationMessages } from '../hooks/useConversationMessages'
import { useConversationParticipants } from '../hooks/useConversationParticipants'
import { useCreateMessage } from '../hooks/useCreateMessage'
import { useModerationBan } from '@/features/moderation/hooks/useModerationBan'
import { ReportButton } from '@/features/moderation/components/ReportButton'
import { useHeartConversation } from '../hooks/useHeartConversation'
import { useDeleteConversation } from '../hooks/useDeleteConversation'
import { HeartButton } from '../components/HeartButton'
import { ConversationMessage } from '../components/ConversationMessage'
import { ParticipantList } from '../components/ParticipantList'
import { EmptyState } from '@/components/feedback/EmptyState'
import { DeleteContentButton } from '../components/DeleteContentButton'
import { useAuth } from '@/contexts/useAuth'
import { communityDetail, profileDetail } from '@/lib/routes'
import { initials } from '@/utils/format'
import { useCommunity } from '../hooks/useCommunity'
import { JoinNudgeProvider } from '../components/JoinNudgeProvider'

interface ReplyFormValues {
  body: string
}

type BodyProps = {
  communityId: string | undefined
  conversationId: string | undefined
}

const ConversationDetailBody = ({ communityId, conversationId }: BodyProps) => {
  const { data: community } = useCommunity(communityId)
  const [replyOpen, setReplyOpen] = useState(false)
  const { user } = useAuth()

  const {
    data: conversation,
    isLoading: convLoading,
    isError: convError,
  } = useConversation(conversationId)

  const {
    data: messagesData,
    isLoading: msgsLoading,
    fetchNextPage: fetchNextMessages,
    hasNextPage: hasNextMessages,
    isFetchingNextPage: isFetchingNextMessages,
  } = useConversationMessages(conversationId)

  const messages = useMemo(() => messagesData?.pages.flat() ?? [], [messagesData])

  const handleFetchNextMessages = useCallback(() => {
    fetchNextMessages({ throwOnError: true }).catch(() => {
      toast.error("Couldn't load more replies")
    })
  }, [fetchNextMessages])

  const { data: participants } = useConversationParticipants(conversationId)

  const { heart, unheart } = useHeartConversation(
    conversationId ?? '',
    communityId ?? '',
  )
  const deleteConversation = useDeleteConversation(
    conversationId ?? '',
    communityId ?? '',
  )

  const createMessage = useCreateMessage(conversationId ?? '', communityId ?? '')
  const { isBanned, notice, handlePostError } = useModerationBan()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReplyFormValues>({ defaultValues: { body: '' } })

  const onReply = (values: ReplyFormValues) => {
    createMessage.mutate(
      { body: values.body.trim() },
      {
        onSuccess: () => {
          reset()
          setReplyOpen(false)
        },
        onError: (error) => {
          if (axios.isAxiosError(error) && error.response?.status === 429) {
            toast.error('Too many messages sent. Please slow down.')
          } else {
            handlePostError(error, 'reply')
          }
        },
      },
    )
  }

  if (convLoading) {
    return (
      <>
        <AppBar title="Conversation" leading="back" />
        <PageContainer>
          <CenteredSpinner label="Loading conversation" />
        </PageContainer>
      </>
    )
  }

  if (convError || !conversation) {
    return (
      <>
        <AppBar title="Conversation" leading="back" />
        <PageContainer>
          <ErrorState noun="this conversation" />
        </PageContainer>
      </>
    )
  }

  const author = conversation.author
  const canDeleteConversation =
    !conversation.is_deleted && author?.id === user?.id

  return (
    <>
      <AppBar title="Community post" leading="back" />

      <PageContainer className="space-y-6 animate-fade-in">
        {/*
          Attribution, not navigation back — the AppBar already owns "back".
          Arriving from the feed this is the only route to the community.
        */}
        {communityId && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5">
            <Users aria-hidden className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="text-label text-muted-foreground">Posted in</span>
            <Link
              to={communityDetail(communityId)}
              className="group inline-flex min-w-0 items-center gap-1 text-label font-semibold text-primary hover:underline"
            >
              <span className="truncate">{community?.name ?? 'this community'}</span>
              <ChevronRight
                aria-hidden
                className="w-4 h-4 shrink-0 transition-transform duration-fast group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        )}

        {/* Original conversation post */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          {author && (
            <div className="flex items-center gap-2">
              <Link to={profileDetail(author.id)} className="shrink-0" onClick={(e) => e.stopPropagation()}>
                {author.avatar_url ? (
                  <img
                    src={author.avatar_url}
                    alt={author.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-caption font-semibold">
                    {initials(author.name)}
                  </div>
                )}
              </Link>
              <Link
                to={profileDetail(author.id)}
                className="text-sm font-semibold text-foreground hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {author.name}
              </Link>
              {conversation.prompt_type && (
                <span className="ml-auto text-caption text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                  {conversationPromptTypeLabel(conversation.prompt_type)}
                </span>
              )}
            </div>
          )}

          <h2 className="text-xl font-heading font-semibold text-foreground">
            {conversation.title}
          </h2>
          <p className={`leading-relaxed whitespace-pre-wrap ${
            conversation.is_deleted
              ? 'text-muted-foreground italic'
              : 'text-foreground'
          }`}>
            {conversation.body}
          </p>

          <div className="flex items-center gap-4 pt-1 border-t border-border">
            {!conversation.is_deleted && (
              <HeartButton
                count={conversation.heart_count}
                isHearted={conversation.is_hearted}
                onHeart={() => heart.mutate()}
                onUnheart={() => unheart.mutate()}
                disabled={heart.isPending || unheart.isPending}
                size="md"
              />
            )}
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <MessageCircle className="w-4 h-4" />
              {conversation.reply_count} {conversation.reply_count === 1 ? 'reply' : 'replies'}
            </span>
            <div className="ml-auto flex items-center gap-3">
              {canDeleteConversation && (
                <DeleteContentButton
                  label="post"
                  isPending={deleteConversation.isPending}
                  onConfirm={() => deleteConversation.mutate()}
                  className="text-sm"
                />
              )}
              {!conversation.is_deleted && (
                <ReportButton
                  contentType="conversation"
                  contentId={conversation.id}
                />
              )}
            </div>
          </div>
        </div>

        {/* Participants */}
        {participants && participants.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <ParticipantList participants={participants} />
          </div>
        )}

        {/* Replies */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-2xl font-heading font-semibold text-foreground">
              Replies
            </h3>
            {!conversation.is_deleted && !replyOpen && (
              <Button
                className="rounded-md px-12"
                onClick={() => setReplyOpen(true)}
              >
                Reply
              </Button>
            )}
          </div>

          {!conversation.is_deleted && replyOpen && (
            <form onSubmit={handleSubmit(onReply)} className="space-y-3 bg-card border border-border rounded-xl p-4">
              <Textarea
                placeholder="Write a reply..."
                rows={3}
                autoFocus
                {...register('body', {
                  required: 'Reply cannot be empty',
                  maxLength: { value: 3000, message: 'Max 3000 characters' },
                })}
              />
              {errors.body && (
                <p className="text-caption text-destructive">{errors.body.message}</p>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    reset()
                    setReplyOpen(false)
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMessage.isPending || isBanned}
                  className="flex-1 rounded-md"
                >
                  {createMessage.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Send reply'
                  )}
                </Button>
              </div>
              {notice && (
                <p className="text-caption text-destructive text-center">{notice}</p>
              )}
              {createMessage.isError && !isBanned && !(axios.isAxiosError(createMessage.error) && createMessage.error.response?.status === 429) && (
                <p className="text-caption text-destructive text-center">
                  Failed to send reply. Please try again.
                </p>
              )}
            </form>
          )}

          {msgsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState
              title="No replies yet"
              description="Be the first to join this conversation."
            />
          ) : (
            <>
              <div>
                {messages.map((msg) => (
                  <ConversationMessage key={msg.id} message={msg} />
                ))}
              </div>
              <InfiniteSentinel
                hasNextPage={hasNextMessages}
                isFetchingNextPage={isFetchingNextMessages}
                fetchNextPage={handleFetchNextMessages}
                noun="replies"
              />
            </>
          )}
        </div>
      </PageContainer>
    </>
  )
}

/**
 * Replies and likes on this page belong to the community the post sits in, so
 * the join prompt is scoped here just as it is on the community page itself.
 */
const ConversationDetailPage = () => {
  const { communityId, conversationId } = useParams<{
    communityId: string
    conversationId: string
  }>()

  return (
    <JoinNudgeProvider communityId={communityId}>
      <ConversationDetailBody
        communityId={communityId}
        conversationId={conversationId}
      />
    </JoinNudgeProvider>
  )
}

export default ConversationDetailPage
