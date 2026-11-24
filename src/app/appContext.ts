import { createContext, useContext } from 'react'
import type { Meta } from '../lib/meta'
import type { Settings } from '../lib/settings'

export interface AppContextValue {
  settings: Settings
  meta: Meta
  persisted: boolean | null
  updateSettings: (patch: Partial<Settings>) => void
  updateMeta: (patch: Partial<Meta>) => void
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
