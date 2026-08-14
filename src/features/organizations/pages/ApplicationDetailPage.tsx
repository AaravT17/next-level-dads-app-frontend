import { useParams } from "react-router-dom"
import { useOrganization } from "../hooks/useOrganization"  
import { OrganizationDecisionSection } from "../components/OrganizationDecisionSection"
import { InternalNotesSection } from "../components/InternalNotesSection"
import { ApplicationDetailSection } from "../components/ApplicationDetailSection"
import { useState } from "react"

export function ApplicationDetailPage() {
    const { organizationId } = useParams<{ organizationId: string }>()
    const { data: organization, isLoading, isError, error } = useOrganization(organizationId)
    const [hasUnsavedNotes, setHasUnsavedNotes] = useState(false)

    if (isLoading) {
        return <p>Loading...</p>
    }

    if (isError) {
        return ( <p>Failed to load application. 
               {error instanceof Error ? `${error.message}` : ''}</p>)
    }

    if (!organization) {
        return <p>Application not found.</p>
    }

    return (
        <section className="space-y-6">
            <ApplicationDetailSection application={organization} />
            
            <InternalNotesSection
                organizationId={organization.id}
                notes={organization.notes}
                status={organization.status}
                onDirtyChange={setHasUnsavedNotes}
            />

            <OrganizationDecisionSection 
                organizationId={organization.id} 
                status={organization.status} 
                disabled={hasUnsavedNotes}
            />
        </section>  
    )
}