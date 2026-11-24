import { useMemo, type ReactNode } from 'react'
import { usePersisted } from '../../app/usePersisted'
import { ensureDaily, loadMissions, saveMissions, setLevel, shuffleMission } from '../../lib/missions'
import { MissionsContext, type MissionsContextValue } from './missionsContext'

export function MissionsProvider({ children }: { children: ReactNode }) {
  const [data, mutate] = usePersisted(loadMissions, saveMissions)

  const value = useMemo<MissionsContextValue | null>(
    () =>
      data && {
        data,
        refreshDaily: () => mutate((d) => ensureDaily(d, Date.now())),
        shuffle: (id) => mutate((d) => shuffleMission(d, id)),
        changeLevel: (level) => mutate((d) => ensureDaily(setLevel(d, level, Date.now()), Date.now())),
        snooze: (attempts) => mutate((d) => ({ ...d, snoozeUntil: attempts + 3 })),
        saveMission: (level, mission) =>
          mutate((d) => {
            const exists = d.levels.some((l) => l.some((x) => x.id === mission.id))
            return {
              ...d,
              levels: d.levels.map((l, i) =>
                exists ? l.map((x) => (x.id === mission.id ? mission : x)) : i === level - 1 ? [...l, mission] : l,
              ),
            }
          }),
        deleteMission: (id) =>
          mutate((d) => ensureDaily({ ...d, levels: d.levels.map((l) => l.filter((x) => x.id !== id)) }, Date.now())),
      },
    [data, mutate],
  )

  if (!value) return null
  return <MissionsContext.Provider value={value}>{children}</MissionsContext.Provider>
}
