import { Button } from '@/components/ui/button'
import type { OrganizationStatus } from '../types/organizations'
import { useOrganizationDecision } from '../hooks/useOrganizationDecision'

interface OrganizationDecisionProps {
  organizationId: string
  status: OrganizationStatus
}
export function OrganizationDecision({ organizationId, status }
    : OrganizationDecisionProps) {
  const { mutate: decideOrganization, isPending, isError, error } = useOrganizationDecision()

  if (status !== 'pending') {
    return (
      <section className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">This application has already been {status}.</p>
      </section>
    )
  }

  return (
    <section className="space-y-4 rounded-lg border bg-card p-4">
      <div>
        <h2 className="text-lg font-semibold">Decision</h2>
      </div>
      <div className="flex gap-3">
        <Button
          type="button"
          disabled={isPending}
          onClick={() => decideOrganization({organizationId, status: 'approved'})}>
            Approve
        </Button>

        <Button
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={() => decideOrganization({organizationId, status: 'rejected'})}>
            Reject
        </Button>
      </div>

      {isPending && (
        <p className="text-sm text-muted-foreground">Saving decision...</p>
      )}
      
      {isError && (
        <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Could not approve this application.'}</p>
      )}
    </section>
  )
}