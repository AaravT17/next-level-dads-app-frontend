import { useOrganizationActionItems } from '@/features/organizations/hooks/useOrganizationActionItems'
import { ActionItemsCard } from '../components/ActionItemsCard'

export function AdminOverviewPage() {
  const { 
    data: actionItems = [],
    isLoading,
    isError
  } = useOrganizationActionItems()
  
  return (
    <div className="container pt-8">
      <h1 className="mb-6 text-4xl font-sans tracking-tight">
        Overview
      </h1>
      <div>
        <ActionItemsCard 
          actionItems={actionItems}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </div>
  )
}