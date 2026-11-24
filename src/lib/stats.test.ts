import { describe, expect, it } from 'vitest'
import { completeMoment, logMoment, startMoment, updateOutcome, type MomentsData, type StuckGuess } from './moments'
import { bySituation, history, nextMilestone, predictionStats, speakUpRate, weeklyTrend } from './stats'

const at = (s: string) => new Date(s).getTime()
const empty: MomentsData = { items: [] }

function predicted(
  data: MomentsData,
  when: string,
  expected: number,
  felt: number,
  result: 'pass' | 'fail',
  stuck?: StuckGuess,
): MomentsData {
  const t = at(when)
  const { data: d, id } = startMoment(data, { situation: 'meeting', expected, stuck }, t)
  return completeMoment(d, id, { spoke: true, felt, result }, t + 60_000)
}

describe('speakUpRate / nextMilestone', () => {
  it('compares spoken with "not this time"', () => {
    expect(speakUpRate(empty)).toBeNull()
    let d = logMoment(empty, { situation: 'chat', spoke: true, felt: 3, result: 'pass' }, 1).data
    d = logMoment(d, { situation: 'chat', spoke: false }, 2).data
    expect(speakUpRate(d)).toBe(0.5)
  })

  it('finds the next milestone', () => {
    expect(nextMilestone(0)).toEqual({ next: 1, previous: 0 })
    expect(nextMilestone(12)).toEqual({ next: 25, previous: 10 })
    expect(nextMilestone(999)).toBeNull()
  })
})

describe('predictionStats', () => {
  it('ignores retro logs and summarizes expected vs felt', () => {
    let d = predicted(empty, '2026-11-20T10:00:00', 8, 4, 'pass', 'likely')
    d = predicted(d, '2026-11-21T10:00:00', 6, 6, 'fail', 'maybe')
    d = predicted(d, '2026-11-22T10:00:00', 4, 2, 'pass')
    d = logMoment(d, { situation: 'chat', spoke: true, felt: 9, result: 'fail' }, at('2026-11-23T10:00:00')).data
    const s = predictionStats(d)!
    expect(s.count).toBe(3)
    expect(s.avgExpected).toBe(6)
    expect(s.avgFelt).toBe(4)
    expect(s.easierShare).toBeCloseTo(2 / 3)
    expect(s.stuckCount).toBe(2)
    expect(s.stuckPassShare).toBe(0.5)
    expect(s.recent.map((r) => r.expected)).toEqual([8, 6, 4])
  })

  it('is null without predictions', () => {
    expect(predictionStats(logMoment(empty, { situation: 'chat', spoke: true, felt: 3 }, 1).data)).toBeNull()
  })
})

describe('bySituation', () => {
  it('shows a trend once there are enough moments', () => {
    let d = empty
    ;[8, 7, 7, 5, 4, 3].forEach((felt, i) => {
      d = predicted(d, `2026-11-1${i}T10:00:00`, 8, felt, 'pass')
    })
    const [meeting] = bySituation(d)
    expect(meeting.situation).toBe('meeting')
    expect(meeting.count).toBe(6)
    expect(meeting.trend!.early).toBeCloseTo(22 / 3)
    expect(meeting.trend!.late).toBe(4)
  })
})

describe('weeklyTrend / history / updateOutcome', () => {
  it('buckets the last 8 weeks from Monday', () => {
    let d = predicted(empty, '2026-11-24T10:00:00', 5, 4, 'pass')
    d = logMoment(d, { situation: 'chat', spoke: false }, at('2026-11-18T10:00:00')).data
    const w = weeklyTrend(d, at('2026-11-26T10:00:00'))
    expect(w).toHaveLength(8)
    expect(w[7]).toEqual({ start: '2026-11-23', spoke: 1, skipped: 0 })
    expect(w[6]).toEqual({ start: '2026-11-16', spoke: 0, skipped: 1 })
  })

  it('lists finished moments newest first and edits them in place', () => {
    let d = predicted(empty, '2026-11-20T10:00:00', 5, 4, 'pass')
    d = startMoment(d, { situation: 'boss' }, at('2026-11-21T10:00:00')).data
    d = predicted(d, '2026-11-22T10:00:00', 5, 6, 'fail')
    const h = history(d)
    expect(h).toHaveLength(2)
    expect(h[0].felt).toBe(6)

    const edited = updateOutcome(d, h[0].id, { spoke: true, felt: 3, result: 'pass', note: 'fine' })
    const m = edited.items.find((x) => x.id === h[0].id)!
    expect(m).toMatchObject({ felt: 3, result: 'pass', note: 'fine', completedAt: h[0].completedAt })
  })
})
