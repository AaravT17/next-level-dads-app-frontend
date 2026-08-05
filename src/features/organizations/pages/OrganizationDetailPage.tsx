import { useParams } from "react-router-dom"
import { useOrganization } from "../hooks/useOrganization"  
import { OrganizationDecisionSection } from "../components/OrganizationDecisionSection"
import { InternalNotesSection } from "../components/InternalNotesSection"
import { useState } from "react"

export function OrganizationDetailPage() {
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
        // Turn 1st divs into ApplicationDetail components.
        <section className="space-y-6">
            <header>
                <h1 className="text-2xl font-semibold">{organization.name}</h1>
                <p className="text-sm text-muted-foreground">Status: {organization.status}</p>
            </header>

            <div className="rounded-lg border bg-card p-4">
                <p><strong>Organization email:</strong>{' '}{organization.email}</p>
                <p><strong>Contact:</strong>{' '}{organization.contact_name}</p>
                <p><strong>Contact email:</strong>{' '}{organization.contact_email}</p>
                <p><strong>Location:</strong>{' '}{organization.city}, {organization.province}</p>
                <p><strong>Description:</strong>{' '}{organization.description}</p>
            </div>

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