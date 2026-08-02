import type { OrganizationSummary } from '@/features/organizations/types/organizations'
import { OrganizationSummaryRow } from '@/features/organizations/components/OrganizationSummaryRow'
interface ApplicationsSectionProps {
    organizations: OrganizationSummary[]
}

export function ApplicationsSection({
    organizations,
}: ApplicationsSectionProps) {
    return (
        <section className="rounded-lg border bg-card">
            <header className="border-b px-4 py-3">
                <h2 className="text-lg font-semibold">Applications</h2>
            </header>

            {organizations.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">
                    No applications found.
                </p>
            ) : (
                <div>
                    {organizations.map((organization) => (
                        <OrganizationSummaryRow
                            key={organization.id}
                            organization={organization}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}