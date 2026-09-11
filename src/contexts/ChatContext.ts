import { createContext } from 'react'
import type { ChatContextType } from '@/types/chats'

/**
 * The chat context object, alone in its own module.
 *
 * A file exporting both a component and a context opts out of React Fast
 * Refresh, and this provider holds the live WebSocket. Provider, hook and
 * context therefore live in three files: ChatProvider.tsx, useChat.ts, and
 * this one.
 */
export const ChatContext = createContext<ChatContextType | undefined>(undefined)
