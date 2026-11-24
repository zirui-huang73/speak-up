import { describe, expect, it } from 'vitest'
import { backupFileName, createBackup, parseBackup, restoreBackup } from './backup'
import { backupDue, detectPlatform, loadMeta, normalizeMeta, saveMeta } from './meta'
import { DEFAULT_SETTINGS, loadSettings, normalizeSettings, saveSettings } from './settings'

const DAY = 24 * 60 * 60 * 1000

describe('settings', () => {
  it('normalizes bad input to defaults', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings({ name: 3, theme: 'pink' })).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings({ name: 'Zirui', theme: 'dark' })).toEqual({ name: 'Zirui', theme: 'dark' })
  })
})

describe('meta', () => {
  it('starts the clock on first use', () => {
    expect(normalizeMeta(undefined, 5)).toEqual({ firstUseAt: 5, lastBackupAt: null, installHintDismissed: false })
  })

  it('asks for a backup a week after first use or the last backup', () => {
    const fresh = normalizeMeta(undefined, 0)
    expect(backupDue(fresh, 6 * DAY)).toBe(false)
    expect(backupDue(fresh, 8 * DAY)).toBe(true)
    expect(backupDue({ ...fresh, lastBackupAt: 5 * DAY }, 8 * DAY)).toBe(false)
  })

  it('creates and keeps meta in storage', async () => {
    const first = await loadMeta()
    expect((await loadMeta()).firstUseAt).toBe(first.firstUseAt)
  })
})

describe('detectPlatform', () => {
  const iphoneSafari =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  const iphoneChrome =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1'
  it('spots iPhone Safari, iPhone Chrome and installed apps', () => {
    expect(detectPlatform(iphoneSafari, false)).toEqual({ standalone: false, ios: true, iosNonSafari: false })
    expect(detectPlatform(iphoneChrome, false)).toEqual({ standalone: false, ios: true, iosNonSafari: true })
    expect(detectPlatform(iphoneSafari, true).standalone).toBe(true)
    expect(detectPlatform('Mozilla/5.0 (Macintosh)', false).ios).toBe(false)
  })
})

describe('backup', () => {
  it('rejects other files', () => {
    expect(() => parseBackup('nope')).toThrow('not a Speak Up backup')
    expect(() => parseBackup('{"app":"speak-freely","data":{}}')).toThrow('not a Speak Up backup')
    expect(() => parseBackup('{"app":"speak-up","version":9,"data":{}}')).toThrow('newer version')
  })

  it('round-trips all data and records the backup time', async () => {
    await saveSettings({ name: 'Zirui', theme: 'dark' })
    await saveMeta({ firstUseAt: 1, lastBackupAt: null, installHintDismissed: true })
    const backup = parseBackup(JSON.stringify(await createBackup(1234)))

    await saveSettings({ name: 'Other', theme: 'light' })
    await restoreBackup(backup)
    expect(await loadSettings()).toEqual({ name: 'Zirui', theme: 'dark' })
    expect(await loadMeta()).toMatchObject({ firstUseAt: 1, lastBackupAt: 1234, installHintDismissed: true })
  })

  it('names files by local date', () => {
    expect(backupFileName(new Date('2026-11-24T10:00:00').getTime())).toBe('speak-up-backup-2026-11-24.json')
  })
})
