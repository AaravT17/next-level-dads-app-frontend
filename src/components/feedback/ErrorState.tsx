import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from './Spinner'

export type ErrorStateProps = {
  /** Plural noun for the message: "dads" -> "Couldn't load dads." */
  noun: string
  onRetry?: () => void
  isRetrying?: boolean
}

/**
 * Replaces the 13 hand-written "Failed to load X. Please try again." strings,
 * none of which offered a way to actually try again.
 */
export function ErrorState({ noun, onRetry, isRetrying }: ErrorStateProps) {
  return (
    <div className="text-center py-12 px-4" role="alert">
      <AlertCircle
        aria-hidden
        className="w-10 h-10 mx-auto mb-3 text-muted-foreground/60"
        strokeWidth={1.5}
      />
      <p className="font-heading font-medium text-foreground">Couldn&apos;t load {noun}.</p>
      <p className="text-body text-muted-foreground mt-1">Something went wrong on our end.</p>
      {onRetry ? (
        <div className="mt-5">
          <Button variant="outline" onClick={onRetry} disabled={isRetrying}>
            {isRetrying ? <Spinner size="sm" label={null} /> : null}
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  )
}
