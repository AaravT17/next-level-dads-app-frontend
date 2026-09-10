import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { Community } from '@/types/communities'
import { useCommunity } from '../hooks/useCommunity'
import { useJoinCommunity } from '../hooks/useCommunityMembership'
import {
  JoinNudgeContextProvider,
  type JoinNudgeContextValue,
} from '../hooks/joinNudgeContext'
import {
  addInteraction,
  afterDismiss,
  emptyRecord,
  shouldPrompt,
  type InteractionKind,
} from '../lib/joinNudgePolicy'
import { readStore, updateStore } from '../lib/joinNudgeStorage'
import { JoinCommunityNudge } from './JoinCommunityNudge'

type Props = {
  /** The community every interaction inside `children` belongs to. */
  communityId: string | undefined
  children: ReactNode
}

/**
 * Watches what someone does inside one community and, once they have clearly
 * adopted it, asks whether they would like to join.
 *
 * A provider rather than a prop because the interactions worth counting happen
 * several levels down — a like on a reply to a reply — and threading the
 * community id through every one of those components to serve a prompt would
 * be the tail wagging the dog. Mutation hooks report upward through
 * `useJoinNudge` instead, and only this component knows a prompt exists.
 *
 * All of the "should it ask?" reasoning lives in `joinNudgePolicy`; this is
 * the wiring around it.
 */
export function JoinNudgeProvider({ communityId, children }: Props) {
  const { user } = useAuth()
  const userId = user?.id
  const { data: community } = useCommunity(communityId)
  const [open, setOpen] = useState(false)

  /**
   * Whether the prompt currently on screen was raised by us. It decides
   * whether resolving should start the app-wide cooldown: joining from the
   * community header, with no prompt in sight, must not silence a prompt some
   * other community has legitimately earned.
   */
  const promptedRef = useRef(false)

  // Nothing to ask a member, someone signed out, or a community still loading.
  const isTrackable =
    Boolean(userId) && Boolean(communityId) && community?.is_member === false

  const showPrompt = useCallback(() => {
    promptedRef.current = true
    setOpen(true)
  }, [])

  const recordInteraction = useCallback(
    (kind: InteractionKind) => {
      if (!isTrackable || !userId || !communityId) return

      const now = Date.now()
      let due = false
      updateStore(userId, (store) => {
        const record = addInteraction(
          store.communities[communityId] ?? emptyRecord(),
          kind,
          now,
        )
        due = shouldPrompt({
          record,
          lastPromptAt: store.lastPromptAt,
          now,
          trigger: 'interaction',
        })
        // Points survive being shown and are only spent when the prompt is
        // answered. Starting a conversation navigates straight to the new
        // post, so the prompt it earns has to outlive this screen to be seen
        // at all — see CARRY_OVER_MS.
        return {
          ...store,
          communities: { ...store.communities, [communityId]: record },
        }
      })

      if (due) showPrompt()
    },
    [isTrackable, userId, communityId, showPrompt],
  )

  const resolve = useCallback(
    (outcome: 'joined' | 'dismissed') => {
      const wasPrompted = promptedRef.current
      promptedRef.current = false
      setOpen(false)

      if (!userId || !communityId) return
      const now = Date.now()
      updateStore(userId, (store) => {
        const others = Object.fromEntries(
          Object.entries(store.communities).filter(([id]) => id !== communityId),
        )
        return {
          lastPromptAt: wasPrompted ? now : store.lastPromptAt,
          communities:
            outcome === 'joined'
              ? others
              : {
                  ...others,
                  [communityId]: afterDismiss(
                    store.communities[communityId] ?? emptyRecord(),
                    now,
                  ),
                },
        }
      })
    },
    [userId, communityId],
  )

  const resolveJoined = useCallback(() => resolve('joined'), [resolve])
  const resolveDismissed = useCallback(() => resolve('dismissed'), [resolve])

  // A prompt raised on the previous screen is re-raised here if it is still
  // the same moment — the post-then-navigate case. Anything older is a fresh
  // visit, and a modal on arrival is not what was asked for.
  useEffect(() => {
    if (!isTrackable || !userId || !communityId) return
    const store = readStore(userId)
    const due = shouldPrompt({
      record: store.communities[communityId],
      lastPromptAt: store.lastPromptAt,
      now: Date.now(),
      trigger: 'mount',
    })
    if (due) showPrompt()
  }, [isTrackable, userId, communityId, showPrompt])

  const value = useMemo<JoinNudgeContextValue>(
    () => ({ recordInteraction, resolveJoined }),
    [recordInteraction, resolveJoined],
  )

  return (
    <JoinNudgeContextProvider value={value}>
      {children}
      {isTrackable && community && (
        <NudgeHost
          community={community}
          open={open}
          onDismiss={resolveDismissed}
        />
      )}
    </JoinNudgeContextProvider>
  )
}

/**
 * Rendered inside the provider so its join mutation reports back through the
 * context above, the same way every other interaction does.
 */
function NudgeHost({
  community,
  open,
  onDismiss,
}: {
  community: Community
  open: boolean
  onDismiss: () => void
}) {
  const join = useJoinCommunity(community.id)

  return (
    <JoinCommunityNudge
      communityName={community.name}
      memberCount={community.member_count}
      open={open}
      isJoining={join.isPending}
      onJoin={() => join.mutate()}
      onDismiss={onDismiss}
    />
  )
}
