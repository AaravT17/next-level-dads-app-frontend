import { FormEvent, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { organizationChatsApi } from '@/features/organization-chats/api/organizationChatsApi'
import type { Message, OrganizationChat } from '@/features/organization-chats/types/organizationChats'
import { ROUTES } from '@/lib/routes'

export function OrganizationChatDetailPage() {
  const { chatId } = useParams<{ chatId: string }>()

  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [chat, setChat] = useState<OrganizationChat | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!chatId) return

    async function loadMessages() {
      try {
        setIsLoading(true)
        setError(null)

        const [chatData, messagesData] = await Promise.all([
          organizationChatsApi.getChat(chatId),
          organizationChatsApi.getMessages(chatId),
        ])

        setChat(chatData)
        setMessages(messagesData)
      } catch (err) {
        console.error('Failed to load organization messages:', err)
        setError('Unable to load this conversation.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadMessages()
  }, [chatId])

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!chatId || !messageText.trim()) return

    try {
      setIsSending(true)
      setError(null)

      await organizationChatsApi.sendMessage(chatId, {
        content: messageText.trim(),
        subject: null,
      })

      setMessageText('')

      const updatedMessages =
        await organizationChatsApi.getMessages(chatId)

      setMessages(updatedMessages)
    } catch (err) {
      console.error('Failed to send organization message:', err)
      setError('Unable to send message.')
    } finally {
      setIsSending(false)
    }
  }

  if (!chatId) {
    return <p>Conversation not found.</p>
  }

  return (
    <section>
      <div className="mb-6">
        <Link
          to={ROUTES.ADMIN_MESSAGING}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back
        </Link>

        <h2 className="mt-3 text-3xl font-bold">
           {chat?.organization_name ?? 'Organization Conversation'}
        </h2>
      </div>

      {isLoading ? (
        <p>Loading messages...</p>
      ) : (
        <>
          {messages.length === 0 ? (
            <div className="rounded-lg border p-6">
              <p className="text-muted-foreground">
                No messages yet. Start the conversation below.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className="rounded-lg border p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-semibold">
                      {message.sender_name ?? 'Unknown sender'}
                    </p>

                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={message.created_at}
                    >
                      {new Date(message.created_at).toLocaleString()}
                    </time>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap">
                    {message.is_deleted
                      ? 'Message deleted'
                      : message.content}
                  </p>

                  {message.subject && (
                    <div className="mt-3 rounded border p-2 text-sm">
                      <p>
                        <strong>Subject type:</strong>{' '}
                        {message.subject.type ?? 'Unknown'}
                      </p>

                      {message.subject.id && (
                        <p>
                          <strong>Subject ID:</strong>{' '}
                          {message.subject.id}
                        </p>
                      )}
                    </div>
                  )}

                  {message.edited_at && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Edited
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}

          <form
            onSubmit={handleSendMessage}
            className="mt-8 space-y-3"
          >
            <label
              htmlFor="organization-message"
              className="font-medium"
            >
              Send a message
            </label>

            <textarea
              id="organization-message"
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder="Write a message..."
              rows={5}
              maxLength={2000}
              className="w-full rounded-lg border p-3"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {messageText.length}/2000
              </span>

              <button
                type="submit"
                disabled={isSending || !messageText.trim()}
                className="rounded-lg border px-4 py-2 font-medium disabled:opacity-50"
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>

          {error && (
            <p className="mt-4 text-sm">
              {error}
            </p>
          )}
        </>
      )}
    </section>
  )
}