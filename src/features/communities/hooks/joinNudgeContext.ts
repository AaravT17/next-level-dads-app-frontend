import { createContext, useContext } from 'react'
import type { InteractionKind } from '../lib/joinNudgePolicy'

export interface JoinNudgeContextValue {
  /**
   * Report a successful interaction with the surrounding community. Call it
   * from the `onSuccess` of a content or like mutation — never optimistically,
   * since a prompt that follows a failed post is worse than no prompt.
   */
  recordInteraction: (kind: InteractionKind) => void
  /** Membership is now real: forget everything the prompt had banked. */
  resolveJoined: () => void
}

const noop: JoinNudgeContextValue = {
  recordInteraction: () => {},
  resolveJoined: () => {},
}

const JoinNudgeContext = createContext<JoinNudgeContextValue>(noop)

export const JoinNudgeContextProvider = JoinNudgeContext.Provider

/**
 * Access the join prompt for the community currently on screen.
 *
 * Unlike `useAuth`, this does not throw outside its provider — it goes quiet.
 * The mutation hooks that report interactions are shared with screens that
 * have no community context at all (the cross-community feed, the resume
 * rail), and a nudge is a nicety: refusing to render those screens because
 * nobody is listening for it would be the wrong trade.
 */
export function useJoinNudge(): JoinNudgeContextValue {
  return useContext(JoinNudgeContext)
}
