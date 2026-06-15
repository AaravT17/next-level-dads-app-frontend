import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, MessageCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import BottomNav from '@/components/BottomNav'
import logo from '@/assets/logo.png'
import { useConversation } from '../hooks/useConversation'
import { useConversationMessages } from '../hooks/useConversationMessages'
import { useConversationParticipants } from '../hooks/useConversationParticipants'
import { useCreateMessage } from '../hooks/useCreateMessage'
import { useHeartConversation } from '../hooks/useHeartConversation'
import { HeartButton } from '../components/HeartButton'
import { ConversationMessage } from '../components/ConversationMessage'
import { ParticipantList } from '../components/ParticipantList'
import { EmptyState } from '../components/EmptyState'

interface ReplyFormValues {
  body: string
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const ConversationDetailPage = () => {
  const navigate = useNavigate()
  const { communityId, conversationId } = useParams<{
    communityId: string
    conversationId: string
  }>()
  const [replyOpen, setReplyOpen] = useState(false)

  const {
    data: conversation,
    isLoading: convLoading,
    isError: convError,
  } = useConversation(conversationId)

  const { data: messages, isLoading: msgsLoading } = useConversationMessages(conversationId)
  const { data: participants } = useConversationParticipants(conversationId)

  const { heart, unheart } = useHeartConversation(
    conversationId ?? '',
    communityId ?? '',
  )

  const createMessage = useCreateMessage(conversationId ?? '', communityId ?? '')

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
      },
    )
  }

  if (convLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="relative bg-card border-b border-border px-6 py-5 flex items-center justify-center">
          <img src={logo} alt="Next Level Dads" className="h-10 absolute top-4 left-3" />
          <h1 className="text-2xl font-heading font-semibold text-foreground">Conversation</h1>
        </div>
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
        <BottomNav />
      </div>
    )
  }

  if (convError || !conversation) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="relative bg-card border-b border-border px-6 py-5 flex items-center justify-center">
          <img src={logo} alt="Next Level Dads" className="h-10 absolute top-4 left-3" />
          <h1 className="text-2xl font-heading font-semibold text-foreground">Conversation</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load conversation. Please try again.</p>
        </div>
        <BottomNav />
      </div>
    )
  }

  const author = conversation.author

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative bg-card border-b border-border px-6 py-5 flex items-center justify-center">
        <img src={logo} alt="Next Level Dads" className="h-10 absolute top-4 left-3" />
        <h1 className="text-xl font-heading font-semibold text-foreground line-clamp-1 px-16">
          {conversation.title}
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

        {/* Original conversation */}
        <div className="space-y-3">
          {author && (
            <div className="flex items-center gap-2">
              {author.avatar_url ? (
                <img
                  src={author.avatar_url}
                  alt={author.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                  {initials(author.name)}
                </div>
              )}
              <span className="text-sm font-semibold text-foreground">{author.name}</span>
            </div>
          )}

          {conversation.prompt_type && (
            <span className="inline-block text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {conversation.prompt_type}
            </span>
          )}

          <h2 className="text-xl font-heading font-semibold text-foreground">
            {conversation.title}
          </h2>
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">
            {conversation.body}
          </p>

          <div className="flex items-center gap-4 pt-1">
            <HeartButton
              count={conversation.heart_count}
              isHearted={conversation.is_hearted}
              onHeart={() => heart.mutate()}
              onUnheart={() => unheart.mutate()}
              disabled={heart.isPending || unheart.isPending}
              size="md"
            />
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <MessageCircle className="w-4 h-4" />
              {conversation.reply_count} {conversation.reply_count === 1 ? 'reply' : 'replies'}
            </span>
          </div>
        </div>

        <Separator />

        {/* Participants */}
        {participants && participants.length > 0 && (
          <>
            <ParticipantList participants={participants} />
            <Separator />
          </>
        )}

        {/* Replies */}
        <div className="space-y-5">
          <h3 className="font-heading font-semibold text-foreground">
            Join the conversation
          </h3>

          {msgsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : !messages || messages.length === 0 ? (
            <EmptyState
              title="No replies yet"
              description="Be the first to join this conversation."
            />
          ) : (
            <div className="space-y-5">
              {messages.map((msg) => (
                <ConversationMessage key={msg.id} message={msg} />
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Reply composer */}
        {!replyOpen ? (
          <Button
            className="w-full rounded-full"
            variant="outline"
            onClick={() => setReplyOpen(true)}
          >
            Reply
          </Button>
        ) : (
          <form onSubmit={handleSubmit(onReply)} className="space-y-3">
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
              <p className="text-xs text-destructive">{errors.body.message}</p>
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
                disabled={createMessage.isPending}
                className="flex-1 rounded-full"
              >
                {createMessage.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Send reply'
                )}
              </Button>
            </div>
            {createMessage.isError && (
              <p className="text-xs text-destructive text-center">
                Failed to send reply. Please try again.
              </p>
            )}
          </form>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

export default ConversationDetailPage
