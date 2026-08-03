export type OrganizationStatus = 'pending' | 'approved' | 'rejected'

export type OrganizationDecisionStatus = 'approved' | 'rejected'

export type ApplicationAnswers = Record<string, string>

export interface OrganizationSummary {
    id: string
    name: string
    status: OrganizationStatus
    created_at: string
    updated_at: string
}

export interface OrganizationDetail extends OrganizationSummary {
    admin_user_id: string
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
    application_answers: ApplicationAnswers
    notes: Record<string, unknown>[]
    approved_at: string | null
}