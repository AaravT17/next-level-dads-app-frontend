import type { LucideIcon } from 'lucide-react'
import { Moon, Sun, Palette } from 'lucide-react'

/**
 * The app's themes.
 *
 * "Classic" is the original warm beige-and-gold look and stays the default —
 * switching themes is opt-in, so nobody's app changes under them.
 *
 * Each theme is a block of CSS custom properties in index.css. Nothing reads a
 * theme name at runtime beyond the toggle itself, so adding a fourth is a
 * palette plus an entry here.
 */

export const THEMES = ['classic', 'light', 'dark'] as const

export type Theme = (typeof THEMES)[number]

export const DEFAULT_THEME: Theme = 'classic'

/** Where the choice is remembered. Local only — no backend involved. */
export const THEME_STORAGE_KEY = 'nld-theme'

export type ThemeOption = {
  value: Theme
  label: string
  description: string
  icon: LucideIcon
  /** Swatch colours for the picker preview: [background, surface, accent]. */
  swatch: [string, string, string]
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'classic',
    label: 'Classic',
    description: 'Warm beige and gold',
    icon: Palette,
    swatch: ['hsl(35 37% 90%)', 'hsl(0 0% 100%)', 'hsl(40 60% 57%)'],
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Clean and neutral',
    icon: Sun,
    swatch: ['hsl(220 20% 97%)', 'hsl(0 0% 100%)', 'hsl(38 72% 33%)'],
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Easier on the eyes at night',
    icon: Moon,
    swatch: ['hsl(225 12% 10%)', 'hsl(225 12% 14%)', 'hsl(40 65% 58%)'],
  },
]
