import { Loader2 } from 'lucide-react'
import { useAdminFilteredMessages } from '../hooks/useAdminFilteredMessages'

const LAYER_LABELS = {
  profanity: 'Profanity',
  hate_speech: 'Hate speech',
  report: 'User report',
}

const LAYER_COLORS = {
  profanity: 'bg-orange-100 text-orange-800',
  hate_speech: 'bg-red-100 text-red-800',
  report: 'bg-purple-100 text-purple-800',
}

export function FilteredMessagesTab() {
  const { data, isLoading } = useAdminFilteredMessages()

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data?.length) {
    return (
      <p className="text-center text-muted-foreground py-12">No auto-removed content.</p>
    )
  }

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.id} className="border border-border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {item.content_type}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LAYER_COLORS[item.layer]}`}>
              {LAYER_LABELS[item.layer]}
            </span>
            {item.score !== null && (
              <span className="text-xs text-muted-foreground">
                score: {item.score.toFixed(3)}
              </span>
            )}
          </div>

          <blockquote className="border-l-2 border-destructive/40 pl-3 text-sm text-foreground/80 italic">
            {item.original_text}
          </blockquote>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>by {item.author_name ?? 'unknown'}</span>
            <span>{new Date(item.created_at).toLocaleDateString()}</span>
          </div>

          {item.reason && (
            <p className="text-xs text-muted-foreground">Reason: {item.reason}</p>
          )}
        </div>
      ))}
    </div>
  )
}
