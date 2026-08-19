import { Link } from 'react-router-dom'
import type { ConversationParticipant } from '@/types/communities'
import { profileDetail } from '@/lib/routes'
import { initials } from '@/utils/format'

interface ParticipantListProps {
  participants: ConversationParticipant[]
}

export function ParticipantList({ participants }: ParticipantListProps) {
  if (participants.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-caption font-medium text-muted-foreground uppercase tracking-wide">
        {participants.length} {participants.length === 1 ? 'dad' : 'dads'} talking
      </p>
      <div className="flex flex-wrap gap-2">
        {participants.map((p) => (
          <Link key={p.id} to={profileDetail(p.id)} title={p.name}>
            {p.avatar_url ? (
              <img
                src={p.avatar_url}
                alt={p.name}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-background"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-caption font-semibold ring-2 ring-background">
                {initials(p.name)}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
