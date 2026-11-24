import { useMemo, type ReactNode } from 'react'
import { usePersisted } from '../../app/usePersisted'
import { loadPlans, savePlans } from '../../lib/plans'
import { PlansContext, type PlansContextValue } from './plansContext'

export function PlansProvider({ children }: { children: ReactNode }) {
  const [data, mutate] = usePersisted(loadPlans, savePlans)

  const value = useMemo<PlansContextValue | null>(
    () =>
      data && {
        data,
        savePlan: (plan) =>
          mutate((d) => ({
            ...d,
            items: d.items.some((p) => p.id === plan.id)
              ? d.items.map((p) => (p.id === plan.id ? plan : p))
              : [...d.items, plan],
          })),
        deletePlan: (id) => mutate((d) => ({ ...d, items: d.items.filter((p) => p.id !== id) })),
        addPractice: (id) =>
          mutate((d) => ({ ...d, items: d.items.map((p) => (p.id === id ? { ...p, practiced: p.practiced + 1 } : p)) })),
        setSpeechPlan: (kind, text) => mutate((d) => ({ ...d, [kind === 'general' ? 'generalPlan' : 'pressurePlan']: text })),
        setPlanFor: (situation, kind) => mutate((d) => ({ ...d, planFor: { ...d.planFor, [situation]: kind } })),
      },
    [data, mutate],
  )

  if (!value) return null
  return <PlansContext.Provider value={value}>{children}</PlansContext.Provider>
}
