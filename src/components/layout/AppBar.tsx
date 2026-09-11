import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import logo from '@/assets/logo.png'

export type AppBarProps = {
  title: string
  subtitle?: string
  /** 'logo' on tab roots, 'back' on detail screens. */
  leading?: 'logo' | 'back' | 'none'
  /** Explicit back target. Beats history, which can leave the app. */
  backTo?: string
  onBack?: () => void
  actions?: ReactNode
}

/**
 * The page header. Replaces 23 copies of the same title markup.
 *
 * Three-column grid rather than the old absolutely-positioned logo plus a
 * flex-centred title, so the title stays optically centred and long ones
 * ("Connection Requests") no longer collide with the leading element.
 */
export function AppBar({ title, subtitle, leading = 'logo', backTo, onBack, actions }: AppBarProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) return onBack()
    if (backTo) return navigate(backTo)
    navigate(-1)
  }

  return (
    <header className="shrink-0 bg-card border-b border-border">
      <div className="grid grid-cols-[3rem_1fr_3rem] items-center gap-2 px-3 py-3">
        <div className="flex justify-start">
          {leading === 'back' ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="p-2 -m-2 rounded-md text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : leading === 'logo' ? (
            <img src={logo} alt="" aria-hidden className="h-9 w-auto" />
          ) : null}
        </div>

        <div className="min-w-0 text-center">
          <h1 className="font-heading text-title text-foreground truncate">{title}</h1>
          {subtitle ? (
            <p className="text-caption text-muted-foreground truncate">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex justify-end items-center">{actions}</div>
      </div>
    </header>
  )
}
