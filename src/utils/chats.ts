import { InfiniteData, QueryClient } from '@tanstack/react-query'
import { Chat, Message } from '@/types/chats'

// ============================================
// insertMessage
// ============================================

/**
 * Insert a message into an oldest-first array.
 * Deduplicates by id. Tiebreaker: created_at ASC, id ASC.
 */
export function insertMessage(messages: Message[], newMsg: Message): Message[] {
  // Dedup
  if (messages.some((m) => m.id === newMsg.id)) return messages

  const result = [...messages]
  let i = result.length - 1

  while (i >= 0) {
    const cur = result[i]
    const before =
      cur.created_at < newMsg.created_at ||
      (cur.created_at === newMsg.created_at && cur.id < newMsg.id)
    if (before) break
    i--
  }

  result.splice(i + 1, 0, newMsg)
  return result
}

// ============================================
// Chat preview cache helpers
// ============================================

type ChatsCache = InfiniteData<Chat[]>

/**
 * Insert a chat into a page maintaining updated_at DESC, id DESC order.
 */
function insertSorted(page: Chat[], chat: Chat): Chat[] {
  const result = [...page]
  let i = 0
  while (i < result.length) {
    const cur = result[i]
    const after =
      cur.updated_at > chat.updated_at ||
      (cur.updated_at === chat.updated_at && cur.id > chat.id)
    if (!after) break
    i++
  }
  result.splice(i, 0, chat)
  return result
}

/**
 * Update the ['chats'] cache when a new message arrives.
 * Finds the chat, updates last_message + updated_at, moves it to front of first page.
 * Returns true if found, false if not.
 */
export function updateChatPreviewOnNewMessage(
  queryClient: QueryClient,
  message: Message,
): boolean {
  const data = queryClient.getQueryData<ChatsCache>(['chats'])
  if (!data) return false

  const newPages = data.pages.map((page) => page.filter((c) => c.id !== message.chat_id))

  let updatedChat: Chat | undefined
  for (const page of data.pages) {
    updatedChat = page.find((c) => c.id === message.chat_id)
    if (updatedChat) break
  }

  if (!updatedChat) return false

  const updated: Chat = {
    ...updatedChat,
    updated_at: message.created_at,
    last_message: {
      id: message.id,
      content: message.content,
      sender_id: message.sender_id,
      sender_name: message.sender_name,
      created_at: message.created_at,
      is_deleted: message.is_deleted,
    },
  }

  // Insert into first page maintaining updated_at DESC, id DESC order
  const [firstPage, ...restPages] = newPages
  queryClient.setQueryData<ChatsCache>(['chats'], {
    ...data,
    pages: [insertSorted(firstPage, updated), ...restPages],
  })

  return true
}

/**
 * Insert a Chat object into the ['chats'] cache first page, ordered by updated_at DESC, id DESC.
 */
export function insertChatPreview(queryClient: QueryClient, chat: Chat): void {
  const data = queryClient.getQueryData<ChatsCache>(['chats'])
  if (!data) return

  const [firstPage, ...restPages] = data.pages

  queryClient.setQueryData<ChatsCache>(['chats'], {
    ...data,
    pages: [insertSorted(firstPage, chat), ...restPages],
  })
}

/**
 * Update last_message.content in the chat preview when a message is edited.
 * Only patches if payload.id matches the chat's last_message.id. No reorder.
 */
export function updateChatPreviewOnEdit(
  queryClient: QueryClient,
  payload: { id: string; chat_id: string; content: string; edited_at: string },
): void {
  const data = queryClient.getQueryData<ChatsCache>(['chats'])
  if (!data) return

  queryClient.setQueryData<ChatsCache>(['chats'], {
    ...data,
    pages: data.pages.map((page) =>
      page.map((c) => {
        if (c.id === payload.chat_id && c.last_message?.id === payload.id) {
          return {
            ...c,
            last_message: { ...c.last_message, content: payload.content },
          }
        }
        return c
      }),
    ),
  })
}

/**
 * Mark last_message as deleted in the chat preview when a message is deleted.
 * Only patches if payload.id matches the chat's last_message.id. No reorder.
 */
export function updateChatPreviewOnDelete(
  queryClient: QueryClient,
  payload: { id: string; chat_id: string },
): void {
  const data = queryClient.getQueryData<ChatsCache>(['chats'])
  if (!data) return

  queryClient.setQueryData<ChatsCache>(['chats'], {
    ...data,
    pages: data.pages.map((page) =>
      page.map((c) => {
        if (c.id === payload.chat_id && c.last_message?.id === payload.id) {
          return {
            ...c,
            last_message: { ...c.last_message, content: '', is_deleted: true },
          }
        }
        return c
      }),
    ),
  })
}

// ============================================
// Messages cache helpers
// ============================================

/**
 * Insert a new message into the ['messages', chatId] cache if it exists.
 * Does nothing if the cache doesn't exist.
 */
export function updateMessagesCache(
  queryClient: QueryClient,
  chatId: string,
  message: Message,
): void {
  const data = queryClient.getQueryData<Message[]>(['messages', chatId])
  if (!data) return

  queryClient.setQueryData<Message[]>(['messages', chatId], insertMessage(data, message))
}

/**
 * Patch a message in the ['messages', chatId] cache by id.
 * Merges payload fields onto the matched message.
 * Does nothing if the cache doesn't exist.
 */
export function patchMessageInCache(
  queryClient: QueryClient,
  chatId: string,
  payload: Partial<Message> & { id: string },
): void {
  const data = queryClient.getQueryData<Message[]>(['messages', chatId])
  if (!data) return

  queryClient.setQueryData<Message[]>(
    ['messages', chatId],
    data.map((m) => (m.id === payload.id ? { ...m, ...payload } : m)),
  )
}
