import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { XIcon } from '../../app/icons'
import { SITUATIONS, type SituationId } from '../../lib/situations'

export function FlowShell({
  title,
  children,
  confirmClose,
}: {
  title: string
  children: ReactNode
  confirmClose?: string
}) {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-dvh flex-col bg-stone-100 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] dark:bg-stone-950">
      <header className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          aria-label="Close"
          className="text-stone-500"
          onClick={() => (!confirmClose || confirm(confirmClose)) && navigate('/')}
        >
          <XIcon />
        </button>
        <p className="text-sm font-medium">{title}</p>
      </header>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-6">{children}</div>
    </div>
  )
}

export function SituationPicker({ value, onPick }: { value?: SituationId; onPick: (s: SituationId) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SITUATIONS.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onPick(s.id)}
          className={`rounded-2xl border-2 bg-white p-4 text-left font-medium dark:bg-stone-900 ${
            value === s.id ? 'border-orange-500' : 'border-transparent shadow-sm'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}

export function ScoreSlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="font-medium">{label}</p>
        <p className="text-3xl font-bold text-orange-600 tabular-nums dark:text-orange-400">{value}</p>
      </div>
      <input
        type="range"
        aria-label={label}
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-orange-600"
      />
      <div className="flex justify-between text-xs text-stone-500">
        <span>0 · calm</span>
        <span>10 · very anxious</span>
      </div>
    </div>
  )
}

export function Choice<T extends string>({
  options,
  value,
  onPick,
}: {
  options: { id: T; label: string }[]
  value?: T
  onPick: (v: T) => void
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onPick(o.id)}
          className={`flex-1 rounded-xl border-2 bg-white py-3 font-medium dark:bg-stone-900 ${
            value === o.id ? 'border-orange-500' : 'border-transparent shadow-sm'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
