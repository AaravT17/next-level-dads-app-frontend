import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotification } from '@/contexts/useNotification'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { NavBadge } from '@/components/layout/NavBadge'
import { NotificationPanel } from './NotificationPanel'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { unreadCount } = useNotification()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 -m-2 rounded-md text-foreground"
        >
          <Bell className="w-5 h-5" />
          <NavBadge
            count={unreadCount}
            label="unread notifications"
            className="absolute -top-1 -right-1"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0"
      >
        <NotificationPanel onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}
