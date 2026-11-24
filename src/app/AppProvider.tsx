import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadMeta, saveMeta } from '../lib/meta'
import { requestPersistence } from '../lib/persist'
import { loadSettings, normalizeSettings, saveSettings, type Theme } from '../lib/settings'
import { AppContext, type AppContextValue } from './appContext'
import { usePersisted } from './usePersisted'

function useApplyTheme(theme: Theme | undefined) {
  useEffect(() => {
    if (!theme) return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, mutateSettings] = usePersisted(loadSettings, saveSettings)
  const [meta, mutateMeta] = usePersisted(loadMeta, saveMeta)
  const [persisted, setPersisted] = useState<boolean | null>(null)

  useEffect(() => {
    requestPersistence().then(setPersisted)
  }, [])

  useApplyTheme(settings?.theme)

  const value = useMemo<AppContextValue | null>(
    () =>
      settings && meta
        ? {
            settings,
            meta,
            persisted,
            updateSettings: (patch) => mutateSettings((s) => normalizeSettings({ ...s, ...patch })),
            updateMeta: (patch) => mutateMeta((m) => ({ ...m, ...patch })),
          }
        : null,
    [settings, meta, persisted, mutateSettings, mutateMeta],
  )

  if (!value) return null
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
