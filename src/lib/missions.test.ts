import { describe, expect, it } from 'vitest'
import {
  attemptsAtLevel,
  defaultMissions,
  doneToday,
  ensureDaily,
  loadMissions,
  missionLevel,
  normalizeMissions,
  pendingFor,
  pickDaily,
  saveMissions,
  setLevel,
  shuffleMission,
  suggestLevelUp,
} from './missions'
import { logMoment, startMoment, type MomentsData } from './moments'

const at = (s: string) => new Date(s).getTime()
const seq = (...values: number[]) => {
  let i = 0
  return () => values[i++ % values.length]
}

describe('pickDaily', () => {
  it('gives three level-1 missions at level 1', () => {
    const ids = pickDaily(defaultMissions(0), seq(0))
    expect(ids).toHaveLength(3)
    expect(new Set(ids).size).toBe(3)
    expect(ids.every((id) => id.startsWith('l1-'))).toBe(true)
  })

  it('gives two from the current level and one from below', () => {
    const ids = pickDaily(setLevel(defaultMissions(0), 3, 0), seq(0.5))
    expect(ids.filter((id) => id.startsWith('l3-'))).toHaveLength(2)
    expect(ids.filter((id) => id.startsWith('l2-'))).toHaveLength(1)
  })
})

describe('ensureDaily / shuffle', () => {
  it('keeps the pick for the day and refreshes the next day', () => {
    const d = ensureDaily(defaultMissions(0), at('2026-11-24T09:00:00'), seq(0))
    expect(ensureDaily(d, at('2026-11-24T22:00:00'))).toBe(d)
    expect(ensureDaily(d, at('2026-11-25T09:00:00')).daily!.day).toBe('2026-11-25')
  })

  it('shuffles one mission within its level', () => {
    const d = ensureDaily(defaultMissions(0), at('2026-11-24T09:00:00'), seq(0))
    const first = d.daily!.ids[0]
    const s = shuffleMission(d, first, seq(0))
    expect(s.daily!.ids[0]).not.toBe(first)
    expect(missionLevel(s, s.daily!.ids[0])).toBe(missionLevel(d, first))
    expect(new Set(s.daily!.ids).size).toBe(3)
  })
})

describe('progress on missions', () => {
  const spoke = (data: MomentsData, missionId: string, when: string) =>
    logMoment(data, { situation: 'chat', missionId, spoke: true, felt: 3, result: 'pass' }, at(when)).data

  it('marks a mission done today only when spoken today', () => {
    let mo: MomentsData = { items: [] }
    mo = spoke(mo, 'l1-1', '2026-11-23T10:00:00')
    expect(doneToday(mo, 'l1-1', at('2026-11-24T10:00:00'))).toBe(false)
    mo = logMoment(mo, { situation: 'chat', missionId: 'l1-1', spoke: false }, at('2026-11-24T09:00:00')).data
    expect(doneToday(mo, 'l1-1', at('2026-11-24T10:00:00'))).toBe(false)
    mo = spoke(mo, 'l1-1', '2026-11-24T11:00:00')
    expect(doneToday(mo, 'l1-1', at('2026-11-24T12:00:00'))).toBe(true)
  })

  it('finds a pending moment for a mission', () => {
    const { data } = startMoment({ items: [] }, { situation: 'chat', missionId: 'l1-2' }, 1)
    expect(pendingFor(data, 'l1-2')?.status).toBe('pending')
  })

  it('suggests levelling up after 7 spoken attempts at the current level, with snooze', () => {
    let d = setLevel(defaultMissions(0), 2, at('2026-11-01T00:00:00'))
    let mo: MomentsData = { items: [] }
    mo = spoke(mo, 'l2-1', '2026-10-30T10:00:00')
    for (let i = 0; i < 6; i++) mo = spoke(mo, 'l2-2', `2026-11-0${i + 2}T10:00:00`)
    mo = spoke(mo, 'l1-1', '2026-11-09T10:00:00')
    expect(attemptsAtLevel(d, mo)).toBe(6)
    expect(suggestLevelUp(d, mo)).toBe(false)
    mo = spoke(mo, 'l2-3', '2026-11-10T10:00:00')
    expect(suggestLevelUp(d, mo)).toBe(true)
    d = { ...d, snoozeUntil: 10 }
    expect(suggestLevelUp(d, mo)).toBe(false)
    expect(suggestLevelUp(setLevel(d, 5, 0), mo)).toBe(false)
  })
})

describe('normalize / storage', () => {
  it('falls back to defaults and clamps the level', () => {
    expect(normalizeMissions(null, 5).levels).toHaveLength(5)
    const d = normalizeMissions({ level: 9, levels: [[{ id: 'x', text: 'Hi', situation: 'chat' }, { id: 'y' }], [], [], [], []] }, 5)
    expect(d.level).toBe(5)
    expect(d.levels[0]).toEqual([{ id: 'x', text: 'Hi', situation: 'chat' }])
  })

  it('round-trips', async () => {
    const d = ensureDaily(defaultMissions(1), at('2026-11-24T09:00:00'), seq(0))
    await saveMissions(d)
    expect(await loadMissions()).toEqual(d)
  })
})
