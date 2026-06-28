import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../api/adminApi'

export function useAdminFilteredMessages() {
  return useQuery({
    queryKey: ['admin', 'filtered-messages'],
    queryFn: adminApi.getFilteredMessages,
  })
}
