import { useContext } from 'react'
import { AuthContext } from '@/contexts/AuthContext'

/**
 * Split out of AuthProvider.tsx so that file exports only a component.
 * See the note beside AuthContext itself.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
