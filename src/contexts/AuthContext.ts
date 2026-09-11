import { createContext } from 'react'
import type { AuthContextType } from '@/types/auth'

/**
 * The auth context object, alone in its own module.
 *
 * A file exporting both a component and a context opts out of React Fast
 * Refresh, and this provider wraps the entire app. Provider, hook and context
 * therefore live in three files: AuthProvider.tsx, useAuth.ts, and this one.
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined)
