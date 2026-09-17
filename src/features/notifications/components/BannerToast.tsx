import { UserAvatar } from '@/components/media/UserAvatar'

export interface BannerData {
  title: string
  body: string
  boldPrefix?: string
  avatarName: string
  avatarUrl: string | null
  isGroup?: boolean
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
      className="flex items-center gap-3 w-[calc(100vw-1.5rem)] max-w-[68rem] h-20 px-4 bg-background border border-border rounded-lg shadow-lg text-left"
    >
      <UserAvatar name={data.avatarName} src={data.avatarUrl} size="sm" showInitials={!data.isGroup} />
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-foreground truncate">{data.title}</p>
        <p className="text-base text-muted-foreground truncate">
          {data.boldPrefix ? <><span className="font-semibold text-foreground">{data.boldPrefix}</span>{' '}{data.body}</> : data.body}
        </p>
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
