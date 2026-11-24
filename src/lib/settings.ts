import { getValue, setValue } from './storage'

export const THEMES = ['system', 'light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

export interface Settings {
  name: string
  theme: Theme
}

export const DEFAULT_SETTINGS: Settings = { name: '', theme: 'system' }

export function normalizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof Settings, unknown>>
  return {
    name: typeof r.name === 'string' ? r.name : DEFAULT_SETTINGS.name,
    theme: THEMES.includes(r.theme as Theme) ? (r.theme as Theme) : DEFAULT_SETTINGS.theme,
  }
}

export const loadSettings = async () => normalizeSettings(await getValue('settings'))
export const saveSettings = (s: Settings) => setValue('settings', normalizeSettings(s))
