import { Loader2, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface DeleteContentButtonProps {
  label: 'post' | 'reply'
  isPending: boolean
  onConfirm: () => void
  className?: string
  iconClassName?: string
}

export function DeleteContentButton({
  label,
  isPending,
  onConfirm,
  className,
  iconClassName,
}: DeleteContentButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={isPending}
          className={cn(
            'flex items-center gap-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50',
            className,
          )}
          aria-label={`Delete ${label}`}
        >
          {isPending ? (
            <Loader2 className={cn('w-4 h-4 animate-spin', iconClassName)} />
          ) : (
            <Trash2 className={cn('w-4 h-4', iconClassName)} />
          )}
          Delete
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this {label}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will replace the text with "Removed by original poster."
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
