import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { firstName } from '@/utils/format'
import { CONNECTION_NOTE_MAX_LENGTH } from '../constants'

/**
 * Send a connection request, optionally with a note.
 *
 * Lives on the profile page and not on the browse grid on purpose: Connect
 * there is a one-tap icon action, and putting a dialog behind every tap would
 * tax the primary action of the whole app. By the time someone has opened a
 * profile they have read about the person and may actually have something to
 * say, so the extra step buys something.
 *
 * Two send buttons, not one. "Send without note" is the fast path back to the
 * old one-tap behaviour, and having it explicit means someone who opened the
 * dialog by reflex is one click from the request they actually wanted rather
 * than having to cancel and re-aim. Backing out entirely is the dialog's own
 * close control, so there is no third button competing with the two sends.
 */
export function ConnectRequestDialog({
  open,
  onOpenChange,
  recipientName,
  isSending,
  onSend,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipientName: string
  isSending: boolean
  onSend: (note: string | null) => void
}) {
  const [note, setNote] = useState('')

  // `name` is NOT NULL in the schema, but a blank one would render the
  // placeholder as "Hey , let's connect!" — drop the comma instead.
  const given = firstName(recipientName)
  const placeholder = given ? `Hey ${given}, let's connect!` : "Hey, let's connect!"

  const trimmed = note.trim()
  // Counts what actually gets sent. Measuring the raw input meant trailing
  // whitespace pushed the counter negative and disabled a button whose payload
  // was comfortably inside the limit.
  const remaining = CONNECTION_NOTE_MAX_LENGTH - trimmed.length
  const isOverLimit = remaining < 0

  const handleOpenChange = (next: boolean) => {
    // Discard the draft on close: a half-written note reappearing on the next
    // profile you open would be worse than losing a sentence.
    if (!next) setNote('')
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect with {recipientName}</DialogTitle>
          <DialogDescription>
            Add a note if you want to say why you are reaching out. It is optional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label htmlFor="connection-note" className="sr-only">
            Note to {recipientName}
          </label>
          <Textarea
            id="connection-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            // First name only: the full name reads as a form field, not a
            // message. Claims nothing about either of you — earlier copy
            // suggested shared toddlers to people whose kids are teens.
            placeholder={placeholder}
            className="min-h-[120px] resize-none"
            aria-describedby="connection-note-count"
          />
          <p
            id="connection-note-count"
            aria-live="polite"
            className={cn(
              'text-right text-caption',
              isOverLimit ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {remaining} characters left
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            disabled={isSending}
            onClick={() => onSend(null)}
          >
            Send without note
          </Button>
          <Button
            disabled={isSending || isOverLimit || !trimmed}
            onClick={() => onSend(trimmed)}
          >
            {isSending ? 'Sending...' : 'Send with note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
