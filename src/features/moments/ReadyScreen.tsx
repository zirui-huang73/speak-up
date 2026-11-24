import { useEffect, useState } from 'react'
import { useApp } from '../../app/appContext'
import { ChevronIcon, ChevronLeftIcon } from '../../app/icons'
import { Opener } from '../../app/Opener'
import { primaryBtn } from '../../app/ui'
import { randomCourageLine } from '../../lib/courage'
import { fillName, plansFor, speechPlanFor } from '../../lib/plans'
import type { SituationId } from '../../lib/situations'
import { keepAwake } from '../../lib/wakeLock'
import { usePlans } from '../plans/plansContext'

interface Beat {
  label: string
  ms: number
  scale?: number
}

const SIGH: Beat[] = [
  { label: 'Breathe in through your nose', ms: 2500, scale: 0.85 },
  { label: 'A little more', ms: 1000, scale: 1 },
  { label: 'Long, slow breath out', ms: 4000, scale: 0.45 },
]
const RELEASE: Beat[] = [
  { label: 'Feet: heavy and loose', ms: 2000 },
  { label: 'Shoulders: let them drop', ms: 2000 },
  { label: 'Hands: soft', ms: 2000 },
  { label: 'Jaw: slightly open', ms: 2000 },
  { label: 'Tongue: resting', ms: 2000 },
]
const TIMELINE = [...SIGH, ...SIGH, ...RELEASE]

export function ReadyScreen({ situation, onGo }: { situation: SituationId; onGo: () => void }) {
  const { settings } = useApp()
  const { data } = usePlans()
  const [beat, setBeat] = useState(0)
  const [openerIndex, setOpenerIndex] = useState(0)
  const [line] = useState(randomCourageLine)
  const prepared = beat >= TIMELINE.length
  const openers = plansFor(data, situation)
  const plan = speechPlanFor(data, situation)

  useEffect(() => keepAwake(), [])
  useEffect(() => {
    if (prepared) return
    const t = setTimeout(() => setBeat((b) => b + 1), TIMELINE[beat].ms)
    return () => clearTimeout(t)
  }, [beat, prepared])

  if (!prepared) {
    const b = TIMELINE[beat]
    const breathing = beat < SIGH.length * 2
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-10 text-center">
        {breathing ? (
          <div className="relative grid size-56 place-items-center">
            <div
              className="absolute inset-0 rounded-full bg-orange-400/25 ease-in-out"
              style={{ transform: `scale(${b.scale})`, transition: `transform ${b.ms}ms` }}
            />
            <p className="relative max-w-40 text-xl font-medium">{b.label}</p>
          </div>
        ) : (
          <ul className="space-y-3 text-lg">
            {RELEASE.map((r, i) => (
              <li
                key={r.label}
                className={`transition ${i === beat - SIGH.length * 2 ? 'scale-110 font-semibold text-orange-600 dark:text-orange-400' : 'text-stone-400'}`}
              >
                {r.label}
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={() => setBeat(TIMELINE.length)} className="text-sm font-medium text-stone-500">
          Skip to my opener
        </button>
      </div>
    )
  }

  const opener = openers[openerIndex]
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-1 flex-col justify-center rounded-3xl bg-white p-6 text-center shadow-sm dark:bg-stone-900">
        <p className="text-xs font-semibold tracking-wider text-orange-600 uppercase dark:text-orange-400">Your opener</p>
        {opener ? (
          <>
            <Opener text={fillName(opener.opener, settings.name)} className="mt-3 block text-3xl leading-snug font-semibold text-balance" />
            {opener.hint && <p className="mt-3 text-sm text-stone-500">{fillName(opener.hint, settings.name)}</p>}
            {openers.length > 1 && (
              <div className="mt-4 flex items-center justify-center gap-4 text-stone-400">
                <button type="button" aria-label="Previous opener" onClick={() => setOpenerIndex((i) => (i + openers.length - 1) % openers.length)}>
                  <ChevronLeftIcon />
                </button>
                <span className="text-xs">
                  {openerIndex + 1} / {openers.length}
                </span>
                <button type="button" aria-label="Next opener" onClick={() => setOpenerIndex((i) => (i + 1) % openers.length)}>
                  <ChevronIcon />
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="mt-3 text-xl font-medium">Say what comes to mind, within three seconds.</p>
        )}
      </div>
      <div className="rounded-3xl bg-orange-600 p-5 text-center text-white">
        <p className="text-xs font-semibold tracking-wider text-white/70 uppercase">{plan.kind} plan</p>
        <p className="mt-1 text-2xl font-bold">{plan.text}</p>
      </div>
      <p className="text-center text-lg text-stone-600 italic dark:text-stone-300">“{line}”</p>
      <button type="button" onClick={onGo} className={`${primaryBtn} py-4 text-lg`}>
        Go speak
      </button>
    </div>
  )
}
