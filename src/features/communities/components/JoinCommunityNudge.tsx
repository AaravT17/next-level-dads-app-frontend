import { Loader2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'

type Props = {
  communityName: string
  memberCount: number
  open: boolean
  isJoining: boolean
  onJoin: () => void
  onDismiss: () => void
}

/**
 * The invitation shown to someone taking part in a community they have not
 * joined.
 *
 * Deliberately not a toast: joining is a real decision with two answers, and a
 * toast that disappears while you are reading it cannot ask a question. It is
 * also deliberately small — a full-bleed modal would read as a paywall for
 * something that is, in fact, optional.
 *
 * The close affordance is "Not right now" rather than an X, so the softer
 * answer is the one that looks like the way out. Escape and a click outside
 * both resolve to the same thing.
 */
export function JoinCommunityNudge({
  communityName,
  memberCount,
  open,
  isJoining,
  onJoin,
  onDismiss,
}: Props) {
  const members = `${memberCount} ${memberCount === 1 ? 'dad' : 'dads'}`

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss()
      }}
    >
      <DialogContent
        hideCloseButton
        className="max-w-sm gap-0 overflow-hidden rounded-xl border-2 border-primary/30 p-0 shadow-lg"
      >
        {/*
          The warm band carries the emblem and the question; the plain ground
          below carries the answer. Two surfaces rather than one flat sheet is
          what keeps this from reading as a system alert.
        */}
        <div className="space-y-3 bg-gradient-warm px-6 pb-5 pt-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-gold shadow-md">
            <Users aria-hidden className="h-5 w-5 text-primary-foreground" />
          </div>
          <DialogTitle className="text-title font-heading text-foreground">
            Enjoying {communityName}?
          </DialogTitle>
          <DialogDescription className="text-body leading-relaxed text-muted-foreground">
            You have been part of the conversation without joining. Becoming a
            member keeps it with your communities and puts you on the member
            list.
          </DialogDescription>
        </div>

        <div className="space-y-4 px-6 pb-6 pt-5">
          <p className="flex items-center gap-2 text-label text-muted-foreground">
            <Users aria-hidden className="h-4 w-4 shrink-0" />
            {members} already here
          </p>

          <div className="space-y-2">
            <Button
              className="w-full rounded-md"
              onClick={onJoin}
              disabled={isJoining}
            >
              {isJoining ? (
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              ) : (
                'Become a member'
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full rounded-md text-muted-foreground"
              onClick={onDismiss}
              disabled={isJoining}
            >
              Not right now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
