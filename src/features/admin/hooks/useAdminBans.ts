import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../api/adminApi'
import type { AdminBanCreate } from '../types/admin'

export function useAdminBans() {
  return useQuery({
    queryKey: ['admin', 'bans'],
    queryFn: adminApi.getActiveBans,
  })
}

export function useCreateBan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: AdminBanCreate) => adminApi.createBan(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'bans'] }),
  })
}

export function useLiftBan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (banId: string) => adminApi.liftBan(banId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'bans'] }),
  })
}
