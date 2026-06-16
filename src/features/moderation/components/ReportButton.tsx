/* ============================================================================
 *  REPORT BUTTON — TEMPORARILY DISABLED
 * ----------------------------------------------------------------------------
 *  The report feature is fully built but hidden for now. The component below
 *  is a stub that renders nothing, so no report button appears anywhere.
 *
 *  >>> TO RE-ENABLE THE REPORT BUTTON, DO THESE 3 THINGS:
 *        1. Uncomment the import block directly below (the `//` imports).
 *        2. DELETE the stub component marked "STUB — DELETE TO RE-ENABLE".
 *        3. Uncomment the real implementation block at the bottom
 *           (everything between "BEGIN REAL IMPLEMENTATION" and "END").
 *
 *  Nothing else needs to change — <ReportButton/> is already wired into
 *  ConversationMessage, MessageRepliesSection and ConversationDetailPage.
 * ========================================================================== */

import type { ModerationContentType } from '@/types/moderation'

// --- 1. UNCOMMENT THESE IMPORTS TO RE-ENABLE --------------------------------
// import { useState } from 'react'
// import { Flag, Loader2 } from 'lucide-react'
// import { toast } from 'sonner'
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from '@/components/ui/dialog'
// import { Button } from '@/components/ui/button'
// import { Textarea } from '@/components/ui/textarea'
// import { cn } from '@/lib/utils'
// import { useReportContent } from '../hooks/useReportContent'

interface ReportButtonProps {
  contentType: ModerationContentType
  contentId: string
  /** Extra classes for the trigger button. */
  className?: string
}

// --- 2. STUB — DELETE TO RE-ENABLE ------------------------------------------
// Renders nothing so the report button stays hidden for now.
export function ReportButton(_props: ReportButtonProps) {
  return null
}

/* ===== BEGIN REAL IMPLEMENTATION (uncomment this whole block to re-enable) ===

const CONTENT_LABEL: Record<ModerationContentType, string> = {
  conversation: 'conversation',
  message: 'message',
  reply: 'reply',
}

const REASON_MAX_LENGTH = 500

export function ReportButton({ contentType, contentId, className }: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const report = useReportContent()
  const label = CONTENT_LABEL[contentType]

  const submit = () => {
    report.mutate(
      {
        content_type: contentType,
        content_id: contentId,
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false)
          setReason('')
          toast.success('Thanks for reporting — our team will review this.')
        },
        onError: () => {
          toast.error('Could not submit your report. Please try again.')
        },
      },
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Report ${label}`}
        className={cn(
          'flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors',
          className,
        )}
      >
        <Flag className="w-4 h-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this {label}</DialogTitle>
            <DialogDescription>
              Let us know what's wrong. Our team will review it against our
              community guidelines.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Add an optional note (what's the issue?)"
            rows={3}
            value={reason}
            maxLength={REASON_MAX_LENGTH}
            onChange={(e) => setReason(e.target.value)}
          />

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={report.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={report.isPending}
              className="rounded-full"
            >
              {report.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Report'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

===== END REAL IMPLEMENTATION ============================================== */
