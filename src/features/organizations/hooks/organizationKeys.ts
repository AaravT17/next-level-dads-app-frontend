export const organizationKeys = {
    all: ['organizations'] as const,

lists: () => [...organizationKeys.all, 'list'] as const,

list: (status?: string) => [...organizationKeys.lists(), { status }] as const,

details: () => [...organizationKeys.all, 'detail'] as const,

detail: (organizationId: string) => [...organizationKeys.details(), organizationId] as const
}