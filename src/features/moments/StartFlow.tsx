import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { primaryBtn } from '../../app/ui'
import type { StuckGuess } from '../../lib/moments'
import { isSituation, situationLabel, type SituationId } from '../../lib/situations'
import { useMoments } from './momentsContext'
import { Choice, FlowShell, ScoreSlider, SituationPicker } from './parts'
import { ReadyScreen } from './ReadyScreen'

const STUCK: { id: StuckGuess; label: string }[] = [
  { id: 'likely', label: 'Likely' },
  { id: 'maybe', label: 'Maybe' },
  { id: 'unlikely', label: 'Unlikely' },
]

export function StartFlow() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { start } = useMoments()
  const preset = params.get('situation')
  const missionId = params.get('mission') ?? undefined
  const [situation, setSituation] = useState<SituationId | undefined>(isSituation(preset) ? preset : undefined)
  const [step, setStep] = useState<'situation' | 'predict' | 'ready'>(isSituation(preset) ? 'predict' : 'situation')
  const [expected, setExpected] = useState(5)
  const [stuck, setStuck] = useState<StuckGuess | undefined>()
  const [predicted, setPredicted] = useState(true)

  const go = () => {
    if (!situation) return
    start({ situation, missionId, ...(predicted ? { expected, stuck } : {}) })
    navigate('/')
  }

  return (
    <FlowShell title={situation ? situationLabel(situation) : "I'm about to speak"}>
      {step === 'situation' && (
        <div className="space-y-5 pt-4">
          <h1 className="text-2xl font-bold">What's coming up?</h1>
          <SituationPicker
            value={situation}
            onPick={(s) => {
              setSituation(s)
              setStep('predict')
            }}
          />
        </div>
      )}

      {step === 'predict' && (
        <div className="flex flex-1 flex-col gap-8 pt-4">
          <h1 className="text-2xl font-bold">Make a quick guess</h1>
          <ScoreSlider label="How anxious do you expect to feel?" value={expected} onChange={setExpected} />
          <div>
            <p className="mb-3 font-medium">Will you get stuck?</p>
            <Choice options={STUCK} value={stuck} onPick={setStuck} />
          </div>
          <p className="text-sm text-stone-500">Afterwards, you'll compare this guess with how it really felt.</p>
          <div className="mt-auto flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setPredicted(true)
                setStep('ready')
              }}
              className={`${primaryBtn} py-3.5`}
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => {
                setPredicted(false)
                setStep('ready')
              }}
              className="py-2 text-sm text-stone-500"
            >
              Skip the guess
            </button>
          </div>
        </div>
      )}

      {step === 'ready' && situation && <ReadyScreen situation={situation} onGo={go} />}
    </FlowShell>
  )
}
