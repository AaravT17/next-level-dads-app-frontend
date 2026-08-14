import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import type { 
    OrganizationDetail, 
    OrganizationListFilters, 
    ApplicationFilters,
    OrganizationDecisionStatus, 
    InternalNote, 
    ApplicationRow, 
    ActivePartnerRow, 
    OrganizationActionItem } from '@/features/organizations/types/organizations'

const requestConfig = {
    timeout: TIMEOUT_LENGTH_MS, 
}

export const organizationsApi = {
    getApplications: ({
        status,
        search,
        city,
        province,
    }: ApplicationFilters = {}) =>
    axiosPrivate
        .get<ApplicationRow[]>('/api/organizations/applications', {
            ...requestConfig,
            params: {
                status,
                search,
                city,
                province,
            },
        })
        .then((response) => response.data),

    getActivePartners: ({
        search,
        city,
        province,
    }: OrganizationListFilters = {}) =>
        axiosPrivate
            .get<ActivePartnerRow[]>('/api/organizations/active', {
                ...requestConfig,
                params: {
                    search,
                    city,
                    province,
                },
            })
            .then((response) => response.data),

    getActionItems: () =>
        axiosPrivate.get<OrganizationActionItem[]>('/api/organizations/action-items', requestConfig)
                    .then((response) => response.data),

    getOrganization: (organizationId: string) =>
        axiosPrivate.get<OrganizationDetail>(`/api/organizations/${organizationId}`, requestConfig)
                    .then((response) => response.data),

    addInternalNote: (organizationId: string, content: string) =>
        axiosPrivate.post<InternalNote>(`/api/organizations/${organizationId}/notes`, { content }, requestConfig)
                    .then((response) => response.data),

    decideOrganization: (organizationId: string, status: OrganizationDecisionStatus) =>
        axiosPrivate.patch<OrganizationDetail>(`/api/organizations/${organizationId}/decision`, { status }, requestConfig,)
                    .then((response) => response.data)
}