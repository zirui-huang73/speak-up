import { describe, expect, it } from 'vitest'
import { dayKey, shiftDay, weekStartKey } from './days'
import {
  braveNumber,
  completeMoment,
  deleteMoment,
  loadMoments,
  logMoment,
  normalizeMoments,
  pendingMoments,
  saveMoments,
  startMoment,
  streak,
  weekCount,
  type MomentsData,
} from './moments'

const at = (s: string) => new Date(s).getTime()
const empty: MomentsData = { items: [] }

const spokeAt = (data: MomentsData, when: string) =>
  logMoment(data, { situation: 'chat', spoke: true, felt: 4, result: 'pass' }, at(when)).data

describe('days', () => {
  it('rolls over at 04:00 and finds Monday', () => {
    expect(dayKey(at('2026-11-25T01:00:00'))).toBe('2026-11-24')
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28')
    expect(weekStartKey(at('2026-11-26T10:00:00'))).toBe('2026-11-23')
    expect(weekStartKey(at('2026-11-23T02:00:00'))).toBe('2026-11-16')
  })
})

describe('start → complete', () => {
  it('keeps a pending moment until it is completed', () => {
    const { data, id } = startMoment(empty, { situation: 'meeting', expected: 8.4, stuck: 'likely' }, 1000)
    expect(pendingMoments(data)).toHaveLength(1)
    expect(data.items[0]).toMatchObject({ expected: 8, stuck: 'likely', retro: false })

    const done = completeMoment(data, id, { spoke: true, felt: 5, result: 'pass', note: '  went ok ' }, 2000)
    expect(pendingMoments(done)).toHaveLength(0)
    expect(done.items[0]).toMatchObject({ status: 'spoke', felt: 5, result: 'pass', note: 'went ok', completedAt: 2000 })
    expect(braveNumber(done, id)).toBe(1)
  })

  it('records "not this time" without a score or result', () => {
    const { data, id } = startMoment(empty, { situation: 'silence' }, 1000)
    const done = completeMoment(data, id, { spoke: false, felt: 7, result: 'fail' }, 2000)
    expect(done.items[0]).toMatchObject({ status: 'skipped', felt: undefined, result: undefined })
    expect(braveNumber(done, id)).toBe(0)
  })
})

describe('logMoment', () => {
  it('logs after the fact without a prediction', () => {
    const { data } = logMoment(empty, { situation: 'boss', spoke: true, felt: 3, result: 'pass' }, 5)
    expect(data.items[0]).toMatchObject({ retro: true, status: 'spoke' })
    expect(data.items[0].expected).toBeUndefined()
  })
})

describe('counts', () => {
  it('numbers spoken moments in order and ignores skipped ones', () => {
    let d = spokeAt(empty, '2026-11-20T10:00:00')
    d = logMoment(d, { situation: 'chat', spoke: false }, at('2026-11-21T10:00:00')).data
    d = spokeAt(d, '2026-11-22T10:00:00')
    expect(braveNumber(d, d.items[2].id)).toBe(2)
    expect(braveNumber(deleteMoment(d, d.items[0].id), d.items[2].id)).toBe(1)
  })

  it('counts this week from Monday', () => {
    let d = spokeAt(empty, '2026-11-22T10:00:00')
    d = spokeAt(d, '2026-11-23T10:00:00')
    d = spokeAt(d, '2026-11-25T10:00:00')
    expect(weekCount(d, at('2026-11-26T09:00:00'))).toBe(2)
  })

  it('counts a streak of days with at least one spoken moment', () => {
    let d = spokeAt(empty, '2026-11-22T10:00:00')
    d = spokeAt(d, '2026-11-23T10:00:00')
    d = spokeAt(d, '2026-11-24T23:30:00')
    expect(streak(d, at('2026-11-25T09:00:00'))).toBe(3)
    expect(streak(d, at('2026-11-26T09:00:00'))).toBe(0)
    d = spokeAt(d, '2026-11-25T08:00:00')
    expect(streak(d, at('2026-11-25T09:00:00'))).toBe(4)
  })
})

describe('normalize / storage', () => {
  it('drops malformed moments and clamps scores', () => {
    const d = normalizeMoments({
      items: [
        { id: 'a', situation: 'meeting', createdAt: 1, status: 'spoke', felt: 14, expected: -2, result: 'meh', note: 3 },
        { id: 'b', situation: 'party', createdAt: 1, status: 'spoke' },
        { id: 'c', situation: 'chat', createdAt: 1, status: 'done' },
      ],
    })
    expect(d.items).toHaveLength(1)
    expect(d.items[0]).toMatchObject({ felt: 10, expected: 0, result: undefined, note: '', retro: false })
  })

  it('round-trips', async () => {
    const d = spokeAt(empty, '2026-11-24T10:00:00')
    await saveMoments(d)
    expect(await loadMoments()).toEqual(normalizeMoments(d))
  })
})
