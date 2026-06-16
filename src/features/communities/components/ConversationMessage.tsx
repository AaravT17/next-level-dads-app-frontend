import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ConversationMessage as ConversationMessageType } from '@/types/communities'
import { HeartButton } from './HeartButton'
import { MessageRepliesSection } from './MessageRepliesSection'
import { useHeartMessage } from '../hooks/useHeartMessage'
import { ReportButton } from '@/features/moderation/components/ReportButton'

interface ConversationMessageProps {
  message: ConversationMessageType
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

export function ConversationMessage({ message }: ConversationMessageProps) {
  const [showReplies, setShowReplies] = useState(false)
  const { heart, unheart } = useHeartMessage(message.id, message.conversation_id)
  const author = message.author

  const handleRepliesToggle = () => setShowReplies((v) => !v)

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center shrink-0">
        {author?.avatar_url ? (
          <img
            src={author.avatar_url}
            alt={author.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
            {author ? initials(author.name) : '?'}
          </div>
        )}
        <div className="w-0.5 flex-1 bg-border mt-2 rounded-full" />
      </div>

      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">
            {author?.name ?? 'Anonymous'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.created_at)}
          </span>
        </div>

        <p className="text-lg text-foreground mt-1 leading-relaxed whitespace-pre-wrap">
          {message.body}
        </p>

        <div className="mt-1.5 flex items-center gap-4">
          <HeartButton
            count={message.heart_count}
            isHearted={message.is_hearted}
            onHeart={() => heart.mutate()}
            onUnheart={() => unheart.mutate()}
            disabled={heart.isPending || unheart.isPending}
          />
          <button
            type="button"
            onClick={handleRepliesToggle}
            className="flex items-center gap-1.5 text-base text-muted-foreground hover:text-foreground transition-colors"
          >
            {showReplies ? (
              <>Hide replies <ChevronUp className="w-4 h-4" /></>
            ) : message.reply_count > 0 ? (
              <>
                See {message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}
                <ChevronDown className="w-4 h-4" />
              </>
            ) : (
              'Reply'
            )}
          </button>
          <ReportButton contentType="message" contentId={message.id} />
        </div>

        {showReplies && (
          <MessageRepliesSection
            messageId={message.id}
            conversationId={message.conversation_id}
            initialComposing={message.reply_count === 0}
          />
        )}
      </div>
    </div>
  )
}
