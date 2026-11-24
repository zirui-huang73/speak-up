import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../app/appContext'
import { PageHeader } from '../app/ui'
import { pendingMoments, streak, weekCount } from '../lib/moments'
import { situationLabel } from '../lib/situations'
import { BackupReminder, InstallHint } from './Banners'
import { MissionsSection } from './missions/MissionsSection'
import { useMoments } from './moments/momentsContext'

function greeting(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const time = (t: number) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export function TodayPage() {
  const { settings } = useApp()
  const { data } = useMoments()
  const [now] = useState(() => Date.now())
  const name = settings.name.trim()
  const pending = pendingMoments(data)
  const week = weekCount(data, now)
  const s = streak(data, now)

  return (
    <>
      <PageHeader
        title={`${greeting(new Date(now).getHours())}${name ? `, ${name}` : ''}`}
        subtitle="Every time you speak up counts. Fluent or not."
      />
      <div className="space-y-4">
        <InstallHint />
        <BackupReminder now={now} />

        {pending.map((m) => (
          <Link
            key={m.id}
            to={`/moment/${m.id}`}
            className="flex items-center gap-4 rounded-2xl border-2 border-orange-400 bg-orange-50 p-4 dark:bg-orange-950"
          >
            <div className="flex-1">
              <p className="font-semibold">How did it go?</p>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                {situationLabel(m.situation)} · started {time(m.createdAt)}
              </p>
            </div>
            <span className="rounded-xl bg-orange-600 px-3 py-2 text-sm font-medium text-white">Tell me</span>
          </Link>
        ))}

        <Link
          to="/moment"
          className="block rounded-3xl bg-orange-600 p-6 text-center text-white shadow-sm hover:bg-orange-700 active:scale-[0.99]"
        >
          <p className="text-2xl font-bold">I'm about to speak</p>
          <p className="mt-1 text-sm text-white/80">Guess, get ready in 30 seconds, then go.</p>
        </Link>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-stone-900">
            <p className="text-2xl font-bold">{week}</p>
            <p className="text-xs text-stone-500">this week</p>
          </div>
          <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-stone-900">
            <p className="text-2xl font-bold">{s}</p>
            <p className="text-xs text-stone-500">day streak</p>
          </div>
          <Link to="/log" className="grid place-items-center rounded-2xl bg-white p-3 text-sm font-medium text-orange-700 shadow-sm dark:bg-stone-900 dark:text-orange-400">
            Log a moment
          </Link>
        </div>

        <MissionsSection />
      </div>
    </>
  )
}
