import { getValue, setValue } from './storage'

export interface Meta {
  firstUseAt: number
  lastBackupAt: number | null
  installHintDismissed: boolean
}

const DAY_MS = 24 * 60 * 60 * 1000
export const BACKUP_INTERVAL_DAYS = 7

export function normalizeMeta(raw: unknown, now: number): Meta {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof Meta, unknown>>
  return {
    firstUseAt: typeof r.firstUseAt === 'number' ? r.firstUseAt : now,
    lastBackupAt: typeof r.lastBackupAt === 'number' ? r.lastBackupAt : null,
    installHintDismissed: r.installHintDismissed === true,
  }
}

/** Due once a week has passed since the last backup (or since first use, if never backed up). */
export const backupDue = (meta: Meta, now: number) =>
  now - (meta.lastBackupAt ?? meta.firstUseAt) > BACKUP_INTERVAL_DAYS * DAY_MS

export const loadMeta = async () => {
  const raw = await getValue('meta')
  const meta = normalizeMeta(raw, Date.now())
  if (!raw) await saveMeta(meta)
  return meta
}
export const saveMeta = (m: Meta) => setValue('meta', m)

export interface Platform {
  standalone: boolean
  ios: boolean
  iosNonSafari: boolean
}

export function detectPlatform(userAgent: string, standalone: boolean): Platform {
  const ios = /iPhone|iPad|iPod/.test(userAgent)
  return { standalone, ios, iosNonSafari: ios && /CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent) }
}

export const currentPlatform = () =>
  detectPlatform(
    navigator.userAgent,
    window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  )
