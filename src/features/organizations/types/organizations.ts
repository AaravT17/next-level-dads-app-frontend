export type OrganizationStatus = 'pending' | 'approved' | 'rejected'

export interface OrganizationListFilters {
  search?: string
  city?: string
  province?: string
}

export interface ApplicationFilters extends OrganizationListFilters {
  status?: 'pending' | 'rejected'
}

export type OrganizationDecisionStatus = 'approved' | 'rejected'

export type ApplicationAnswers = Record<string, string>

export interface OrganizationActionItem {
  id: string
  name: string
  created_at: string
}

export interface ApplicationRow {
  id: string
  name: string
  status: 'pending' | 'rejected'
  city: string
  province: string
  contact_name: string
  created_at: string
  updated_at: string | null
  last_internal_note: InternalNotePreview | null
}

export interface ActivePartnerRow {
  id: string
  name: string
  city: string
  province: string
  contact_name: string
  approved_at: string
}

export interface InternalNote {
  id: string
  submitted_by: string
  submitted_by_name: string | null
  content: string
  submitted_at: string
}

export interface InternalNotePreview {
  submitted_by_name: string | null
  content: string
  submitted_at: string
}
export interface OrganizationDetail {
    id: string
    admin_user_id: string
    name: string
    email: string
    phone: string | null
    city: string
    province: string
    website: string | null
    description: string
    contact_name: string
    contact_title: string | null
    contact_email: string
    contact_phone: string | null
    status: OrganizationStatus
    application_answers: ApplicationAnswers
    notes: InternalNote[]
    created_at: string
    updated_at: string | null
    approved_at: string | null
}