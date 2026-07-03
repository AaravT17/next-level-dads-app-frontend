import { useState } from 'react'
import { Flag, Loader2 } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useMutation } from '@tanstack/react-query'
import { moderationApi } from '../api/moderationApi'

interface ReportUserButtonProps {
  userId: string
  userName?: string
  className?: string
}

const REASON_MAX_LENGTH = 500

export function ReportUserButton({ userId, userName, className }: ReportUserButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')

  const report = useMutation({
    mutationFn: moderationApi.reportUser,
  })

  const submit = () => {
    report.mutate(
      { reported_id: userId, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          setOpen(false)
          setReason('')
          toast.success('Report submitted — our team will review this user.')
        },
        onError: (error) => {
          if (axios.isAxiosError(error) && error.response?.status === 429) {
            toast.error('Report limit reached. Please try again later.')
          } else {
            toast.error('Could not submit your report. Please try again.')
          }
        },
      },
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Report ${userName ?? 'user'}`}
        className={cn(
          'flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors',
          className,
        )}
      >
        <Flag className="w-4 h-4" />
        <span>Report user</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report {userName ?? 'this user'}</DialogTitle>
            <DialogDescription>
              Let us know what's wrong. Our team will review the report
              against our community guidelines.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Describe the issue (optional)"
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
                'Submit report'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
