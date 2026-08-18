import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type EmptyStateAction = {
  label: string
  /** Route to navigate to. Provide this or onClick. */
  to?: string
  onClick?: () => void
}

export type EmptyStateProps = {
  title: string
  description?: string
  icon?: LucideIcon
  /** An empty screen with a way forward beats a dead end. */
  action?: EmptyStateAction
}

export function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      {Icon ? (
        <Icon
          aria-hidden
          className="w-10 h-10 mx-auto mb-3 text-muted-foreground/60"
          strokeWidth={1.5}
        />
      ) : null}
      <p className="font-heading font-medium text-foreground">{title}</p>
      {description ? (
        <p className="text-body text-muted-foreground mt-1 max-w-[36ch] mx-auto">{description}</p>
      ) : null}
      {action ? (
        <div className="mt-5">
          {action.to ? (
            <Button asChild variant="outline">
              <Link to={action.to}>{action.label}</Link>
            </Button>
          ) : (
            <Button variant="outline" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}
