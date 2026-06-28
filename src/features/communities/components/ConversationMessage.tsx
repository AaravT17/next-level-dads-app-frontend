import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ConversationMessage as ConversationMessageType } from '@/types/communities'
import { HeartButton } from './HeartButton'
import { MessageRepliesSection } from './MessageRepliesSection'
import { DeleteContentButton } from './DeleteContentButton'
import { useHeartMessage } from '../hooks/useHeartMessage'
import { useDeleteMessage } from '../hooks/useDeleteMessage'
import { ReportButton } from '@/features/moderation/components/ReportButton'
import { useAuth } from '@/contexts/AuthContext'
import { profileDetail } from '@/lib/routes'
import { PendingReportGate } from './PendingReportGate'

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
  const { user } = useAuth()
  const { heart, unheart } = useHeartMessage(message.id, message.conversation_id)
  const deleteMessage = useDeleteMessage(message.id, message.conversation_id)
  const author = message.author
  const canDelete = !message.is_deleted && author?.id === user?.id

  const handleRepliesToggle = () => setShowReplies((v) => !v)

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center shrink-0">
        {author ? (
          <Link to={profileDetail(author.id)} className="shrink-0">
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
          </Link>
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
            ?
          </div>
        )}
        <div className="w-0.5 flex-1 bg-border mt-2 rounded-full" />
      </div>

      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-baseline gap-2">
          {author ? (
            <Link
              to={profileDetail(author.id)}
              className="text-sm font-semibold text-foreground hover:underline"
            >
              {author.name}
            </Link>
          ) : (
            <span className="text-sm font-semibold text-foreground">Anonymous</span>
          )}
          <span className="text-xs text-muted-foreground">
            {formatTime(message.created_at)}
          </span>
        </div>

        {message.has_pending_report && !message.is_deleted ? (
          <div className="mt-2">
            <PendingReportGate>
              <p className="text-lg leading-relaxed whitespace-pre-wrap text-foreground">
                {message.body}
              </p>
            </PendingReportGate>
          </div>
        ) : (
          <p className={`text-lg mt-1 leading-relaxed whitespace-pre-wrap ${
            message.is_deleted
              ? 'text-muted-foreground italic'
              : 'text-foreground'
          }`}>
            {message.body}
          </p>
        )}

        {(!message.is_deleted || message.reply_count > 0) && (
          <div className="mt-1.5 flex items-center gap-4">
            {!message.is_deleted && (
              <HeartButton
                count={message.heart_count}
                isHearted={message.is_hearted}
                onHeart={() => heart.mutate()}
                onUnheart={() => unheart.mutate()}
                disabled={heart.isPending || unheart.isPending}
              />
            )}
            {(!message.is_deleted || message.reply_count > 0) && (
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
            )}
            {canDelete && (
              <DeleteContentButton
                label="reply"
                isPending={deleteMessage.isPending}
                onConfirm={() => deleteMessage.mutate()}
                className="text-base"
              />
            )}
            {!message.is_deleted && (
              <ReportButton contentType="message" contentId={message.id} />
            )}
          </div>
        )}

        {showReplies && (
          <MessageRepliesSection
            messageId={message.id}
            conversationId={message.conversation_id}
            initialComposing={!message.is_deleted && message.reply_count === 0}
            allowComposing={!message.is_deleted}
          />
        )}
      </div>
    </div>
  )
}
