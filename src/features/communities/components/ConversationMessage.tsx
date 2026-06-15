import type { ConversationMessage as ConversationMessageType } from '@/types/communities'
import { HeartButton } from './HeartButton'
import { useHeartMessage } from '../hooks/useHeartMessage'

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
  const { heart, unheart } = useHeartMessage(message.id, message.conversation_id)
  const author = message.author

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

        <div className="mt-1.5">
          <HeartButton
            count={message.heart_count}
            isHearted={message.is_hearted}
            onHeart={() => heart.mutate()}
            onUnheart={() => unheart.mutate()}
            disabled={heart.isPending || unheart.isPending}
          />
        </div>
      </div>
    </div>
  )
}
