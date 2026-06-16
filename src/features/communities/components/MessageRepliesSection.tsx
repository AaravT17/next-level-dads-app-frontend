import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { MessageReply } from '@/types/communities'
import { HeartButton } from './HeartButton'
import { useMessageReplies } from '../hooks/useMessageReplies'
import { useCreateReply } from '../hooks/useCreateReply'
import { useHeartReply } from '../hooks/useHeartReply'
import { useModerationBan } from '@/features/moderation/hooks/useModerationBan'
import { ReportButton } from '@/features/moderation/components/ReportButton'

interface MessageRepliesSectionProps {
  messageId: string
  conversationId: string
  initialComposing?: boolean
}

interface ReplyFormValues {
  body: string
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return d.toLocaleDateString()
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function ReplyItem({ reply }: { reply: MessageReply }) {
  const author = reply.author
  const { heart, unheart } = useHeartReply(reply.id, reply.message_id)

  return (
    <div className="flex gap-2.5 py-2">
      {author?.avatar_url ? (
        <img
          src={author.avatar_url}
          alt={author.name}
          className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
        />
      ) : (
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-semibold shrink-0 mt-0.5">
          {author ? initials(author.name) : '?'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-foreground">
            {author?.name ?? 'Anonymous'}
          </span>
          <span className="text-xs text-muted-foreground">{formatTime(reply.created_at)}</span>
        </div>
        <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap leading-relaxed">
          {reply.body}
        </p>
        <div className="mt-1 flex items-center gap-4">
          <HeartButton
            count={reply.heart_count}
            isHearted={reply.is_hearted}
            onHeart={() => heart.mutate()}
            onUnheart={() => unheart.mutate()}
            disabled={heart.isPending || unheart.isPending}
            size="md"
          />
          <ReportButton contentType="reply" contentId={reply.id} />
        </div>
      </div>
    </div>
  )
}

export function MessageRepliesSection({
  messageId,
  conversationId,
  initialComposing = false,
}: MessageRepliesSectionProps) {
  const [composing, setComposing] = useState(initialComposing)
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useMessageReplies(messageId)
  const replies = useMemo(() => data?.pages.flat() ?? [], [data])
  const createReply = useCreateReply(messageId, conversationId)
  const { isBanned, notice, handlePostError } = useModerationBan()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReplyFormValues>({ defaultValues: { body: '' } })

  const onSubmit = (values: ReplyFormValues) => {
    createReply.mutate(
      { body: values.body.trim() },
      {
        onSuccess: () => {
          reset()
          setComposing(false)
        },
        onError: (error) => handlePostError(error, 'reply'),
      },
    )
  }

  const handleFetchNextPage = () => {
    fetchNextPage({ throwOnError: true }).catch(() => {
      toast.error("Couldn't load more replies")
    })
  }

  return (
    <div className="ml-11 mt-1 border-l-2 border-border pl-3">
      {composing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="pt-2 pb-2 space-y-2">
          <Textarea
            placeholder="Write a reply..."
            rows={2}
            autoFocus
            className="text-sm"
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
              variant="outline"
              size="sm"
              onClick={() => {
                reset()
                setComposing(false)
              }}
              className="flex-1 bg-white text-foreground border-border hover:bg-gray-100 hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createReply.isPending || isBanned}
              className="flex-1 rounded-full"
            >
              {createReply.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                'Send'
              )}
            </Button>
          </div>
          {notice && <p className="text-xs text-destructive">{notice}</p>}
          {createReply.isError && !isBanned && (
            <p className="text-xs text-destructive">Failed to send. Please try again.</p>
          )}
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="text-base font-medium text-primary hover:underline py-2"
        >
          Reply
        </button>
      )}

      {isLoading ? (
        <div className="py-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="divide-y divide-border/50">
            {replies.map((reply) => (
              <ReplyItem key={reply.id} reply={reply} />
            ))}
          </div>
          {hasNextPage && (
            <button
              type="button"
              onClick={handleFetchNextPage}
              disabled={isFetchingNextPage}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline py-2 disabled:opacity-50"
            >
              {isFetchingNextPage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : null}
              {isFetchingNextPage ? 'Loading...' : 'See more replies'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
