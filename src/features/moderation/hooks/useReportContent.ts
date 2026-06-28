import { useMutation, useQueryClient } from '@tanstack/react-query'
import { moderationApi } from '../api/moderationApi'
import type { ReportCreate } from '@/types/moderation'

export function useReportContent() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: ReportCreate) => moderationApi.reportContent(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-conversations'] })
      qc.invalidateQueries({ queryKey: ['conversation'] })
      qc.invalidateQueries({ queryKey: ['conversation-messages'] })
      qc.invalidateQueries({ queryKey: ['message-replies'] })
    },
  })
}
