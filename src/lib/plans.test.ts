import { describe, expect, it } from 'vitest'
import {
  defaultPlans,
  fillName,
  loadPlans,
  normalizePlans,
  parseOpener,
  plansFor,
  PRESSURE_EXAMPLES,
  savePlans,
  speechPlanFor,
} from './plans'

describe('normalizePlans', () => {
  it('starts with six default plans and Pressure everywhere', () => {
    const d = normalizePlans(undefined)
    expect(d.items).toHaveLength(6)
    expect(Object.values(d.planFor).every((k) => k === 'pressure')).toBe(true)
  })

  it('drops broken plans and keeps valid ones', () => {
    const d = normalizePlans({
      items: [
        { id: 'a', situation: 'meeting', opener: 'Hi', when: 'x', hint: '', practiced: 2.7 },
        { id: 'b', situation: 'party', opener: 'Hi' },
        null,
      ],
      planFor: { meeting: 'general', nope: 'general', boss: 'loud' },
    })
    expect(d.items).toEqual([{ id: 'a', situation: 'meeting', opener: 'Hi', when: 'x', hint: '', practiced: 2 }])
    expect(d.planFor.meeting).toBe('general')
    expect(d.planFor.boss).toBe('pressure')
  })

  it('keeps an intentionally empty plan list', () => {
    expect(normalizePlans({ items: [] }).items).toEqual([])
  })
})

describe('speechPlanFor', () => {
  it('uses the per-situation choice and falls back while empty', () => {
    const d = { ...defaultPlans(), generalPlan: 'Joy – Smile – Stop', pressurePlan: '  ' }
    d.planFor.chat = 'general'
    expect(speechPlanFor(d, 'chat')).toEqual({ kind: 'general', text: 'Joy – Smile – Stop' })
    expect(speechPlanFor(d, 'meeting')).toEqual({ kind: 'pressure', text: PRESSURE_EXAMPLES[0] })
  })
})

describe('helpers', () => {
  it('finds plans for a situation', () => {
    expect(plansFor(defaultPlans(), 'intro').map((p) => p.id)).toEqual(['default-intro'])
  })

  it('fills or removes the name', () => {
    expect(fillName("Hi | I'm {name} || nice", 'Zirui')).toBe("Hi | I'm Zirui || nice")
    expect(fillName('So‿{name}.', '')).toBe('So‿.')
  })

  it('parses stops', () => {
    expect(parseOpener('Quick update || two things.')).toEqual([
      { text: 'Quick update', stop: 2 },
      { text: 'two things.', stop: 0 },
    ])
    expect(parseOpener('Do you have | two minutes?')[0]).toEqual({ text: 'Do you have', stop: 1 })
  })

  it('round-trips through storage', async () => {
    const d = { ...defaultPlans(), generalPlan: 'Pronounce – Smile – Stop' }
    await savePlans(d)
    expect(await loadPlans()).toEqual(d)
  })
})
