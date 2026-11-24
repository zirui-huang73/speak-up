export const SITUATIONS = [
  { id: 'meeting', label: 'Meeting' },
  { id: 'boss', label: 'Talking to my boss' },
  { id: 'intro', label: 'Introducing myself' },
  { id: 'chat', label: 'Joining a chat' },
  { id: 'silence', label: 'Breaking a silence' },
  { id: 'phone', label: 'Phone call' },
  { id: 'other', label: 'Other' },
] as const

export type SituationId = (typeof SITUATIONS)[number]['id']

export const SITUATION_IDS = SITUATIONS.map((s) => s.id) as SituationId[]

export const situationLabel = (id: SituationId) => SITUATIONS.find((s) => s.id === id)?.label ?? id

export const isSituation = (v: unknown): v is SituationId => SITUATION_IDS.includes(v as SituationId)
