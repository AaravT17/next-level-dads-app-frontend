import type { OrganizationSummary } from '../types/organizations'
import { OrganizationSummaryRow } from './OrganizationSummaryRow'

interface ActivePartnerNetworkSectionProps {
  organizations: OrganizationSummary[]
}

export function ActivePartnersSection({
  organizations,
}: ActivePartnerNetworkSectionProps) {
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Active Partner Network</h2>
      </header>

      {organizations.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          No approved organizations found.
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