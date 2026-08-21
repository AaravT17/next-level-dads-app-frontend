import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import type {
  AdminBan,
  AdminBanCreate,
  AdminContentReport,
  AdminContentContext,
  AdminFilteredMessage,
  AdminUserReport,
  AdminUserContext,
  ContentType,
  OrganizationEvent,
  OrganizationEventDecisionRequest,
  OrganizationEventDecisionResponse,
  AdminEventsListResponse,
} from '../types/admin'

const t = { timeout: TIMEOUT_LENGTH_MS }

export const adminApi = {
  getContentReports: (status?: string) => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    return axiosPrivate
      .get<AdminContentReport[]>('/api/admin/reports/content', { params, ...t })
      .then((r) => r.data)
  },

  updateContentReport: (reportId: string, status: string) =>
    axiosPrivate.patch(`/api/admin/reports/content/${reportId}`, { status }, t),

  getUserReports: (status?: string) => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    return axiosPrivate
      .get<AdminUserReport[]>('/api/admin/reports/users', { params, ...t })
      .then((r) => r.data)
  },

  updateUserReport: (reportId: string, status: string) =>
    axiosPrivate.patch(`/api/admin/reports/users/${reportId}`, { status }, t),

  getContentContext: (contentType: ContentType, contentId: string) =>
    axiosPrivate
      .get<AdminContentContext>(`/api/admin/context/content/${contentType}/${contentId}`, t)
      .then((r) => r.data),

  getUserContext: (userId: string) =>
    axiosPrivate
      .get<AdminUserContext>(`/api/admin/context/users/${userId}`, {
        params: { limit: 200 },
        ...t,
      })
      .then((r) => r.data),

  getFilteredMessages: () =>
    axiosPrivate
      .get<AdminFilteredMessage[]>('/api/admin/filtered-messages', t)
      .then((r) => r.data),

  getActiveBans: () =>
    axiosPrivate
      .get<AdminBan[]>('/api/admin/bans', t)
      .then((r) => r.data),

  createBan: (payload: AdminBanCreate) =>
    axiosPrivate.post<AdminBan>('/api/admin/bans', payload, t).then((r) => r.data),

  liftBan: (banId: string) =>
    axiosPrivate.delete(`/api/admin/bans/${banId}`, t),

  getOrganizationEvent: (eventId: string) =>
    axiosPrivate
      .get<OrganizationEvent>(`/api/organizations-events/${eventId}`, t)
      .then((r) => r.data),

  decideOrganizationEvent: (
    eventId: string,
    payload: OrganizationEventDecisionRequest,
  ) =>
    axiosPrivate
      .patch<OrganizationEventDecisionResponse>(
        `/api/organizations-events/${eventId}/decision`,
        payload,
        t,
      )
      .then((r) => r.data),

  getAdminEvents: (params?: {
    search?: string
    region?: string
    organization?: string
    format?: string
    category?: string
    status?: string
  }) => {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.region) query.set('region', params.region)
    if (params?.organization) query.set('organization', params.organization)
    if (params?.format) query.set('format', params.format)
    if (params?.category) query.set('category', params.category)
    if (params?.status) query.set('status', params.status)

    return axiosPrivate
      .get<AdminEventsListResponse>(
        `/api/organizations-events${query.toString() ? `?${query}` : ''}`,
        t,
      )
      .then((r) => r.data)
  },
}
