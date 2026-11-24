import { Link } from 'react-router-dom'
import { useApp } from '../app/appContext'
import { XIcon } from '../app/icons'
import { backupDue, currentPlatform } from '../lib/meta'

export function InstallHint() {
  const { meta, updateMeta } = useApp()
  const p = currentPlatform()
  if (p.standalone || (!p.iosNonSafari && meta.installHintDismissed)) return null

  return (
    <div className="flex gap-3 rounded-2xl bg-sky-50 p-4 text-sm text-sky-900 dark:bg-sky-950 dark:text-sky-100">
      <div className="flex-1">
        {p.iosNonSafari ? (
          <>
            <p className="font-semibold">Open this app in Safari</p>
            <p className="mt-1">
              Chrome and other iPhone browsers can lose this app's data. Open the same address in Safari, then add it to
              your Home Screen.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold">Install for safer storage</p>
            <p className="mt-1">
              {p.ios ? 'In Safari, tap Share, then “Add to Home Screen”.' : 'Add this app to your Home Screen or dock.'}{' '}
              Installed apps keep their data more reliably.{' '}
              <Link to="/more/install" className="underline">
                How?
              </Link>
            </p>
          </>
        )}
      </div>
      {!p.iosNonSafari && (
        <button type="button" aria-label="Dismiss" onClick={() => updateMeta({ installHintDismissed: true })}>
          <XIcon className="size-5 opacity-60" />
        </button>
      )}
    </div>
  )
}

export function BackupReminder({ now }: { now: number }) {
  const { meta } = useApp()
  if (!backupDue(meta, now)) return null
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
      <p className="flex-1">
        <span className="font-semibold">Time for a backup.</span>{' '}
        {meta.lastBackupAt ? 'Your last backup was over a week ago.' : 'You have not backed up your progress yet.'}
      </p>
      <Link to="/more/storage" className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 font-medium text-white">
        Back up
      </Link>
    </div>
  )
}
