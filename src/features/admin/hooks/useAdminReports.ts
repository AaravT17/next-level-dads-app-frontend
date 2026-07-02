import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../api/adminApi'

export function useAdminContentReports(status?: string) {
  return useQuery({
    queryKey: ['admin', 'reports', 'content', status],
    queryFn: () => adminApi.getContentReports(status),
  })
}

export function useAdminUserReports(status?: string) {
  return useQuery({
    queryKey: ['admin', 'reports', 'users', status],
    queryFn: () => adminApi.getUserReports(status),
  })
}

export function useUpdateContentReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateContentReport(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reports', 'content'] }),
  })
}

export function useUpdateUserReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateUserReport(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reports', 'users'] }),
  })
}
