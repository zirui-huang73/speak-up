import { createContext, useContext } from 'react'
import type { MomentsData, Outcome, StartInput } from '../../lib/moments'
import type { SituationId } from '../../lib/situations'

export interface MomentsContextValue {
  data: MomentsData
  start: (input: StartInput) => string
  complete: (id: string, outcome: Outcome) => void
  log: (input: { situation: SituationId; missionId?: string } & Outcome) => string
  update: (id: string, outcome: Outcome) => void
  remove: (id: string) => void
}

export const MomentsContext = createContext<MomentsContextValue | null>(null)

export function useMoments(): MomentsContextValue {
  const ctx = useContext(MomentsContext)
  if (!ctx) throw new Error('useMoments must be used inside MomentsProvider')
  return ctx
}
