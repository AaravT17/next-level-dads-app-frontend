import { ApplicationsCard } from "../components/ApplicationsCard"
import { ActivePartnersCard } from "../components/ActivePartnersCard"
import { OrganizationsFilterBar } from "../components/OrganizationsFilterBar"
import { useActivePartners } from "../hooks/useActivePartners"
import { useApplications } from "../hooks/useApplications"
import { useSearchParams } from "react-router-dom"

export function OrganizationsPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const search = searchParams.get('search') ?? undefined
    const city = searchParams.get('city') ?? undefined
    const province = searchParams.get('province') ?? undefined
    const selectedRegion = city && province ? `${city}|${province}` : 'all'

    const  { 
        data: applications = [], 
        isLoading: applicationsLoading, 
        isError: applicationsError, 
        error: applicationsErrorDetails } = useApplications({search, city, province,})
    const  { 
        data: activePartners = [], 
        isLoading: activePartnersLoading, 
        isError: activePartnersError, 
        error: activePartnersErrorDetails } = useActivePartners({search,city, province,})

    const handleSearchChange = (value: string) => {
        setSearchParams((currentParams) => {
            const nextParams = new URLSearchParams(currentParams)
            if (value.trim()) {
            nextParams.set('search', value.trim())
            } else {
            nextParams.delete('search')
            }
            return nextParams
        })
    }

    const handleRegionChange = (value: string) => {
        setSearchParams((currentParams) => {
            const nextParams = new URLSearchParams(currentParams)
            if (value === 'all') {
                nextParams.delete('city')
                nextParams.delete('province')
            } else {
                const [nextCity, nextProvince] = value.split('|')
                nextParams.set('city', nextCity)
                nextParams.set('province', nextProvince)
            }
            return nextParams
        })
    }

    const handleClearFilters = () => {
        setSearchParams((currentParams) => {
            const nextParams = new URLSearchParams(currentParams)
            nextParams.delete('search')
            nextParams.delete('city')
            nextParams.delete('province')
            return nextParams
        })
    }

    // totalinPipeline returns # of pending and approved organizations.
    // TODO: If number of pending and approved orgs > current limit pagination/dataset limit of 50 per request, implement count endpoint or metadata
    const {
        data: allPendingApplications = [],
    } = useApplications({status: 'pending'})
    const {
        data: allActivePartners = [],
    } = useActivePartners({})
    const totalInPipeline = allPendingApplications.length + allActivePartners.length


    if (applicationsLoading || activePartnersLoading) {
        return <p>Loading organizations...</p>
    }

    if (applicationsError || activePartnersError) {
        const error = applicationsErrorDetails ?? activePartnersErrorDetails
        return (
            <p>
                Failed to load organizations:{' '}
                Failed to load organizations: {error instanceof Error ? error.message : ''}
            </p>
        )
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2x1 font-semibold">Organizations</h1>
                <p className="text-sm text-muted-foreground">Review applications and manage active partners.</p>
            </header>
            <OrganizationsFilterBar
                searchValue={search ?? ''}
                onSearchChange={handleSearchChange}
                selectedRegion={selectedRegion} 
                onRegionChange={handleRegionChange}
                onClearFilters={handleClearFilters} 
                totalInPipeline={totalInPipeline}
            />
            <ApplicationsCard 
                applications={applications}
                isLoading={applicationsLoading}
                isError={applicationsError}
            />
            <ActivePartnersCard 
                activePartners={activePartners}
                isLoading={activePartnersLoading}
                isError={activePartnersError}
            />
        </div>
    )
}