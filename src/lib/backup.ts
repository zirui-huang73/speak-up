import { allEntries, replaceAll } from './storage'

const APP = 'speak-up'
const VERSION = 1

export interface Backup {
  app: typeof APP
  version: number
  exportedAt: number
  data: Record<string, unknown>
}

export async function createBackup(now = Date.now()): Promise<Backup> {
  return { app: APP, version: VERSION, exportedAt: now, data: await allEntries() }
}

export function parseBackup(text: string): Backup {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('This file is not a Speak Up backup.')
  }
  const b = raw as Partial<Backup>
  if (!b || b.app !== APP || !b.data || typeof b.data !== 'object') throw new Error('This file is not a Speak Up backup.')
  if (typeof b.version !== 'number' || b.version > VERSION) throw new Error('This backup was made by a newer version of the app.')
  return b as Backup
}

/** Replaces all data, but keeps the restored backup's own timestamp as the last backup. */
export async function restoreBackup(backup: Backup): Promise<void> {
  const meta = (backup.data.meta ?? {}) as Record<string, unknown>
  await replaceAll({ ...backup.data, meta: { ...meta, lastBackupAt: backup.exportedAt } })
}

export function backupFileName(at: number) {
  const d = new Date(at)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `speak-up-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`
}

export async function shareOrDownload(file: File) {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Speak Up backup' })
      return
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') throw e
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
