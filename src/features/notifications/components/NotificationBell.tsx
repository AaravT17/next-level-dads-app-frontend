import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useNotification } from '@/contexts/useNotification'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { NavBadge } from '@/components/layout/NavBadge'
import { NotificationPanel } from './NotificationPanel'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()
  const { unreadCount } = useNotification()

  const trigger = (
    <button
      type="button"
      aria-label="Notifications"
      className="relative p-2 -m-2 rounded-md text-foreground"
    >
      <Bell className="w-5 h-5" />
      <NavBadge
        count={unreadCount}
        label="unread notifications"
        className="absolute -top-0.5 -right-0.5"
      />
    </button>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="right" className="p-0 w-full sm:max-w-[380px]">
          <SheetTitle className="sr-only">Notifications</SheetTitle>
          <NotificationPanel onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
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
