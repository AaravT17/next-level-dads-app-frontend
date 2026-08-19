import { Outlet, useLocation } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { ROUTES } from '@/lib/routes'
import Chats from '../Chats'

/**
 * Chat as one pane or two.
 *
 * On a phone the list and the thread are separate screens, which is right.
 * On a laptop that means opening a conversation throws away the list and
 * leaves most of the window empty, so from lg they sit side by side and
 * switching conversations keeps your place.
 *
 * The panes are mounted conditionally rather than toggled with `hidden`,
 * because the list pane owns the page's <main> and hiding it would leave the
 * skip link pointing at a display:none target.
 */
export function ChatsLayout() {
  const isDesktop = useIsDesktop()
  const { pathname } = useLocation()
  const isThreadOpen = pathname !== ROUTES.CHATS

  if (!isDesktop) {
    return isThreadOpen ? <Outlet /> : <Chats />
  }

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex w-80 xl:w-96 shrink-0 flex-col border-r border-border">
        <Chats />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  )
}

/** Shown in the thread pane on desktop when no conversation is selected. */
export function ChatsEmptyPane() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <MessageCircle aria-hidden className="w-10 h-10 text-muted-foreground/50" strokeWidth={1.5} />
      <div>
        <p className="font-heading text-subhead text-foreground">No conversation selected</p>
        <p className="text-body text-muted-foreground mt-1">
          Pick a chat from the list, or start a new one.
        </p>
      </div>
    </div>
  )
}
