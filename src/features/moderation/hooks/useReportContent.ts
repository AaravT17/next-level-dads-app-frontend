import { useMutation } from '@tanstack/react-query'
import { moderationApi } from '../api/moderationApi'
import type { ReportCreate } from '@/types/moderation'

export function useReportContent() {
  return useMutation({
    mutationFn: (payload: ReportCreate) => moderationApi.reportContent(payload),
  })
}
