import { useNavigate } from 'react-router-dom'
import { MessageCircle, Heart, Users, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { conversationDetail } from '@/lib/routes'
import type { Conversation } from '@/types/communities'

interface ConversationCardProps {
  conversation: Conversation
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

export function ConversationCard({ conversation }: ConversationCardProps) {
  const navigate = useNavigate()

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() =>
        navigate(conversationDetail(conversation.community_id, conversation.id))
      }
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-foreground leading-snug line-clamp-2 flex-1">
            {conversation.title}
          </h4>
          {conversation.prompt_type && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
              {conversation.prompt_type}
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {conversation.body}
        </p>

        {conversation.author && (
          <p className="text-xs text-muted-foreground">
            {conversation.author.name}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
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
