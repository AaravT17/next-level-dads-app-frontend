import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, MessageCircle, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminApi } from '../api/adminApi'
import {
  useAdminContentReports,
  useAdminUserReports,
  useUpdateContentReport,
  useUpdateUserReport,
} from '../hooks/useAdminReports'
import { useAdminFilteredMessages } from '../hooks/useAdminFilteredMessages'
import type {
  AdminContentReport,
  AdminFilteredMessage,
  AdminUserReport,
  ContentType,
} from '../types/admin'

type Queue = 'posts' | 'messages' | 'users'
type QueueItem =
  | {
      kind: 'content-report'
      id: string
      label: string
      title: string
      detail: string | null
      date: string
      contentType: ContentType
      contentId: string
      report: AdminContentReport
    }
  | {
      kind: 'filtered'
      id: string
      label: string
      title: string
      detail: string | null
      date: string
      contentType: ContentType
      contentId: string
      filtered: AdminFilteredMessage
    }
  | {
      kind: 'user-report'
      id: string
      label: string
      title: string
      detail: string | null
      date: string
      userId: string
      report: AdminUserReport
    }

const QUEUE_EMPTY: Record<Queue, string> = {
  posts: 'No pending post reviews.',
  messages: 'No pending message reviews.',
  users: 'No pending user reviews.',
}

const TYPE_LABEL: Record<ContentType, string> = {
  conversation: 'post',
  message: 'message',
  reply: 'reply',
}

function formatDate(date: string) {
  return new Date(date).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function isMessageType(type: ContentType) {
  return type === 'message' || type === 'reply'
}

function initials(name: string | null) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function TargetBadge() {
  return (
    <Badge variant="destructive" className="shrink-0">
      Reported item
    </Badge>
  )
}

function ReportRow({
  item,
  onOpen,
}: {
  item: QueueItem
  onOpen: (item: QueueItem) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={item.kind === 'filtered' ? 'destructive' : 'secondary'}>
              {item.label}
            </Badge>
            {item.kind !== 'filtered' && (
              <span className="text-xs text-muted-foreground">pending report</span>
            )}
            {item.kind === 'filtered' && (
              <span className="text-xs text-muted-foreground">auto-removed</span>
            )}
          </div>
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          {item.detail && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{item.detail}</p>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{formatDate(item.date)}</span>
      </div>
    </button>
  )
}

function ActionButtons({
  item,
  onDone,
}: {
  item: QueueItem
  onDone: () => void
}) {
  const updateContent = useUpdateContentReport()
  const updateUser = useUpdateUserReport()
  const isReport = item.kind === 'content-report' || item.kind === 'user-report'
  const isPending = updateContent.isPending || updateUser.isPending

  const act = (status: 'dismissed' | 'actioned') => {
    if (item.kind === 'content-report') {
      updateContent.mutate(
        { id: item.report.id, status },
        {
          onSuccess: () => {
            toast.success(`Report marked as ${status}.`)
            onDone()
          },
          onError: () => toast.error('Failed to update report.'),
        },
      )
    }
    if (item.kind === 'user-report') {
      updateUser.mutate(
        { id: item.report.id, status },
        {
          onSuccess: () => {
            toast.success(`Report marked as ${status}.`)
            onDone()
          },
          onError: () => toast.error('Failed to update report.'),
        },
      )
    }
  }

  if (!isReport) {
    return (
      <p className="text-sm text-muted-foreground">
        This was auto-removed. Use the surrounding context to decide any follow-up.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="outline"
        onClick={() => act('dismissed')}
        disabled={isPending}
      >
        Dismiss
      </Button>
      <Button
        type="button"
        variant="destructive"
        onClick={() => act('actioned')}
        disabled={isPending}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Take Action'}
      </Button>
    </div>
  )
}

function ContentContext({ item }: { item: Extract<QueueItem, { contentId: string }> }) {
  const [expandedMessageIds, setExpandedMessageIds] = useState<Set<string>>(new Set())
  const query = useQuery({
    queryKey: ['admin', 'context', 'content', item.contentType, item.contentId],
    queryFn: () => adminApi.getContentContext(item.contentType, item.contentId),
  })

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!query.data) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Context unavailable.</p>
  }

  const { conversation, messages, replies } = query.data
  const repliesByMessage = replies.reduce<Record<string, typeof replies>>((acc, reply) => {
    acc[reply.message_id] = [...(acc[reply.message_id] ?? []), reply]
    return acc
  }, {})
  const postIsTarget = item.contentType === 'conversation'
  const reportedReply = item.contentType === 'reply'
  const targetReplyMessageId = replies.find((reply) => reply.is_target)?.message_id

  const isExpanded = (messageId: string) =>
    expandedMessageIds.has(messageId) || (reportedReply && targetReplyMessageId === messageId)

  const toggleReplies = (messageId: string) => {
    setExpandedMessageIds((prev) => {
      const next = new Set(prev)
      if (next.has(messageId)) {
        next.delete(messageId)
      } else {
        next.add(messageId)
      }
      return next
    })
  }

  return (
    <div className="min-h-0 max-h-[56vh] space-y-3 overflow-y-auto pr-1">
      <section
        className={cn(
          'rounded-lg border bg-card p-4 shadow-sm',
          postIsTarget ? 'border-destructive bg-destructive/5 ring-1 ring-destructive/30' : 'border-border',
        )}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">post</Badge>
            {postIsTarget && <TargetBadge />}
          </div>
          <span className="text-xs text-muted-foreground">{formatDate(conversation.created_at)}</span>
        </div>
        <h3 className="line-clamp-2 text-base font-semibold leading-snug">{conversation.title}</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/85">{conversation.body}</p>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            {initials(conversation.author_name)}
          </div>
          <span>{conversation.author_name ?? 'unknown'}</span>
        </div>
      </section>

      {!postIsTarget && messages.length > 0 && (
        <section className="space-y-3">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            Thread context
          </h3>
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3 rounded-lg border border-border p-3',
                message.is_focus && 'border-destructive bg-destructive/5 ring-1 ring-destructive/30',
              )}
            >
              <div className="flex shrink-0 flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {initials(message.author_name)}
                </div>
                <div className="mt-2 min-h-4 w-0.5 flex-1 rounded-full bg-border" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{message.author_name ?? 'Anonymous'}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(message.created_at)}</span>
                  {message.is_target && <TargetBadge />}
                  {message.is_focus && !message.is_target && (
                    <Badge variant="secondary" className="shrink-0">
                      Related message
                    </Badge>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
                {(repliesByMessage[message.id] ?? []).length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleReplies(message.id)}
                    className="mt-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {isExpanded(message.id) ? 'Hide' : 'Show'} {(repliesByMessage[message.id] ?? []).length}{' '}
                    {(repliesByMessage[message.id] ?? []).length === 1 ? 'reply' : 'replies'}
                  </button>
                )}
                {isExpanded(message.id) && (
                  <div className="space-y-2">
                    {(repliesByMessage[message.id] ?? []).map((reply) => (
                      <div
                        key={reply.id}
                        className={cn(
                          'mt-3 flex gap-2.5 rounded-md border border-border bg-background p-3',
                          reply.is_target && 'border-destructive bg-destructive/5 ring-1 ring-destructive/30',
                        )}
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                          {initials(reply.author_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold">{reply.author_name ?? 'Anonymous'}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(reply.created_at)}</span>
                            {reply.is_target && <TargetBadge />}
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{reply.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

function UserContext({ item }: { item: Extract<QueueItem, { userId: string }> }) {
  const query = useQuery({
    queryKey: ['admin', 'context', 'user', item.userId],
    queryFn: () => adminApi.getUserContext(item.userId),
  })

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!query.data) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Context unavailable.</p>
  }

  return (
    <div className="min-h-0 max-h-[56vh] space-y-3 overflow-y-auto pr-1">
      <section className="rounded-lg border border-destructive bg-destructive/5 p-4 ring-1 ring-destructive/20">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initials(query.data.user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold">{query.data.user.name ?? 'unknown user'}</h3>
              <TargetBadge />
            </div>
            <p className="text-sm text-muted-foreground">
              {[query.data.user.city, query.data.user.province].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
        {query.data.user.about && (
          <p className="mt-3 whitespace-pre-wrap text-sm">{query.data.user.about}</p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">All recent behavior</h3>
        {query.data.activity.length === 0 && (
          <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
            No recent posts, messages, or replies found.
          </p>
        )}
        {query.data.activity.map((activity) => (
          <div
            key={`${activity.activity_type}-${activity.id}`}
            className={cn(
              'rounded-lg border border-border p-3',
              activity.activity_type === 'post' ? 'bg-card' : 'bg-background',
            )}
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <Badge variant="secondary">
                {activity.activity_type === 'post' ? 'post' : 'comment'}
              </Badge>
              <span className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</span>
            </div>
            <p className="line-clamp-1 text-sm font-medium">{activity.context_title}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{activity.text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

function ContextDialog({
  item,
  onOpenChange,
}: {
  item: QueueItem | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[82vh] max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden p-5">
        {item && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                {item.title}
              </DialogTitle>
              <DialogDescription className="line-clamp-2">
                {item.detail ?? 'Review the surrounding activity before taking action.'}
              </DialogDescription>
            </DialogHeader>

            {'contentId' in item ? <ContentContext item={item} /> : <UserContext item={item} />}

            <DialogFooter>
              <ActionButtons item={item} onDone={() => onOpenChange(false)} />
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function ReportsTab({ queue }: { queue: Queue }) {
  const [selected, setSelected] = useState<QueueItem | null>(null)
  const [showAutoRemoved, setShowAutoRemoved] = useState(true)
  const contentReports = useAdminContentReports('pending')
  const userReports = useAdminUserReports('pending')
  const filteredMessages = useAdminFilteredMessages()

  const items = useMemo(() => {
    const reportItems: QueueItem[] = (contentReports.data ?? []).map((report) => ({
      kind: 'content-report',
      id: report.id,
      label: TYPE_LABEL[report.content_type],
      title: `${TYPE_LABEL[report.content_type]} reported`,
      detail: report.reason ? `Reason: ${report.reason}` : `Reported by ${report.reporter_name ?? 'unknown'}`,
      date: report.created_at,
      contentType: report.content_type,
      contentId: report.content_id,
      report,
    }))

    const filteredItems: QueueItem[] = (filteredMessages.data ?? []).map((filtered) => ({
      kind: 'filtered',
      id: filtered.id,
      label: TYPE_LABEL[filtered.content_type],
      title: `${TYPE_LABEL[filtered.content_type]} auto-removed`,
      detail: filtered.original_text,
      date: filtered.created_at,
      contentType: filtered.content_type,
      contentId: filtered.content_id,
      filtered,
    }))

    const userItems: QueueItem[] = (userReports.data ?? []).map((report) => ({
      kind: 'user-report',
      id: report.id,
      label: 'user',
      title: `${report.reported_name ?? 'User'} reported`,
      detail: report.reason ? `Reason: ${report.reason}` : `Reported by ${report.reporter_name ?? 'unknown'}`,
      date: report.created_at,
      userId: report.reported_id,
      report,
    }))

    return [...reportItems, ...filteredItems, ...userItems]
      .filter((item) => {
        if (queue === 'posts') {
          return (
            'contentType' in item &&
            item.contentType === 'conversation' &&
            (showAutoRemoved || item.kind !== 'filtered')
          )
        }
        if (queue === 'messages') {
          return (
            'contentType' in item &&
            isMessageType(item.contentType) &&
            (showAutoRemoved || item.kind !== 'filtered')
          )
        }
        return item.kind === 'user-report'
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [contentReports.data, filteredMessages.data, queue, showAutoRemoved, userReports.data])

  const autoRemovedCurrentQueueCount = useMemo(
    () =>
      (filteredMessages.data ?? []).filter((item) => {
        if (queue === 'posts') return item.content_type === 'conversation'
        if (queue === 'messages') return isMessageType(item.content_type)
        return false
      }).length,
    [filteredMessages.data, queue],
  )

  const isLoading = contentReports.isLoading || userReports.isLoading || filteredMessages.isLoading

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {(queue === 'posts' || queue === 'messages') && autoRemovedCurrentQueueCount > 0 && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAutoRemoved((visible) => !visible)}
            >
              {showAutoRemoved ? 'Hide' : 'Show'} auto-removed
            </Button>
          </div>
        )}
        {items.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">{QUEUE_EMPTY[queue]}</p>
        )}
        {items.map((item) => (
          <ReportRow key={`${item.kind}-${item.id}`} item={item} onOpen={setSelected} />
        ))}
      </div>
      <ContextDialog item={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  )
}
