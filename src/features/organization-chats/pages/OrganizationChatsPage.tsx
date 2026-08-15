import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { organizationChatsApi } from '@/features/organization-chats/api/organizationChatsApi'
import type { ChatListItem } from '@/features/organization-chats/types/organizationChats'
import { adminChatDetail } from '@/lib/routes'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { format, isToday, isYesterday } from 'date-fns'

// TODO: Add conversation search

export function OrganizationChatsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const organizationId = searchParams.get('org_id')

  const [chats, setChats] = useState<ChatListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()

    const formatChatTime = (isoString: string) => {
      const date = new Date(isoString)

      if (isToday(date)) return format(date, 'h:mm a')
      if (isYesterday(date)) return 'Yesterday'
      return format(date, 'MMM d')
  }

  useEffect(() => {
    async function loadPage() {
      try {
        setIsLoading(true)
        setError(null)

        // If an organization ID was supplied, find its chat and redirect to the normal chat-detail route.
        if (organizationId) {
          const chat =
            await organizationChatsApi.getChatByOrganization(organizationId)

          navigate(adminChatDetail(chat.id), { replace: true })
          return
        }

        // Else, load the regular messaging inbox.
        const data = await organizationChatsApi.getChats()
        setChats(data)
      } catch (err) {
        console.error('Failed to load organization chats:', err)
        setError('Unable to load organization chats.')
      } finally {
        setIsLoading(false)
      }
    }
    void loadPage()
  }, [organizationId, navigate])

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
              onClick={() => navigate(adminChatDetail(chat.id))}
              className="block w-full rounded-lg border p-4 text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(chat.organization_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {chat.organization_name}
                      </h3>

                      {chat.organization_status === 'pending' && (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>

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
                </div>

                <time
                  className="shrink-0 text-xs text-muted-foreground"
                  dateTime={chat.updated_at}
                >
                  {formatChatTime(chat.updated_at)}
                </time>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  )
}