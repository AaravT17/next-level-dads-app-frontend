import { FormEvent, useEffect, useState, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { organizationChatsApi } from '@/features/organization-chats/api/organizationChatsApi'
import type { Message, OrganizationChat } from '@/features/organization-chats/types/organizationChats'
import { ROUTES } from '@/lib/routes'
import { format } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'

// TODO: Add message pagination for long-running organization conversations.

export function OrganizationChatDetailPage() {
  const { chatId } = useParams<{ chatId: string }>()

  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [chat, setChat] = useState<OrganizationChat | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  const formatMessageTime = (createdAt: string) =>
    format(new Date(createdAt), 'MMM d, h:mm a')

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
        setMessages([...messagesData].reverse())
      } catch (err) {
        console.error('Failed to load organization messages:', err)
        setError('Unable to load this conversation.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadMessages()
  }, [chatId])

  // Keep newest message in view.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
}, [messages])

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

      setMessages([...updatedMessages].reverse())
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
              {messages.map((message) => {
                const isOwn = message.sender_id === user?.id

                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex max-w-[70%] flex-col ${
                        isOwn ? 'items-end' : 'items-start'
                      }`}
                    >
                      {!isOwn && (
                        <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">
                          {message.sender_name ?? 'Unknown sender'}
                        </p>
                      )}

                      <div
                        className={`w-fit rounded-2xl px-4 py-2 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border bg-muted text-foreground'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm">
                          {message.is_deleted
                            ? 'Message deleted'
                            : message.content}
                        </p>
                      </div>

                      <time
                        className="mt-1 px-2 text-xs text-muted-foreground"
                        dateTime={message.created_at}
                      >
                        {formatMessageTime(message.created_at)}
                      </time>
                    </div>
                  </div>
                )
              })}

              <div ref={messagesEndRef} />
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