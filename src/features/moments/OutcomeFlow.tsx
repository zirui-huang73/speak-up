import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { CheckIcon } from '../../app/icons'
import { inputCls, primaryBtn, secondaryBtn } from '../../app/ui'
import { braveNumber, MILESTONES, streak, weekCount, type Outcome } from '../../lib/moments'
import { situationLabel, type SituationId } from '../../lib/situations'
import { useMoments } from './momentsContext'
import { Choice, FlowShell, ScoreSlider, SituationPicker } from './parts'

const RESULTS: { id: 'pass' | 'fail'; label: string }[] = [
  { id: 'pass', label: 'Pass' },
  { id: 'fail', label: 'Fail' },
]

function OutcomeForm({ onSave, submitLabel }: { onSave: (o: Outcome) => void; submitLabel: string }) {
  const [spoke, setSpoke] = useState<boolean | null>(null)
  const [felt, setFelt] = useState(5)
  const [result, setResult] = useState<'pass' | 'fail' | undefined>()
  const [note, setNote] = useState('')

  return (
    <div className="flex flex-1 flex-col gap-6 pt-4">
      <div>
        <h1 className="mb-3 text-2xl font-bold">Did you speak?</h1>
        <Choice
          options={[
            { id: 'yes', label: 'Yes' },
            { id: 'no', label: 'Not this time' },
          ]}
          value={spoke === null ? undefined : spoke ? 'yes' : 'no'}
          onPick={(v) => setSpoke(v === 'yes')}
        />
      </div>

      {spoke && (
        <>
          <ScoreSlider label="How anxious did you actually feel?" value={felt} onChange={setFelt} />
          <div>
            <p className="mb-3 font-medium">How did it go?</p>
            <Choice options={RESULTS} value={result} onPick={setResult} />
            <p className="mt-2 text-sm text-stone-500">
              Fail only if a fluent listener would clearly have noticed a speech problem. Small slips are a Pass.
            </p>
          </div>
        </>
      )}

      {spoke !== null && (
        <>
          <textarea
            rows={2}
            className={inputCls}
            value={note}
            placeholder={spoke ? 'What did you say? (optional)' : 'What held you back? (optional)'}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            type="button"
            disabled={spoke && !result}
            onClick={() => onSave({ spoke, felt, result, note })}
            className={`${primaryBtn} mt-auto py-3.5`}
          >
            {submitLabel}
          </button>
        </>
      )}
    </div>
  )
}

function Feedback({ id }: { id: string }) {
  const { data } = useMoments()
  const [now] = useState(() => Date.now())
  const m = data.items.find((x) => x.id === id)
  if (!m) return <Navigate to="/" replace />

  if (m.status === 'skipped') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold">That's okay.</h1>
        <p className="max-w-sm text-stone-600 dark:text-stone-300">
          Noticing is the first step. Next time, try your opener within three seconds of the thought.
        </p>
        <Link to="/" className={`${primaryBtn} mt-4`}>
          Back to Today
        </Link>
      </div>
    )
  }

  const n = braveNumber(data, id)
  const s = streak(data, now)
  const lines: string[] = []
  if (m.expected !== undefined && m.felt !== undefined) {
    lines.push(`You expected ${m.expected}. It felt like ${m.felt}.`)
    lines.push(
      m.felt < m.expected
        ? 'Easier than you feared.'
        : m.felt === m.expected
          ? 'About what you expected, and you did it anyway.'
          : 'Harder than expected, and you still spoke up. That is real courage.',
    )
  }
  if ((m.stuck === 'likely' || m.stuck === 'maybe') && m.result === 'pass') lines.push('You thought you might get stuck. It was a Pass.')
  if (m.result === 'fail') lines.push('Even a Fail is a brave moment. You showed up.')

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="grid size-20 place-items-center rounded-full bg-orange-500 text-white">
        <CheckIcon className="size-10" />
      </div>
      <h1 className="text-3xl font-bold">Brave moment #{n}</h1>
      {MILESTONES.includes(n) && (
        <p className="rounded-full bg-amber-100 px-4 py-1 text-sm font-medium text-amber-900 dark:bg-amber-900 dark:text-amber-100">
          {n === 1 ? 'Your first one. This is how it starts.' : `Milestone: ${n} times you spoke up.`}
        </p>
      )}
      <div className="space-y-1 text-lg">
        {lines.map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>
      <p className="text-sm text-stone-500">
        {weekCount(data, now)} this week{s > 0 ? ` · ${s}-day streak` : ''}
      </p>
      <Link to="/" className={`${primaryBtn} mt-4`}>
        Back to Today
      </Link>
    </div>
  )
}

export function CompleteFlow() {
  const { id = '' } = useParams()
  const { data, complete, remove } = useMoments()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const m = data.items.find((x) => x.id === id)
  if (!m) return <Navigate to="/" replace />

  return (
    <FlowShell title={situationLabel(m.situation)}>
      {saved || m.status !== 'pending' ? (
        <Feedback id={id} />
      ) : (
        <>
          <OutcomeForm
            submitLabel="Save"
            onSave={(o) => {
              complete(id, o)
              setSaved(true)
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (!confirm('Discard this moment?')) return
              remove(id)
              navigate('/')
            }}
            className={`${secondaryBtn} mt-3 border-none text-sm text-stone-500`}
          >
            Discard
          </button>
        </>
      )}
    </FlowShell>
  )
}

export function LogFlow() {
  const { log } = useMoments()
  const [situation, setSituation] = useState<SituationId | undefined>()
  const [id, setId] = useState<string | null>(null)

  return (
    <FlowShell title="Log a moment">
      {id ? (
        <Feedback id={id} />
      ) : !situation ? (
        <div className="space-y-5 pt-4">
          <h1 className="text-2xl font-bold">What was it?</h1>
          <SituationPicker onPick={setSituation} />
        </div>
      ) : (
        <OutcomeForm submitLabel="Save" onSave={(o) => setId(log({ situation, ...o }))} />
      )}
    </FlowShell>
  )
}
