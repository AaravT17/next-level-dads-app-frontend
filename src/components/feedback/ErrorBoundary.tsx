import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

/**
 * The app had no error boundary at all, so any render throw blanked the
 * screen with no way back. Class component because React still has no
 * functional equivalent.
 */

export type ErrorBoundaryProps = {
  children: ReactNode
  fallback?: ReactNode
  /** Changing this clears the error — pass the pathname so navigating recovers. */
  resetKey?: string
}

type ErrorBoundaryState = { error: Error | null }

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div>
          <p className="font-heading text-heading text-foreground">Something went wrong</p>
          <p className="text-body text-muted-foreground mt-1">
            This screen ran into an unexpected problem.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload the app
        </Button>
      </div>
    )
  }
}
