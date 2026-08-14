import { Button } from '@/components/ui/button'
import type { OrganizationStatus } from '../types/organizations'
import { useOrganizationDecision } from '../hooks/useOrganizationDecision'
import { ROUTES } from '@/lib/routes'
import { useNavigate } from 'react-router-dom'

interface OrganizationDecisionProps {
  organizationId: string
  status: OrganizationStatus
  disabled?: boolean
}
export function OrganizationDecisionSection({ 
  organizationId, 
  status, 
  disabled = false
 }: OrganizationDecisionProps) {
  const { mutate: decideOrganization, isPending, isError, error } = useOrganizationDecision()
  const navigate = useNavigate()
  const handleDecision = ( 
    status: 'approved' | 'rejected') => {
            decideOrganization({organizationId, status},
                                {onSuccess: () => {navigate(ROUTES.ADMIN_ORGANIZATIONS)}
                              })
            }
  const decisionsDisabled = isPending || disabled

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
          disabled={decisionsDisabled}
          onClick={() => handleDecision('approved')}>
            Approve
        </Button>

         <Button
          type="button"
          variant="destructive"
          disabled={decisionsDisabled}
          onClick={() => handleDecision('rejected')}>
            Reject
        </Button>
      </div>

      {disabled && (
        <p className="text-sm text-destructive">
          Save or clear your internal note draft before making a decision.
        </p>
      )}

      {isPending && (
        <p className="text-sm text-muted-foreground">Saving decision...</p>
      )}

      {isError && (
        <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Could not reject this application.'}</p>
      )}
    </section>
  )
}