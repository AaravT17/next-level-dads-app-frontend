import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { THEME_OPTIONS, DEFAULT_THEME, type Theme } from '@/lib/theme'

/**
 * Theme chooser.
 *
 * The choice is stored locally by next-themes. Nothing is sent to the server,
 * so it does not follow the user between devices — worth wiring into user
 * preferences later, but deliberately not yet.
 */
export function ThemePicker() {
  const { theme, setTheme } = useTheme()

  // The stored theme is unknown until after hydration; render the default as
  // selected until then so the control does not flicker between options.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const active = (mounted ? theme : DEFAULT_THEME) as Theme

  return (
    <fieldset>
      <legend className="sr-only">Theme</legend>
      <ul role="list" className="grid gap-3 sm:grid-cols-3">
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon
          const selected = active === option.value
          return (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => setTheme(option.value)}
                aria-pressed={selected}
                className={cn(
                  'w-full rounded-md border bg-card p-3 text-left transition-colors duration-fast',
                  selected
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-border hover:border-primary/50',
                )}
              >
                <span
                  aria-hidden
                  className="mb-3 flex h-12 w-full overflow-hidden rounded-sm border border-border"
                >
                  {option.swatch.map((colour, i) => (
                    <span key={i} className="flex-1" style={{ backgroundColor: colour }} />
                  ))}
                </span>

                <span className="flex items-center gap-2">
                  <Icon aria-hidden className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-label text-foreground">{option.label}</span>
                  {selected && <Check aria-hidden className="w-4 h-4 shrink-0 text-primary" />}
                </span>
                <span className="mt-0.5 block text-caption text-muted-foreground">
                  {option.description}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}
