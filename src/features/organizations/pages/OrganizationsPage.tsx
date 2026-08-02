import {useOrganizations} from "../hooks/useOrganizations"
import { ApplicationsSection } from "../components/ApplicationsSection"
import { ActivePartnersSection } from "../components/ActivePartnersSection"

export function OrganizationsPage() {
    const  { data: organizations = [], isLoading, isError, error } = useOrganizations()

    if (isLoading) {
        return <p>Loading organizations...</p>
    }

    if (isError) {
        return (
            <p>Failed to load organizations: {error instanceof Error ? `${error.message}` : ''}</p>
        )
    }

    const applicationOrganizations = organizations.filter(
        (organization) =>
            organization.status === 'pending' ||
            organization.status === 'rejected'
    )

    const approvedOrganizations = organizations.filter(
        (organization) => organization.status === 'approved'
    )

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2x1 font-semibold">Organizations</h1>
                <p className="text-sm text-muted-foreground">Review applications and manage active partners.</p>
            </header>

            <ApplicationsSection organizations={applicationOrganizations} />
            <ActivePartnersSection organizations={approvedOrganizations} />
        </div>
    )
}