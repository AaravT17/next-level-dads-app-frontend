import { useQuery } from '@tanstack/react-query'
import { organizationsApi } from '../api/organizationsApi'
import { organizationKeys } from './organizationKeys'

export function useOrganizationActionItems() {
  return useQuery({
    queryKey: organizationKeys.actionItems(),
    queryFn: organizationsApi.getActionItems,
  })
}