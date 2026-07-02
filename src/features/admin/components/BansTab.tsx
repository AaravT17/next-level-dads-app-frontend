import { useState } from 'react'
import { Loader2, ShieldOff, ShieldPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAdminBans, useCreateBan, useLiftBan } from '../hooks/useAdminBans'
import type { AdminBan } from '../types/admin'

function BanRow({ ban }: { ban: AdminBan }) {
  const lift = useLiftBan()
  const expiresAt = new Date(ban.expires_at)
  const hoursLeft = Math.ceil((expiresAt.getTime() - Date.now()) / 3_600_000)

  return (
    <div className="border border-border rounded-lg p-4 flex items-start justify-between gap-4">
      <div className="space-y-1 min-w-0">
        <p className="text-sm font-medium">{ban.user_name ?? ban.user_id}</p>
        <p className="text-sm text-muted-foreground">{ban.reason}</p>
        <p className="text-xs text-muted-foreground">
          Expires {expiresAt.toLocaleString()} ({hoursLeft}h remaining)
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="flex-shrink-0"
        onClick={() =>
          lift.mutate(ban.id, {
            onSuccess: () => toast.success('Ban lifted.'),
            onError: () => toast.error('Failed to lift ban.'),
          })
        }
        disabled={lift.isPending}
      >
        {lift.isPending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <>
            <ShieldOff className="w-3 h-3 mr-1" />
            Lift
          </>
        )}
      </Button>
    </div>
  )
}

export function BansTab() {
  const { data, isLoading } = useAdminBans()
  const createBan = useCreateBan()
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState('')
  const [reason, setReason] = useState('')
  const [hours, setHours] = useState('6')

  const submit = () => {
    if (!userId.trim() || !reason.trim()) return
    createBan.mutate(
      { user_id: userId.trim(), reason: reason.trim(), duration_hours: Number(hours) },
      {
        onSuccess: () => {
          setOpen(false)
          setUserId('')
          setReason('')
          setHours('6')
          toast.success('User banned.')
        },
        onError: () => toast.error('Failed to ban user.'),
      },
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
          <ShieldPlus className="w-4 h-4" />
          Issue ban
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {!isLoading && !data?.length && (
        <p className="text-center text-muted-foreground py-12">No active bans.</p>
      )}
      {data?.map((ban) => (
        <BanRow key={ban.id} ban={ban} />
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue a ban</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">User ID</label>
              <Input
                placeholder="UUID of the user to ban"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Reason</label>
              <Textarea
                placeholder="Reason visible to admin logs"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Duration (hours)</label>
              <Input
                type="number"
                min={1}
                max={8760}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={createBan.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={submit}
              disabled={createBan.isPending || !userId.trim() || !reason.trim()}
            >
              {createBan.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Issue ban'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
