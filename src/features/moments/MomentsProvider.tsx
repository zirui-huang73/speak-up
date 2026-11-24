import { useMemo, type ReactNode } from 'react'
import { usePersisted } from '../../app/usePersisted'
import {
  completeMoment,
  deleteMoment,
  loadMoments,
  logMoment,
  newMomentId,
  saveMoments,
  startMoment,
  updateOutcome,
} from '../../lib/moments'
import { MomentsContext, type MomentsContextValue } from './momentsContext'

export function MomentsProvider({ children }: { children: ReactNode }) {
  const [data, mutate] = usePersisted(loadMoments, saveMoments)

  const value = useMemo<MomentsContextValue | null>(
    () =>
      data && {
        data,
        start: (input) => {
          const now = Date.now()
          const id = newMomentId(now)
          mutate((d) => startMoment(d, input, now, id).data)
          return id
        },
        complete: (id, outcome) => mutate((d) => completeMoment(d, id, outcome, Date.now())),
        log: (input) => {
          const now = Date.now()
          const id = newMomentId(now)
          mutate((d) => logMoment(d, input, now, id).data)
          return id
        },
        update: (id, outcome) => mutate((d) => updateOutcome(d, id, outcome)),
        remove: (id) => mutate((d) => deleteMoment(d, id)),
      },
    [data, mutate],
  )

  if (!value) return null
  return <MomentsContext.Provider value={value}>{children}</MomentsContext.Provider>
}
