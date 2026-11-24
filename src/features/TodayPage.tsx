import { useState } from 'react'
import { useApp } from '../app/appContext'
import { ComingSoon, PageHeader } from '../app/ui'
import { BackupReminder, InstallHint } from './Banners'

function greeting(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function TodayPage() {
  const { settings } = useApp()
  const [now] = useState(() => Date.now())
  const name = settings.name.trim()

  return (
    <>
      <PageHeader
        title={`${greeting(new Date(now).getHours())}${name ? `, ${name}` : ''}`}
        subtitle="Every time you speak up counts. Fluent or not."
      />
      <div className="space-y-4">
        <InstallHint />
        <BackupReminder now={now} />
        <ComingSoon step={3}>“I'm about to speak”: predict, 30 seconds to get ready, then log how it went.</ComingSoon>
        <ComingSoon step={4}>Today's three brave missions, on a five-level ladder.</ComingSoon>
      </div>
    </>
  )
}
