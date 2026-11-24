import { createContext, useContext } from 'react'
import type { IfThenPlan, PlanKind, PlansData } from '../../lib/plans'
import type { SituationId } from '../../lib/situations'

export interface PlansContextValue {
  data: PlansData
  savePlan: (plan: IfThenPlan) => void
  deletePlan: (id: string) => void
  addPractice: (id: string) => void
  setSpeechPlan: (kind: PlanKind, text: string) => void
  setPlanFor: (situation: SituationId, kind: PlanKind) => void
}

export const PlansContext = createContext<PlansContextValue | null>(null)

export function usePlans(): PlansContextValue {
  const ctx = useContext(PlansContext)
  if (!ctx) throw new Error('usePlans must be used inside PlansProvider')
  return ctx
}
