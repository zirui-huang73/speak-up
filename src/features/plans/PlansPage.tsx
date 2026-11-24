import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../app/appContext'
import { PencilIcon, PlusIcon, TrashIcon, XIcon } from '../../app/icons'
import { Opener } from '../../app/Opener'
import { Card, inputCls, PageHeader, primaryBtn, secondaryBtn } from '../../app/ui'
import {
  fillName,
  GENERAL_EXAMPLES,
  newPlanId,
  PRESSURE_EXAMPLES,
  type IfThenPlan,
  type PlanKind,
} from '../../lib/plans'
import { SITUATIONS, situationLabel, type SituationId } from '../../lib/situations'
import { keepAwake } from '../../lib/wakeLock'
import { usePlans } from './plansContext'

const PRACTICE_TIMES = 3
const iconBtn =
  'grid size-9 place-items-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800'

function PlanForm({ initial, onDone }: { initial: IfThenPlan; onDone: () => void }) {
  const { savePlan } = usePlans()
  const [p, setP] = useState(initial)
  const set = (patch: Partial<IfThenPlan>) => setP({ ...p, ...patch })

  return (
    <form
      className="space-y-3 rounded-2xl border border-orange-400 bg-white p-4 dark:bg-stone-900"
      onSubmit={(e) => {
        e.preventDefault()
        if (!p.opener.trim()) return
        savePlan({ ...p, when: p.when.trim(), opener: p.opener.trim(), hint: p.hint.trim() })
        onDone()
      }}
    >
      <label className="block text-sm font-medium text-stone-600 dark:text-stone-300">
        Situation
        <select className={inputCls} value={p.situation} onChange={(e) => set({ situation: e.target.value as SituationId })}>
          {SITUATIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-stone-600 dark:text-stone-300">
        If…
        <input className={inputCls} value={p.when} placeholder="it goes quiet" onChange={(e) => set({ when: e.target.value })} />
      </label>
      <label className="block text-sm font-medium text-stone-600 dark:text-stone-300">
        I will say…
        <textarea
          rows={2}
          className={inputCls}
          value={p.opener}
          placeholder="So | how was your weekend?"
          onChange={(e) => set({ opener: e.target.value })}
        />
        <span className="mt-1 block text-xs font-normal text-stone-500">
          Use | for a one-second stop and || for two. Use {'{name}'} for your name.
        </span>
      </label>
      <label className="block text-sm font-medium text-stone-600 dark:text-stone-300">
        Tip (optional)
        <input className={inputCls} value={p.hint} placeholder="Glide in with So‿…" onChange={(e) => set({ hint: e.target.value })} />
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className={secondaryBtn}>
          Cancel
        </button>
        <button type="submit" disabled={!p.opener.trim()} className={primaryBtn}>
          Save
        </button>
      </div>
    </form>
  )
}

function Practice({ plan, onClose }: { plan: IfThenPlan; onClose: () => void }) {
  const { settings } = useApp()
  const { addPractice } = usePlans()
  const [count, setCount] = useState(0)
  const done = count >= PRACTICE_TIMES
  useEffect(() => keepAwake(), [])

  const tap = () => {
    if (done) return
    const next = count + 1
    setCount(next)
    if ('vibrate' in navigator) navigator.vibrate(next >= PRACTICE_TIMES ? 40 : 10)
    if (next >= PRACTICE_TIMES) addPractice(plan.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-100 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] dark:bg-stone-950">
      <div className="flex items-center justify-between p-4">
        <p className="text-sm text-stone-500">If {plan.when || situationLabel(plan.situation).toLowerCase()}…</p>
        <button type="button" aria-label="Close" onClick={onClose} className="text-stone-500">
          <XIcon />
        </button>
      </div>
      <div
        role="button"
        tabIndex={-1}
        onClick={tap}
        className="mx-4 mb-4 flex flex-1 cursor-pointer flex-col items-center justify-center rounded-3xl bg-white p-8 text-center shadow-sm select-none dark:bg-stone-900"
      >
        <Opener text={fillName(plan.opener, settings.name)} className="text-3xl leading-snug font-semibold text-balance md:text-4xl" />
        {plan.hint && <p className="mt-6 text-stone-500">{fillName(plan.hint, settings.name)}</p>}
        <div className="mt-10 flex gap-3">
          {Array.from({ length: PRACTICE_TIMES }, (_, i) => (
            <span key={i} className={`size-4 rounded-full ${i < count ? 'bg-orange-500' : 'bg-stone-200 dark:bg-stone-700'}`} />
          ))}
        </div>
        <p className="mt-4 text-sm text-stone-400">{done ? 'Ready. It will come out on its own.' : 'Say it out loud, then tap'}</p>
      </div>
      {done && (
        <div className="flex justify-center gap-3 pb-6">
          <button type="button" onClick={() => setCount(0)} className={secondaryBtn}>
            Again
          </button>
          <button type="button" onClick={onClose} className={primaryBtn}>
            Done
          </button>
        </div>
      )}
    </div>
  )
}

function FullPlan({ start, onClose }: { start: PlanKind; onClose: () => void }) {
  const { data } = usePlans()
  const [kind, setKind] = useState(start)
  useEffect(() => keepAwake(), [])
  const text = (kind === 'general' ? data.generalPlan : data.pressurePlan).trim() ||
    (kind === 'general' ? GENERAL_EXAMPLES[0] : PRESSURE_EXAMPLES[0])

  return (
    <div
      role="button"
      tabIndex={-1}
      onClick={() => setKind(kind === 'general' ? 'pressure' : 'general')}
      className={`fixed inset-0 z-50 flex cursor-pointer flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-white select-none ${
        kind === 'general' ? 'bg-amber-500' : 'bg-orange-700'
      }`}
    >
      <div className="flex justify-end p-4">
        <button
          type="button"
          aria-label="Close"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="text-white/70"
        >
          <XIcon className="size-7" />
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
        <p className="text-sm font-semibold tracking-widest text-white/70 uppercase">{kind} plan</p>
        <p className="text-5xl leading-tight font-bold md:text-7xl">
          {text.split(/\s*[–-]\s*/).map((part, i) => (
            <span key={i} className="block">
              {part}
            </span>
          ))}
        </p>
      </div>
      <p className="pb-6 text-center text-sm text-white/60">Tap to switch plans</p>
    </div>
  )
}

function SpeechPlanSection() {
  const { data, setSpeechPlan, setPlanFor } = usePlans()
  const [showing, setShowing] = useState<PlanKind | null>(null)
  const kinds: { kind: PlanKind; title: string; when: string; examples: string[] }[] = [
    { kind: 'general', title: 'General plan', when: 'Little or no pressure.', examples: GENERAL_EXAMPLES },
    { kind: 'pressure', title: 'Pressure plan', when: 'Meetings, your boss, strangers, silences.', examples: PRESSURE_EXAMPLES },
  ]

  return (
    <section className="space-y-3">
      <h2 className="mt-8 text-lg font-semibold">Speech Plan</h2>
      <p className="text-sm text-stone-500">What you think about while you speak. It fills the mind and leaves no room for fear.</p>
      {kinds.map(({ kind, title, when, examples }) => {
        const value = kind === 'general' ? data.generalPlan : data.pressurePlan
        return (
          <Card key={kind} className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-stone-500">{when}</p>
              </div>
              <button type="button" onClick={() => setShowing(kind)} className="text-sm font-medium text-orange-700 dark:text-orange-400">
                Show card
              </button>
            </div>
            <input
              aria-label={title}
              className={`${inputCls} text-lg font-medium`}
              value={value}
              placeholder={examples[0]}
              onChange={(e) => setSpeechPlan(kind, e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setSpeechPlan(kind, ex)}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    value === ex
                      ? 'border-orange-600 bg-orange-600 text-white'
                      : 'border-stone-300 text-stone-600 dark:border-stone-700 dark:text-stone-300'
                  }`}
                >
                  {ex}
                </button>
              ))}
            </div>
          </Card>
        )
      })}

      <Card>
        <h3 className="font-semibold">Which plan before speaking?</h3>
        <p className="mb-3 text-sm text-stone-500">Shown in the 30 seconds before you speak.</p>
        <ul className="divide-y divide-stone-100 dark:divide-stone-800">
          {SITUATIONS.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-2">
              <span className="text-sm">{s.label}</span>
              <div className="flex gap-1 rounded-lg bg-stone-100 p-0.5 text-xs dark:bg-stone-800">
                {(['general', 'pressure'] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setPlanFor(s.id, k)}
                    className={`rounded-md px-2.5 py-1 font-medium capitalize ${
                      data.planFor[s.id] === k ? 'bg-white shadow-sm dark:bg-stone-700' : 'text-stone-500'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {showing && <FullPlan start={showing} onClose={() => setShowing(null)} />}
    </section>
  )
}

export function PlansPage() {
  const { settings } = useApp()
  const { data, deletePlan } = usePlans()
  const [editing, setEditing] = useState<IfThenPlan | null>(null)
  const [practicing, setPracticing] = useState<IfThenPlan | null>(null)
  const order = (s: SituationId) => SITUATIONS.findIndex((x) => x.id === s)
  const items = [...data.items].sort((a, b) => order(a.situation) - order(b.situation))
  const usesName = data.items.some((p) => p.opener.includes('{name}'))

  return (
    <>
      <PageHeader title="Plans" subtitle="Decide in advance. Then your mind is free when it counts." />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">If–then plans</h2>
        <button
          type="button"
          onClick={() => setEditing({ id: newPlanId(), situation: 'meeting', when: '', opener: '', hint: '', practiced: 0 })}
          className="flex items-center gap-1 text-sm font-medium text-orange-700 dark:text-orange-400"
        >
          <PlusIcon className="size-4" /> New plan
        </button>
      </div>
      {usesName && !settings.name.trim() && (
        <p className="mt-2 text-sm text-stone-500">
          Add your name in{' '}
          <Link to="/more/settings" className="underline">
            Settings
          </Link>{' '}
          to fill it into your openers.
        </p>
      )}

      <div className="mt-3 space-y-3">
        {editing && !data.items.some((p) => p.id === editing.id) && (
          <PlanForm initial={editing} onDone={() => setEditing(null)} />
        )}
        {items.map((p) =>
          editing?.id === p.id ? (
            <PlanForm key={p.id} initial={editing} onDone={() => setEditing(null)} />
          ) : (
            <Card key={p.id} className="p-4">
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                  {situationLabel(p.situation)}
                </span>
                <span className="truncate">If {p.when || '…'}</span>
              </div>
              <Opener text={fillName(p.opener, settings.name)} className="mt-2 block text-lg font-medium" />
              {p.hint && <p className="mt-1 text-sm text-stone-500">{fillName(p.hint, settings.name)}</p>}
              <div className="mt-3 flex items-center gap-1">
                <span className="mr-auto text-xs text-stone-400">{p.practiced ? `Practiced ${p.practiced}×` : 'Not practiced yet'}</span>
                <button type="button" aria-label="Edit" className={iconBtn} onClick={() => setEditing(p)}>
                  <PencilIcon className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label="Delete"
                  className={iconBtn}
                  onClick={() => confirm('Delete this plan?') && deletePlan(p.id)}
                >
                  <TrashIcon className="size-5" />
                </button>
                <button type="button" onClick={() => setPracticing(p)} className={`ml-1 ${primaryBtn} py-1.5 text-sm`}>
                  Practice
                </button>
              </div>
            </Card>
          ),
        )}
        {!items.length && !editing && <p className="py-6 text-center text-stone-500">No plans yet. Add one above.</p>}
      </div>

      <SpeechPlanSection />

      {practicing && <Practice plan={practicing} onClose={() => setPracticing(null)} />}
    </>
  )
}
