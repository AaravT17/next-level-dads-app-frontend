import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AppLogo } from './AppLogo'
import { cn } from '@/lib/utils'
import { CONTENT_WIDTH, type ContentWidth } from './contentWidth'
import { AccountButton } from './AccountButton'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'

export type AppBarProps = {
  title: string
  subtitle?: string
  /** 'logo' on tab roots, 'back' on detail screens. */
  leading?: 'logo' | 'back' | 'none'
  /** Explicit back target. Beats history, which can leave the app. */
  backTo?: string
  onBack?: () => void
  actions?: ReactNode
  /** Should match the PageContainer below it. */
  width?: ContentWidth
  /**
   * Set false where this header is not the window's top-right — the chat list
   * pane on desktop, which sits beside the thread rather than spanning it.
   */
  showAccount?: boolean
}

/**
 * The page header.
 *
 * Two layouts. On mobile it is a centred title with the logo at the leading
 * edge — the phone convention. From lg the title left-aligns against the
 * content column, which is how a desktop page header reads, and the logo stays
 * at the leading edge since there is no side rail to carry it.
 */
export function AppBar({
  title,
  subtitle,
  leading = 'logo',
  backTo,
  onBack,
  actions,
  width = 'default',
  showAccount = true,
}: AppBarProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) return onBack()
    if (backTo) return navigate(backTo)
    navigate(-1)
  }

  const back =
    leading === 'back' ? (
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        className="p-2 -m-2 rounded-md text-foreground"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
    ) : null

  return (
    <header className="shrink-0 bg-card border-b border-border">
      <div className={cn(CONTENT_WIDTH[width], 'px-3 sm:px-6')}>
        {/* Mobile: logo · centred title · actions */}
        <div className="relative flex items-center py-3 lg:hidden">
          <div className="flex justify-start shrink-0">
            {back ??
              (leading === 'logo' ? (
                <AppLogo decorative className="h-9 w-auto" />
              ) : null)}
          </div>
          <div className="absolute inset-x-0 flex justify-center pointer-events-none">
            <div className="min-w-0 text-center px-16">
              <h1 className="font-heading text-title text-foreground truncate">{title}</h1>
              {subtitle ? (
                <p className="text-caption text-muted-foreground truncate">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-6 shrink-0">
            {actions}
            {showAccount ? <NotificationBell /> : null}
            {showAccount ? <AccountButton /> : null}
          </div>
        </div>

        {/* Desktop: logo or back · centred title · actions */}
        <div className="relative hidden lg:flex items-center px-0 h-[4.5rem]">
          <div className="flex justify-start shrink-0">
            {back ??
              (leading === 'logo' ? (
                <AppLogo decorative className="h-9 w-auto" />
              ) : null)}
          </div>
          <div className="absolute inset-x-0 flex justify-center pointer-events-none">
            <div className="min-w-0 text-center px-20">
              <h1 className="font-heading text-title text-foreground truncate">{title}</h1>
              {subtitle ? (
                <p className="text-caption text-muted-foreground truncate">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-6 shrink-0">
            {actions}
            {showAccount ? <NotificationBell /> : null}
            {showAccount ? <AccountButton /> : null}
          </div>
        </div>
      </div>
    </header>
  )
}
