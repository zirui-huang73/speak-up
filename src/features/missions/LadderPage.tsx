import { useState } from 'react'
import { PencilIcon, PlusIcon, TrashIcon } from '../../app/icons'
import { BackLink, Card, inputCls, PageHeader, primaryBtn, secondaryBtn } from '../../app/ui'
import { LEVEL_NAMES, newMissionId, type Mission } from '../../lib/missions'
import { SITUATIONS, situationLabel, type SituationId } from '../../lib/situations'
import { useMissions } from './missionsContext'

function MissionForm({ initial, onSave, onCancel }: { initial: Mission; onSave: (m: Mission) => void; onCancel: () => void }) {
  const [m, setM] = useState(initial)
  return (
    <form
      className="space-y-2 rounded-xl border border-orange-400 p-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (m.text.trim()) onSave({ ...m, text: m.text.trim() })
      }}
    >
      <input aria-label="Mission" autoFocus className={inputCls} value={m.text} placeholder="Describe the mission" onChange={(e) => setM({ ...m, text: e.target.value })} />
      <select aria-label="Situation" className={inputCls} value={m.situation} onChange={(e) => setM({ ...m, situation: e.target.value as SituationId })}>
        {SITUATIONS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={`${secondaryBtn} py-1.5 text-sm`}>
          Cancel
        </button>
        <button type="submit" disabled={!m.text.trim()} className={`${primaryBtn} py-1.5 text-sm`}>
          Save
        </button>
      </div>
    </form>
  )
}

export function LadderPage() {
  const { data, changeLevel, saveMission, deleteMission } = useMissions()
  const [editing, setEditing] = useState<{ level: number; mission: Mission } | null>(null)
  const save = (level: number, mission: Mission) => {
    saveMission(level, mission)
    setEditing(null)
  }

  return (
    <>
      <BackLink to="/more" label="More" />
      <PageHeader title="Your ladder" subtitle="Five levels, easiest at the bottom. Make the missions fit your real life." />

      <Card className="mb-4">
        <p className="mb-2 text-sm font-medium text-stone-600 dark:text-stone-300">Current level</p>
        <div className="grid grid-cols-5 gap-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-800">
          {LEVEL_NAMES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => i + 1 !== data.level && confirm(`Switch to level ${i + 1}? Today's missions will change.`) && changeLevel(i + 1)}
              className={`rounded-lg py-2 text-sm font-semibold ${data.level === i + 1 ? 'bg-orange-600 text-white' : 'text-stone-500'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-stone-500">Stepping down on a hard week is completely fine.</p>
      </Card>

      <div className="space-y-4">
        {data.levels.map((missions, i) => {
          const level = i + 1
          return (
            <Card key={level}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold">
                  Level {level} · {LEVEL_NAMES[i]}
                </h2>
                <button
                  type="button"
                  aria-label={`Add mission to level ${level}`}
                  onClick={() => setEditing({ level, mission: { id: newMissionId(), text: '', situation: 'chat' } })}
                  className="text-orange-700 dark:text-orange-400"
                >
                  <PlusIcon className="size-5" />
                </button>
              </div>
              <ul className="space-y-2">
                {missions.map((m) =>
                  editing?.mission.id === m.id ? (
                    <li key={m.id}>
                      <MissionForm initial={m} onCancel={() => setEditing(null)} onSave={(x) => save(level, x)} />
                    </li>
                  ) : (
                    <li key={m.id} className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p>{m.text}</p>
                        <p className="text-xs text-stone-500">{situationLabel(m.situation)}</p>
                      </div>
                      <button type="button" aria-label="Edit" onClick={() => setEditing({ level, mission: m })} className="text-stone-400">
                        <PencilIcon className="size-5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete"
                        disabled={missions.length <= 1}
                        onClick={() => confirm('Delete this mission?') && deleteMission(m.id)}
                        className="text-stone-400 disabled:opacity-30"
                      >
                        <TrashIcon className="size-5" />
                      </button>
                    </li>
                  ),
                )}
                {editing?.level === level && !missions.some((m) => m.id === editing.mission.id) && (
                  <li>
                    <MissionForm
                      initial={editing.mission}
                      onCancel={() => setEditing(null)}
                      onSave={(x) => save(level, x)}
                    />
                  </li>
                )}
              </ul>
            </Card>
          )
        })}
      </div>
    </>
  )
}
