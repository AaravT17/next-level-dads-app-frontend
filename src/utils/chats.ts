import { InfiniteData, QueryClient } from '@tanstack/react-query'
import { Chat, Message } from '@/types/chats'

// ============================================
// Chat preview cache helpers
// ============================================

type ChatsCache = InfiniteData<Chat[]>

/**
 * Insert a chat into the correct sorted position across all pages (updated_at DESC, id DESC).
 * Walks pages from first to last, within each page from first to last, inserts before the first chat that is
 * less recently active. Falls back to appending to the last page if allowAppend is true, else does nothing.
 * Caller is responsible for removing the chat from pages before calling if it already exists.
 */
function insertChatIntoPages(
  pages: Chat[][],
  chat: Chat,
  allowAppend: boolean,
): { pages: Chat[][]; dropped: boolean } {
  for (let p = 0; p < pages.length; p++) {
    const page = pages[p]
    for (let i = 0; i < page.length; i++) {
      const cur = page[i]
      const insertBefore =
        chat.updated_at > cur.updated_at ||
        (chat.updated_at === cur.updated_at && chat.id > cur.id)
      if (insertBefore) {
        const newPage = [...page]
        newPage.splice(i, 0, chat)
        const newPages = [...pages]
        newPages[p] = newPage
        return { pages: newPages, dropped: false }
      }
    }
  }

  if (!allowAppend) return { pages, dropped: true }

  const newPages = [...pages]
  newPages[newPages.length - 1] = [...newPages[newPages.length - 1], chat]
  return { pages: newPages, dropped: false }
}

/**
 * Update the ['chats'] cache when a new message arrives.
 * Finds the chat, updates last_message + updated_at only if the incoming message
 * is newer than the current last_message, then moves the chat to the correct
 * position in the list of chat previews.
 * Returns true if the chat was found, false if not.
 */
export function updateChatPreviewOnNewMessage(
  queryClient: QueryClient,
  message: Message,
): boolean {
  const data = queryClient.getQueryData<ChatsCache>(['chats'])
  if (!data) return false

  let updatedChat: Chat | undefined
  for (const page of data.pages) {
    updatedChat = page.find((c) => c.id === message.chat_id)
    if (updatedChat) break
  }

  if (!updatedChat) return false

  // Only update if incoming message is newer (or there is no current last_message)
  const currentLastMessage = updatedChat.last_message
  const isNewer =
    !currentLastMessage ||
    message.created_at > currentLastMessage.created_at ||
    (message.created_at === currentLastMessage.created_at &&
      message.id > currentLastMessage.id)

  if (!isNewer) return true

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

  const pagesWithoutChat = data.pages.map((page) =>
    page.filter((c) => c.id !== message.chat_id),
  )
  const { pages: newPages } = insertChatIntoPages(
    pagesWithoutChat,
    updated,
    true,
  )
  queryClient.setQueryData<ChatsCache>(['chats'], {
    ...data,
    pages: newPages,
  })

  return true
}

/**
 * Insert a Chat object into the correct sorted position across all loaded pages.
 * Deduplicates by id — if the chat already exists anywhere in the cache, does nothing.
 * If the chat falls outside the loaded range, invalidates the query to trigger a refetch.
 */
export function insertChatPreview(queryClient: QueryClient, chat: Chat): void {
  const data = queryClient.getQueryData<ChatsCache>(['chats'])
  if (!data) return

  // Dedup: if chat already exists in any page, do nothing
  for (const page of data.pages) {
    if (page.some((c) => c.id === chat.id)) return
  }

  const { pages, dropped } = insertChatIntoPages(data.pages, chat, false)

  if (dropped) {
    queryClient.invalidateQueries({ queryKey: ['chats'] })
    return
  }

  queryClient.setQueryData<ChatsCache>(['chats'], {
    ...data,
    pages,
  })
}

/**
 * Remove a chat from the ['chats'] cache by id.
 */
export function removeChatPreview(
  queryClient: QueryClient,
  chatId: string,
): void {
  const data = queryClient.getQueryData<ChatsCache>(['chats'])
  if (!data) return

  queryClient.setQueryData<ChatsCache>(['chats'], {
    ...data,
    pages: data.pages.map((page) => page.filter((c) => c.id !== chatId)),
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

type MessagesCache = InfiniteData<Message[]>

/**
 * Insert a message into the correct position across all pages (oldest-first within each page,
 * pages ordered oldest-first). Walks backwards from the newest page/message to find the
 * insertion point. Deduplicates at the insertion point in the same pass.
 */
function insertMessageIntoPages(
  pages: Message[][],
  newMsg: Message,
): { pages: Message[][]; dropped: boolean } {
  for (let p = pages.length - 1; p >= 0; p--) {
    const page = pages[p]
    for (let i = page.length - 1; i >= 0; i--) {
      const cur = page[i]
      const belongsBefore =
        cur.created_at < newMsg.created_at ||
        (cur.created_at === newMsg.created_at && cur.id < newMsg.id)
      if (belongsBefore) {
        // newMsg inserts at index i+1 — check for duplicate at that position
        const next = i + 1 < page.length ? page[i + 1] : pages[p + 1]?.[0]
        if (next && next.id === newMsg.id) return { pages, dropped: false }

        const newPage = [...page]
        newPage.splice(i + 1, 0, newMsg)
        const newPages = [...pages]
        newPages[p] = newPage
        return { pages: newPages, dropped: false }
      }
    }
    // newMsg is older than everything in this page — continue to previous page
  }

  // newMsg is older than all loaded messages — drop it, caller will invalidate
  return { pages, dropped: true }
}

/**
 * Insert a new message into the correct page of the ['messages', chatId] infinite cache.
 * Walks pages to find correct position, deduplicates in one pass.
 * Does nothing if the cache doesn't exist.
 */
export function updateMessagesCache(
  queryClient: QueryClient,
  chatId: string,
  message: Message,
): void {
  const data = queryClient.getQueryData<MessagesCache>(['messages', chatId])
  if (!data || data.pages.length === 0) return

  const { pages, dropped } = insertMessageIntoPages(data.pages, message)

  if (dropped) {
    queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
    return
  }

  queryClient.setQueryData<MessagesCache>(['messages', chatId], {
    ...data,
    pages,
  })
}

/**
 * Patch a message across all pages of the ['messages', chatId] infinite cache by id.
 * Merges payload fields onto the matched message.
 * Does nothing if the cache doesn't exist.
 */
export function patchMessageInCache(
  queryClient: QueryClient,
  chatId: string,
  payload: Partial<Message> & { id: string },
): void {
  const data = queryClient.getQueryData<MessagesCache>(['messages', chatId])
  if (!data) return

  queryClient.setQueryData<MessagesCache>(['messages', chatId], {
    ...data,
    pages: data.pages.map((page) =>
      page.map((m) => (m.id === payload.id ? { ...m, ...payload } : m)),
    ),
  })
}
