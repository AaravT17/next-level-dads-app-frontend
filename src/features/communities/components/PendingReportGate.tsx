import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PendingReportGateProps {
  children: React.ReactNode
  compact?: boolean
  revealable?: boolean
}

export function PendingReportGate({
  children,
  compact = false,
  revealable = true,
}: PendingReportGateProps) {
  const [revealed, setRevealed] = useState(false)

  if (revealed) {
    return <>{children}</>
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className={compact ? 'text-sm font-medium' : 'font-medium'}>
            Potentially harmful content
          </p>
          <p className={compact ? 'mt-1 text-xs' : 'mt-1 text-sm'}>
            This content has been reported and is awaiting moderator review.
          </p>
          {revealable && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 border-amber-300 bg-white/70 text-amber-950 hover:bg-white"
              onClick={(event) => {
                event.stopPropagation()
                setRevealed(true)
              }}
            >
              View anyway
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
