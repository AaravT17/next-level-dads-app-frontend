import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { organizationChatsApi } from '@/features/organization-chats/api/organizationChatsApi'
import type { ChatListItem } from '@/features/organization-chats/types/organizationChats'
import { adminOrganizationChatDetail } from '@/lib/routes'

export function OrganizationChatsPage() {
  const navigate = useNavigate()

  const [chats, setChats] = useState<ChatListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadChats() {
      try {
        setIsLoading(true)
        setError(null)

        const data = await organizationChatsApi.getChats()
        setChats(data)
      } catch (err) {
        console.error('Failed to load organization chats:', err)
        setError('Unable to load organization chats.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadChats()
  }, [])

  if (isLoading) {
    return <p>Loading conversations...</p>
  }

  if (error) {
    return <p>{error}</p>
  }

  return (
    <section>
      <div>
        <h2 className="text-3xl font-bold">Partner Messaging</h2>
        <p className="mt-2 text-muted-foreground">
          Conversations between NLD and partner organizations.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {chats.length === 0 ? (
          <p>No organization conversations yet.</p>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.id}
              type="button"
              onClick={() => navigate(adminOrganizationChatDetail(chat.id))}
              className="block w-full rounded-lg border p-4 text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">
                    {chat.organization_name}
                  </h3>

                  {chat.last_message ? (
                    <div className="mt-2">
                      <p className="text-sm font-medium">
                        {chat.last_message.sender_name ?? 'Unknown sender'}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {chat.last_message.is_deleted
                          ? 'Message deleted'
                          : chat.last_message.content}
                      </p>

                      {chat.last_message.subject && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Subject:{' '}
                          {chat.last_message.subject.type ?? 'Attached item'}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No messages yet
                    </p>
                  )}
                </div>

                <time
                  className="shrink-0 text-xs text-muted-foreground"
                  dateTime={chat.updated_at}
                >
                  {new Date(chat.updated_at).toLocaleString()}
                </time>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  )
}