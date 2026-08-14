import { useOrganizationActionItems } from '@/features/organizations/hooks/useOrganizationActionItems'
import { ActionItemsCard } from '../components/ActionItemsCard'


export function AdminOverviewPage() {
  const { 
    data: actionItems = [],
    isLoading,
    isError
  } = useOrganizationActionItems()
  
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">
          Admin Dashboard
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Overview
        </h1>
        <p className="mt-2 text-muted-foreground">
          Review pending items and manage Next Level Dads activity.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ActionItemsCard 
          actionItems={actionItems}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </div>
  )
}