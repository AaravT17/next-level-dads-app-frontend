import { Link, useNavigate } from 'react-router-dom'
import { MessageCircle, Heart, Users, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { communityDetail, conversationDetail } from '@/lib/routes'
import { conversationPromptTypeLabel } from '@/config/constants'
import type { Conversation } from '@/types/communities'
import { PendingReportGate } from './PendingReportGate'

interface ConversationCardProps {
  conversation: Conversation
  /**
   * Shown as an eyebrow above the title. Only the cross-community feed passes
   * this — inside a community the source is already obvious from the page.
   */
  communityName?: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function ConversationCard({ conversation, communityName }: ConversationCardProps) {
  const navigate = useNavigate()

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() =>
        navigate(conversationDetail(conversation.community_id, conversation.id))
      }
    >
      <CardContent className="p-4 space-y-2">
        {communityName && (
          <Link
            to={communityDetail(conversation.community_id)}
            // The whole card opens the post, so the link has to claim its own click.
            onClick={(e) => e.stopPropagation()}
            className="inline-block text-overline uppercase text-primary hover:underline"
          >
            {communityName}
          </Link>
        )}

        {conversation.has_pending_report && !conversation.is_deleted ? (
          <PendingReportGate compact revealable={false}>
            <span />
          </PendingReportGate>
        ) : (
          <>
            <h4 className={`font-semibold leading-snug line-clamp-2 ${
              conversation.is_deleted
                ? 'text-muted-foreground italic'
                : 'text-foreground'
            }`}>
              {conversation.title}
            </h4>

            <p className={`text-sm text-muted-foreground leading-relaxed line-clamp-2 ${
              conversation.is_deleted ? 'italic' : ''
            }`}>
              {conversation.body}
            </p>
          </>
        )}

        <div className="flex items-center justify-between gap-2">
          {conversation.author && (
            <p className="text-caption text-muted-foreground">{conversation.author.name}</p>
          )}
          {!conversation.is_deleted && conversation.prompt_type && (
            <span className="text-caption text-muted-foreground/70 bg-muted px-2.5 py-1 rounded-md ml-auto">
              {conversationPromptTypeLabel(conversation.prompt_type)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-caption text-muted-foreground border-t border-border pt-2 mt-1">
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            {conversation.reply_count}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            {conversation.heart_count}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {conversation.participant_count}
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="w-3.5 h-3.5" />
            {timeAgo(conversation.last_activity_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
