import { useState } from 'react'
import { PencilIcon, TrashIcon } from '../app/icons'
import { Card, inputCls, PageHeader, primaryBtn, secondaryBtn } from '../app/ui'
import { findMission } from '../lib/missions'
import { spokenMoments, streak, weekCount, type Moment } from '../lib/moments'
import { situationLabel } from '../lib/situations'
import { bySituation, history, nextMilestone, predictionStats, speakUpRate, weeklyTrend } from '../lib/stats'
import { useMissions } from './missions/missionsContext'
import { useMoments } from './moments/momentsContext'
import { Choice, ScoreSlider } from './moments/parts'

const pct = (x: number) => `${Math.round(x * 100)}%`
const one = (x: number) => x.toFixed(1)

function Tile({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center shadow-sm dark:bg-stone-900">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  )
}

function PairsChart({ points }: { points: { id: string; expected: number; felt: number }[] }) {
  const w = 320
  const h = 140
  const pad = 14
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0
  const y = (v: number) => h - pad - (v / 10) * (h - pad * 2)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 w-full" role="img" aria-label="Expected and felt anxiety, recent moments">
      {[0, 5, 10].map((v) => (
        <g key={v}>
          <line x1={pad} x2={w - pad} y1={y(v)} y2={y(v)} className="stroke-stone-200 dark:stroke-stone-800" />
          <text x={2} y={y(v) + 3} className="fill-stone-400 text-[9px]">
            {v}
          </text>
        </g>
      ))}
      {points.map((p, i) => {
        const x = pad + (points.length > 1 ? i * step : (w - pad * 2) / 2)
        return (
          <g key={p.id}>
            <line x1={x} x2={x} y1={y(p.expected)} y2={y(p.felt)} className="stroke-orange-300" strokeWidth={2} />
            <circle cx={x} cy={y(p.expected)} r={4} className="fill-white stroke-orange-500 dark:fill-stone-900" strokeWidth={2} />
            <circle cx={x} cy={y(p.felt)} r={4} className="fill-orange-600" />
          </g>
        )
      })}
    </svg>
  )
}

function WeeklyBars({ weeks }: { weeks: { start: string; spoke: number; skipped: number }[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.spoke + w.skipped))
  return (
    <div className="mt-4 flex h-32 items-end gap-2">
      {weeks.map((w) => {
        const [, m, d] = w.start.split('-')
        return (
          <div key={w.start} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 flex-col justify-end overflow-hidden rounded-md">
              <div className="bg-stone-300 dark:bg-stone-700" style={{ height: `${(w.skipped / max) * 100}%` }} />
              <div className="bg-orange-500" style={{ height: `${(w.spoke / max) * 100}%` }} title={`${w.spoke} spoke, ${w.skipped} not this time`} />
            </div>
            <span className="text-[10px] text-stone-500">
              {Number(d)}/{Number(m)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function HistoryItem({ m }: { m: Moment }) {
  const { update, remove } = useMoments()
  const { data: missions } = useMissions()
  const [editing, setEditing] = useState(false)
  const [spoke, setSpoke] = useState(m.status === 'spoke')
  const [felt, setFelt] = useState(m.felt ?? 5)
  const [result, setResult] = useState(m.result)
  const [note, setNote] = useState(m.note)
  const when = new Date(m.completedAt ?? m.createdAt)
  const mission = m.missionId ? findMission(missions, m.missionId) : undefined

  if (editing) {
    return (
      <li className="space-y-4 rounded-2xl border border-orange-400 bg-white p-4 dark:bg-stone-900">
        <Choice
          options={[
            { id: 'yes', label: 'Spoke' },
            { id: 'no', label: 'Not this time' },
          ]}
          value={spoke ? 'yes' : 'no'}
          onPick={(v) => setSpoke(v === 'yes')}
        />
        {spoke && (
          <>
            <ScoreSlider label="Felt anxiety" value={felt} onChange={setFelt} />
            <Choice
              options={[
                { id: 'pass' as const, label: 'Pass' },
                { id: 'fail' as const, label: 'Fail' },
              ]}
              value={result}
              onPick={setResult}
            />
          </>
        )}
        <textarea rows={2} className={inputCls} value={note} placeholder="Note" onChange={(e) => setNote(e.target.value)} />
        <div className="flex justify-end gap-2">
          <button type="button" className={`${secondaryBtn} py-1.5 text-sm`} onClick={() => setEditing(false)}>
            Cancel
          </button>
          <button
            type="button"
            disabled={spoke && !result}
            className={`${primaryBtn} py-1.5 text-sm`}
            onClick={() => {
              update(m.id, { spoke, felt, result, note })
              setEditing(false)
            }}
          >
            Save
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-stone-500">
            {when.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
            {when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </p>
          <p className="font-medium">{mission?.text ?? situationLabel(m.situation)}</p>
          <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-300">
            {m.status === 'skipped' ? (
              'Not this time'
            ) : (
              <>
                <span className={m.result === 'pass' ? 'text-emerald-600' : 'text-rose-600'}>{m.result === 'pass' ? 'Pass' : 'Fail'}</span>
                {m.expected !== undefined && m.felt !== undefined
                  ? ` · expected ${m.expected} → felt ${m.felt}`
                  : m.felt !== undefined
                    ? ` · felt ${m.felt}`
                    : ''}
              </>
            )}
          </p>
          {m.note && <p className="mt-1 text-sm text-stone-500 italic">“{m.note}”</p>}
        </div>
        <button type="button" aria-label="Edit" onClick={() => setEditing(true)} className="text-stone-400">
          <PencilIcon className="size-5" />
        </button>
        <button type="button" aria-label="Delete" onClick={() => confirm('Delete this moment?') && remove(m.id)} className="text-stone-400">
          <TrashIcon className="size-5" />
        </button>
      </div>
    </li>
  )
}

export function ProgressPage() {
  const { data } = useMoments()
  const [now] = useState(() => Date.now())
  const [showAll, setShowAll] = useState(false)
  const total = spokenMoments(data).length
  const rate = speakUpRate(data)
  const milestone = nextMilestone(total)
  const pred = predictionStats(data)
  const situations = bySituation(data)
  const items = history(data)

  return (
    <>
      <PageHeader title="Progress" subtitle="Your own proof that it gets easier." />
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile value={weekCount(data, now)} label="this week" />
          <Tile value={total} label="brave moments" />
          <Tile value={streak(data, now)} label="day streak" />
          <Tile value={rate === null ? '–' : pct(rate)} label="spoke up" />
        </div>

        {milestone && (
          <Card className="p-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Next milestone: {milestone.next}</span>
              <span className="text-stone-500">
                {total} / {milestone.next}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
              <div
                className="h-full bg-orange-500"
                style={{ width: `${((total - milestone.previous) / (milestone.next - milestone.previous)) * 100}%` }}
              />
            </div>
          </Card>
        )}

        <Card>
          <h2 className="font-semibold">Expected vs felt</h2>
          {pred ? (
            <>
              <p className="mt-2 text-3xl font-bold">
                {one(pred.avgExpected)} <span className="text-stone-400">→</span>{' '}
                <span className="text-orange-600 dark:text-orange-400">{one(pred.avgFelt)}</span>
              </p>
              <p className="text-sm text-stone-500">Average anxiety you expected → what you actually felt ({pred.count} moments)</p>
              <ul className="mt-3 space-y-1 text-sm">
                <li>It felt easier than expected {pct(pred.easierShare)} of the time.</li>
                {pred.stuckPassShare !== null && (
                  <li>
                    When you expected to get stuck, <b>{pct(pred.stuckPassShare)}</b> were a Pass.
                  </li>
                )}
              </ul>
              <PairsChart points={pred.recent} />
              <p className="mt-1 flex gap-4 text-xs text-stone-500">
                <span>○ expected</span>
                <span className="text-orange-600">● felt</span>
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-stone-500">
              Make a quick guess before you speak. After a few moments, you'll see how your fears compare with reality.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold">Last 8 weeks</h2>
          <WeeklyBars weeks={weeklyTrend(data, now)} />
          <p className="mt-2 flex gap-4 text-xs text-stone-500">
            <span className="text-orange-600">■ spoke</span>
            <span>■ not this time</span>
          </p>
        </Card>

        {situations.length > 0 && (
          <Card>
            <h2 className="mb-2 font-semibold">By situation</h2>
            <ul className="divide-y divide-stone-100 text-sm dark:divide-stone-800">
              {situations.map((s) => (
                <li key={s.situation} className="flex items-center justify-between gap-3 py-2">
                  <span>{situationLabel(s.situation)}</span>
                  <span className="text-right text-stone-500">
                    {s.count}×{s.avgFelt !== null && ` · felt ${one(s.avgFelt)}`}
                    {s.trend && s.trend.late < s.trend.early && (
                      <span className="ml-2 font-medium text-emerald-600">
                        easier ({one(s.trend.early)} → {one(s.trend.late)})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <section>
          <h2 className="mt-2 mb-2 font-semibold">History</h2>
          {items.length ? (
            <>
              <ul className="space-y-2">
                {(showAll ? items : items.slice(0, 20)).map((m) => (
                  <HistoryItem key={m.id} m={m} />
                ))}
              </ul>
              {items.length > 20 && !showAll && (
                <button type="button" onClick={() => setShowAll(true)} className={`${secondaryBtn} mt-3 w-full`}>
                  Show all {items.length}
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-stone-500">Your brave moments will appear here.</p>
          )}
        </section>
      </div>
    </>
  )
}
