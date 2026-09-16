import { UserAvatar } from '@/components/media/UserAvatar'

export interface BannerData {
  title: string
  body: string
  avatarName: string
  avatarUrl: string | null
  href: string
  toastId?: string
}

export function BannerCard({
  data,
  onDismiss,
  onClick,
}: {
  data: BannerData
  onDismiss: () => void
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3 bg-background border border-border rounded-lg shadow-lg text-left"
    >
      <UserAvatar name={data.avatarName} src={data.avatarUrl} size="xs" />
      <div className="flex-1 min-w-0">
        <p className="text-caption font-semibold text-foreground truncate">{data.title}</p>
        <p className="text-caption text-muted-foreground truncate">{data.body}</p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDismiss()
        }}
        className="shrink-0 text-muted-foreground hover:text-foreground p-1"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </button>
  )
}
