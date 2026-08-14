import type { ApplicationFilters, OrganizationListFilters } from '@/features/organizations/types/organizations'

export const organizationKeys = {
    all: ['organizations'] as const,

    applications: () =>
        [...organizationKeys.all, 'applications'] as const,

    applicationList: (filters: ApplicationFilters = {}) =>
        [...organizationKeys.applications(), filters] as const,

    activePartners: (filters: OrganizationListFilters = {}) =>
        [...organizationKeys.all, 'active-partners', filters] as const,

    actionItems: () =>
        [...organizationKeys.all, 'action-items'] as const,

    details: () =>
        [...organizationKeys.all, 'detail'] as const,

    detail: (organizationId: string) =>
        [...organizationKeys.details(), organizationId] as const,
}