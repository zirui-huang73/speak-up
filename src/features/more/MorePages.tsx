import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../app/appContext'
import { ChevronIcon } from '../../app/icons'
import { BackLink, Card, inputCls, PageHeader, primaryBtn, secondaryBtn } from '../../app/ui'
import { backupFileName, createBackup, parseBackup, restoreBackup, shareOrDownload } from '../../lib/backup'
import { storageStatus, type StorageStatus } from '../../lib/persist'
import { THEMES } from '../../lib/settings'

const ITEMS = [
  { to: '/more/settings', label: 'Settings', hint: 'Your name and theme' },
  { to: '/more/storage', label: 'Storage & backup', hint: 'Keep your progress safe' },
  { to: '/more/install', label: 'How to install', hint: 'Add Speak Up to your Home Screen' },
]

export function MorePage() {
  return (
    <>
      <PageHeader title="More" />
      <ul className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
        {ITEMS.map(({ to, label, hint }) => (
          <li key={to}>
            <Link to={to} className="flex items-center justify-between px-5 py-4 hover:bg-stone-50 dark:hover:bg-stone-800">
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-stone-500 dark:text-stone-400">{hint}</p>
              </div>
              <ChevronIcon />
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

export function SettingsPage() {
  const { settings, updateSettings } = useApp()
  return (
    <>
      <BackLink to="/more" label="More" />
      <PageHeader title="Settings" />
      <div className="space-y-4">
        <Card>
          <label htmlFor="name" className="text-sm font-medium text-stone-600 dark:text-stone-300">
            Your name
          </label>
          <input
            id="name"
            className={inputCls}
            value={settings.name}
            placeholder="Used in your self-introduction opener"
            onChange={(e) => updateSettings({ name: e.target.value })}
          />
        </Card>
        <Card className="space-y-3">
          <h2 className="font-semibold">Theme</h2>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-800">
            {THEMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => updateSettings({ theme: t })}
                className={`rounded-lg py-2 text-sm font-medium capitalize ${
                  settings.theme === t ? 'bg-white shadow-sm dark:bg-stone-700' : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

type Status = { kind: 'ok' | 'error'; text: string } | null

export function StoragePage() {
  const { meta, persisted, updateMeta } = useApp()
  const [info, setInfo] = useState<StorageStatus | null>(null)
  const [status, setStatus] = useState<Status>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    storageStatus().then(setInfo)
  }, [persisted])

  const exportData = async () => {
    setBusy(true)
    setStatus(null)
    try {
      const backup = await createBackup()
      const file = new File([JSON.stringify(backup)], backupFileName(backup.exportedAt), { type: 'application/json' })
      await shareOrDownload(file)
      updateMeta({ lastBackupAt: backup.exportedAt })
      setStatus({ kind: 'ok', text: 'Backup saved.' })
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError'))
        setStatus({ kind: 'error', text: e instanceof Error ? e.message : String(e) })
    } finally {
      setBusy(false)
    }
  }

  const importData = async (file: File) => {
    setStatus(null)
    try {
      const backup = parseBackup(await file.text())
      if (!confirm(`Replace all data on this device with the backup from ${new Date(backup.exportedAt).toLocaleString()}?`))
        return
      setBusy(true)
      await restoreBackup(backup)
      window.location.reload()
    } catch (e) {
      setStatus({ kind: 'error', text: e instanceof Error ? e.message : String(e) })
      setBusy(false)
    }
  }

  const isPersisted = info?.persisted ?? persisted
  return (
    <>
      <BackLink to="/more" label="More" />
      <PageHeader title="Storage & backup" subtitle="Your data lives only on this device." />
      <div className="space-y-4">
        <Card className="space-y-2 text-sm">
          <Row label="Protected from automatic clean-up">
            {isPersisted === null ? 'Not supported' : isPersisted ? 'Yes' : 'Not yet'}
          </Row>
          <Row label="Last backup">{meta.lastBackupAt ? new Date(meta.lastBackupAt).toLocaleString() : 'Never'}</Row>
          <Row label="Space used">{info?.usageBytes != null ? `${(info.usageBytes / 1024).toFixed(0)} KB` : '–'}</Row>
          <Row label="Using since">{new Date(meta.firstUseAt).toLocaleDateString()}</Row>
          {isPersisted === false && (
            <p className="pt-2 text-stone-500">Installing the app to your Home Screen usually turns protection on.</p>
          )}
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">Back up</h2>
          <p className="text-sm text-stone-500">
            Saves everything to one file. On iPhone, choose “Save to Files” (iCloud Drive) or AirDrop it to your Mac.
          </p>
          <button type="button" disabled={busy} onClick={exportData} className={primaryBtn}>
            Export backup
          </button>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">Restore</h2>
          <p className="text-sm text-stone-500">Replaces everything on this device with a backup file.</p>
          <label className={`inline-block cursor-pointer ${secondaryBtn} ${busy ? 'pointer-events-none opacity-40' : ''}`}>
            Choose backup file…
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) void importData(f)
              }}
            />
          </label>
        </Card>

        {status && (
          <p
            className={`rounded-xl p-3 text-sm ${
              status.kind === 'ok'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200'
            }`}
          >
            {status.text}
          </p>
        )}
      </div>
    </>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-stone-500">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  )
}

export function InstallPage() {
  return (
    <>
      <BackLink to="/more" label="More" />
      <PageHeader title="How to install" subtitle="Installed apps keep their data more reliably." />
      <div className="space-y-4">
        <Card>
          <h2 className="font-semibold">iPhone / iPad</h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-stone-700 dark:text-stone-300">
            <li>
              Open <b>zirui-huang73.github.io/speak-up</b> in <b>Safari</b> (not Chrome).
            </li>
            <li>Tap the Share button.</li>
            <li>Choose “Add to Home Screen”, then “Add”.</li>
            <li>From now on, always open Speak Up from the Home Screen icon.</li>
          </ol>
          <p className="mt-3 text-sm text-stone-500">
            The Home Screen app and Safari tabs keep separate data. If you already used it in a tab, export a backup
            there and restore it in the app.
          </p>
        </Card>
        <Card>
          <h2 className="font-semibold">Mac / desktop</h2>
          <p className="mt-2 text-stone-700 dark:text-stone-300">
            In Chrome or Edge, use the install icon in the address bar. In Safari, choose File → Add to Dock.
          </p>
        </Card>
      </div>
    </>
  )
}
