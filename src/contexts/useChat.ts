import { useContext } from 'react'
import { ChatContext } from '@/contexts/ChatContext'

/**
 * Split out of ChatProvider.tsx so that file exports only a component.
 * See the note beside ChatContext itself.
 */
export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
