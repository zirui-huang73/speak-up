import { createContext, useContext } from 'react'
import type { Mission, MissionsData } from '../../lib/missions'

export interface MissionsContextValue {
  data: MissionsData
  refreshDaily: () => void
  shuffle: (id: string) => void
  changeLevel: (level: number) => void
  snooze: (attempts: number) => void
  saveMission: (level: number, mission: Mission) => void
  deleteMission: (id: string) => void
}

export const MissionsContext = createContext<MissionsContextValue | null>(null)

export function useMissions(): MissionsContextValue {
  const ctx = useContext(MissionsContext)
  if (!ctx) throw new Error('useMissions must be used inside MissionsProvider')
  return ctx
}
