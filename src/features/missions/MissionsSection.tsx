import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckIcon } from '../../app/icons'
import { primaryBtn, secondaryBtn } from '../../app/ui'
import {
  attemptsAtLevel,
  ATTEMPTS_TO_LEVEL_UP,
  doneToday,
  findMission,
  LEVEL_NAMES,
  missionLevel,
  pendingFor,
  suggestLevelUp,
} from '../../lib/missions'
import { situationLabel } from '../../lib/situations'
import { useMoments } from '../moments/momentsContext'
import { useMissions } from './missionsContext'

const ShuffleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
    <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
  </svg>
)

export function MissionsSection() {
  const { data, refreshDaily, shuffle, changeLevel, snooze } = useMissions()
  const { data: moments } = useMoments()
  const [now] = useState(() => Date.now())

  useEffect(() => {
    refreshDaily()
  }, [refreshDaily])

  const attempts = attemptsAtLevel(data, moments)
  const ids = data.daily?.ids ?? []

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Today's missions</h2>
        <Link to="/more/ladder" className="text-sm text-stone-500">
          Level {data.level} · {LEVEL_NAMES[data.level - 1]}
        </Link>
      </div>

      {data.level < data.levels.length && (
        <div className="h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
          <div
            className="h-full bg-orange-500 transition-all"
            style={{ width: `${Math.min(100, (attempts / ATTEMPTS_TO_LEVEL_UP) * 100)}%` }}
            title={`${attempts} of ${ATTEMPTS_TO_LEVEL_UP} attempts at this level`}
          />
        </div>
      )}

      {suggestLevelUp(data, moments) && (
        <div className="rounded-2xl bg-amber-50 p-4 dark:bg-amber-950">
          <p className="font-semibold">
            {attempts} brave attempts at level {data.level}. Ready for level {data.level + 1}?
          </p>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{LEVEL_NAMES[data.level]}: a little harder, one step at a time.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => changeLevel(data.level + 1)} className={`${primaryBtn} py-2 text-sm`}>
              Level up
            </button>
            <button type="button" onClick={() => snooze(attempts)} className={`${secondaryBtn} py-2 text-sm`}>
              Not yet
            </button>
          </div>
        </div>
      )}

      {ids.map((id) => {
        const mission = findMission(data, id)
        if (!mission) return null
        const done = doneToday(moments, id, now)
        const pending = pendingFor(moments, id)
        return (
          <div
            key={id}
            className={`flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm dark:bg-stone-900 ${
              done ? 'border-emerald-300 dark:border-emerald-800' : 'border-stone-200 dark:border-stone-800'
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className={`font-medium ${done ? 'text-stone-400 line-through' : ''}`}>{mission.text}</p>
              <p className="mt-0.5 text-xs text-stone-500">
                Level {missionLevel(data, id)} · {situationLabel(mission.situation)}
              </p>
            </div>
            {done ? (
              <span className="grid size-9 place-items-center rounded-full bg-emerald-500 text-white" aria-label="Done">
                <CheckIcon className="size-5" />
              </span>
            ) : pending ? (
              <Link to={`/moment/${pending.id}`} className="rounded-xl bg-orange-100 px-3 py-2 text-sm font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                Tell me
              </Link>
            ) : (
              <>
                <button type="button" aria-label="Shuffle" onClick={() => shuffle(id)} className="text-stone-400 hover:text-stone-700">
                  <ShuffleIcon />
                </button>
                <Link to={`/moment?situation=${mission.situation}&mission=${id}`} className={`${primaryBtn} py-2 text-sm`}>
                  Start
                </Link>
              </>
            )}
          </div>
        )
      })}
    </section>
  )
}
