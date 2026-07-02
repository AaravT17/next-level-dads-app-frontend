import axios from 'axios'
import { formatDistanceToNow } from 'date-fns'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { moderationApi } from '../api/moderationApi'
import { moderationKeys } from './moderationKeys'

const BAN_REFETCH_MS = 60_000

/** What the user was trying to post — drives the failure-toast copy. */
export type PostFailureContext = 'conversation' | 'reply'

interface BanGate {
  /** True while the user has an active posting ban. */
  isBanned: boolean
  /** Inline notice to render near a disabled composer, or null. */
  notice: string | null
  /**
   * Pass to a create mutation's `onError`. If the failure is a 403 ban, it
   * surfaces the ban toast and flips the UI to banned (covers the race where a
   * ban becomes active mid-session). For any other failure (network/server) it
   * surfaces a generic "couldn't post" toast for the given context.
   */
  handlePostError: (error: unknown, context?: PostFailureContext) => void
}

function parseBanError(error: unknown): { isBan: boolean; expiresAt: string | null } {
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    const detail = error.response.data?.detail as { expires_at?: string } | undefined
    return { isBan: true, expiresAt: detail?.expires_at ?? null }
  }
  return { isBan: false, expiresAt: null }
}

function suspensionNotice(expiresAt: string | null): string {
  if (!expiresAt) return 'Your posting access is temporarily suspended.'
  const when = formatDistanceToNow(new Date(expiresAt), { addSuffix: true })
  return `Your posting access is temporarily suspended. You can post again ${when}.`
}

function failureNotice(context: PostFailureContext): string {
  return `Couldn't post your ${context}. Please try again.`
}

export function useModerationBan(): BanGate {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: moderationKeys.ban(),
    queryFn: moderationApi.getBanStatus,
    enabled: !!user,
    refetchInterval: user ? BAN_REFETCH_MS : false,
  })

  const isBanned = !!data?.banned
  const notice = isBanned ? suspensionNotice(data?.expires_at ?? null) : null

  const handlePostError = (error: unknown, context: PostFailureContext = 'reply') => {
    const { isBan, expiresAt } = parseBanError(error)
    if (isBan) {
      // Refresh ban status so the composer disables itself.
      queryClient.invalidateQueries({ queryKey: moderationKeys.ban() })
      toast.error(suspensionNotice(expiresAt))
      return
    }
    toast.error(failureNotice(context))
  }

  return { isBanned, notice, handlePostError }
}
