import type { ConversationParticipant } from '@/types/communities'

interface ParticipantListProps {
  participants: ConversationParticipant[]
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ParticipantList({ participants }: ParticipantListProps) {
  if (participants.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {participants.length} {participants.length === 1 ? 'dad' : 'dads'} talking
      </p>
      <div className="flex flex-wrap gap-2">
        {participants.map((p) => (
          <div key={p.id} className="flex items-center gap-1.5" title={p.name}>
            {p.avatar_url ? (
              <img
                src={p.avatar_url}
                alt={p.name}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-background"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold ring-2 ring-background">
                {initials(p.name)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
