import { isSituation, SITUATION_IDS, type SituationId } from './situations'
import { getValue, setValue } from './storage'

export interface IfThenPlan {
  id: string
  situation: SituationId
  when: string
  opener: string
  hint: string
  practiced: number
}

export type PlanKind = 'general' | 'pressure'

export interface PlansData {
  items: IfThenPlan[]
  generalPlan: string
  pressurePlan: string
  planFor: Record<SituationId, PlanKind>
}

const plan = (id: string, situation: SituationId, when: string, opener: string, hint = ''): IfThenPlan => ({
  id,
  situation,
  when,
  opener,
  hint,
  practiced: 0,
})

export const DEFAULT_PLANS: IfThenPlan[] = [
  plan('default-silence', 'silence', 'it goes quiet', 'So‿how was your weekend?', 'Ask a question: the spotlight moves to them.'),
  plan('default-chat', 'chat', 'I want to join a chat', 'Oh‿that reminds me…', 'Say it within 3 seconds of the thought.'),
  plan('default-meeting', 'meeting', "it's my turn in a meeting", 'Quick update || two things.'),
  plan('default-boss', 'boss', 'I need to talk to my boss', 'Do you have | two minutes?'),
  plan('default-intro', 'intro', 'I introduce myself', "Hi | I'm {name} || nice to meet you.", 'If your name sticks, glide in: So‿{name}.'),
  plan('default-time', 'other', 'I need a moment to think', 'Good question. | Let me think | for a second.'),
]

export const GENERAL_EXAMPLES = ['Joy – Smile – Stop', 'Animate Message – Smile – Stop', 'Pronounce Words – Smile – Stop']
export const PRESSURE_EXAMPLES = [
  'Slow – Link – Stop',
  'Less – Link – Stop',
  'Hum – Link – Stop',
  'Passion – Link – Stop',
  'Pronunciation – Link – Stop',
]

export const defaultPlans = (): PlansData => ({
  items: DEFAULT_PLANS.map((p) => ({ ...p })),
  generalPlan: GENERAL_EXAMPLES[0],
  pressurePlan: PRESSURE_EXAMPLES[0],
  planFor: Object.fromEntries(SITUATION_IDS.map((s) => [s, 'pressure'])) as Record<SituationId, PlanKind>,
})

export function normalizePlans(raw: unknown): PlansData {
  const d = defaultPlans()
  if (!raw || typeof raw !== 'object') return d
  const r = raw as Partial<Record<keyof PlansData, unknown>>
  const items = Array.isArray(r.items)
    ? r.items
        .filter((p): p is IfThenPlan => !!p && typeof p.id === 'string' && isSituation(p.situation) && typeof p.opener === 'string')
        .map((p) => ({
          ...p,
          when: typeof p.when === 'string' ? p.when : '',
          hint: typeof p.hint === 'string' ? p.hint : '',
          practiced: typeof p.practiced === 'number' && p.practiced > 0 ? Math.floor(p.practiced) : 0,
        }))
    : d.items
  const planFor = { ...d.planFor }
  if (r.planFor && typeof r.planFor === 'object') {
    for (const [k, v] of Object.entries(r.planFor)) if (isSituation(k) && (v === 'general' || v === 'pressure')) planFor[k] = v
  }
  return {
    items,
    generalPlan: typeof r.generalPlan === 'string' ? r.generalPlan : d.generalPlan,
    pressurePlan: typeof r.pressurePlan === 'string' ? r.pressurePlan : d.pressurePlan,
    planFor,
  }
}

/** The Speech Plan text to show for a situation, falling back to the default while a field is empty. */
export function speechPlanFor(data: PlansData, situation: SituationId): { kind: PlanKind; text: string } {
  const kind = data.planFor[situation]
  const text = (kind === 'general' ? data.generalPlan : data.pressurePlan).trim()
  return { kind, text: text || (kind === 'general' ? GENERAL_EXAMPLES[0] : PRESSURE_EXAMPLES[0]) }
}

export const plansFor = (data: PlansData, situation: SituationId) => data.items.filter((p) => p.situation === situation)

export function fillName(text: string, name: string): string {
  const n = name.trim()
  return n ? text.replaceAll('{name}', n) : text.replace(/\s*\{name\}/g, '')
}

export interface Segment {
  text: string
  stop: 0 | 1 | 2
}

/** Splits an opener on `|` (1-second stop) and `||` (2-second stop). */
export function parseOpener(text: string): Segment[] {
  const parts = text.split(/\s*(\|\|?)\s*/)
  const out: Segment[] = []
  for (let i = 0; i < parts.length; i += 2) {
    if (!parts[i].trim()) continue
    out.push({ text: parts[i].trim(), stop: parts[i + 1] === '||' ? 2 : parts[i + 1] === '|' ? 1 : 0 })
  }
  return out
}

export const newPlanId = () => `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

export const loadPlans = async () => normalizePlans(await getValue('plans'))
export const savePlans = (d: PlansData) => setValue('plans', d)
