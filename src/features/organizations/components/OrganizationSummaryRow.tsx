import { Link } from 'react-router-dom'
import { OrganizationSummary } from '../types/organizations'
import { adminOrganizationDetail } from '@/lib/routes'

interface OrganizationSummaryRowProps {
    organization: OrganizationSummary
}

export function OrganizationSummaryRow({
    organization,
}: OrganizationSummaryRowProps) {
    return (

        <Link
            to={adminOrganizationDetail(organization.id)}
            className="block bored-b px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className="truncate font-medium">{organization.name}</p>
                        <p className="truncate text-sm text-muted-foreground">Submitted {organization.created_at}</p>
                    </div>

                    <span className="text-sm capitalize">{organization.status}</span>
                </div>
        </Link>
    )
}

