import { dayKey, shiftDay, weekStartKey } from './days'
import { MILESTONES, spokenMoments, type Moment, type MomentsData } from './moments'
import { SITUATIONS, type SituationId } from './situations'

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const doneAt = (m: Moment) => m.completedAt ?? m.createdAt

export function speakUpRate(data: MomentsData): number | null {
  const spoke = data.items.filter((m) => m.status === 'spoke').length
  const skipped = data.items.filter((m) => m.status === 'skipped').length
  return spoke + skipped ? spoke / (spoke + skipped) : null
}

export function nextMilestone(total: number): { next: number; previous: number } | null {
  const i = MILESTONES.findIndex((m) => m > total)
  if (i < 0) return null
  return { next: MILESTONES[i], previous: i ? MILESTONES[i - 1] : 0 }
}

export interface PredictionStats {
  count: number
  avgExpected: number
  avgFelt: number
  easierShare: number
  stuckCount: number
  stuckPassShare: number | null
  recent: { id: string; expected: number; felt: number; at: number }[]
}

/** Only moments predicted before speaking (never retro logs). */
export function predictionStats(data: MomentsData, recentCount = 20): PredictionStats | null {
  const ms = spokenMoments(data).filter((m) => !m.retro && m.expected !== undefined && m.felt !== undefined)
  if (!ms.length) return null
  const stuck = ms.filter((m) => m.stuck === 'likely' || m.stuck === 'maybe')
  return {
    count: ms.length,
    avgExpected: avg(ms.map((m) => m.expected!))!,
    avgFelt: avg(ms.map((m) => m.felt!))!,
    easierShare: ms.filter((m) => m.felt! < m.expected!).length / ms.length,
    stuckCount: stuck.length,
    stuckPassShare: stuck.length ? stuck.filter((m) => m.result === 'pass').length / stuck.length : null,
    recent: ms.slice(-recentCount).map((m) => ({ id: m.id, expected: m.expected!, felt: m.felt!, at: doneAt(m) })),
  }
}

export interface SituationStats {
  situation: SituationId
  count: number
  avgFelt: number | null
  /** Average felt anxiety of the earliest vs latest few moments, when there are enough. */
  trend: { early: number; late: number } | null
}

export function bySituation(data: MomentsData, window = 3): SituationStats[] {
  const spoken = spokenMoments(data)
  return SITUATIONS.map(({ id }) => {
    const felt = spoken.filter((m) => m.situation === id && m.felt !== undefined).map((m) => m.felt!)
    const count = spoken.filter((m) => m.situation === id).length
    return {
      situation: id,
      count,
      avgFelt: avg(felt),
      trend: felt.length >= window * 2 ? { early: avg(felt.slice(0, window))!, late: avg(felt.slice(-window))! } : null,
    }
  }).filter((s) => s.count > 0)
}

export interface WeekStats {
  start: string
  spoke: number
  skipped: number
}

export function weeklyTrend(data: MomentsData, now: number, weeks = 8): WeekStats[] {
  const current = weekStartKey(now)
  const starts = Array.from({ length: weeks }, (_, i) => shiftDay(current, -7 * (weeks - 1 - i)))
  return starts.map((start, i) => {
    const end = starts[i + 1] ?? shiftDay(current, 7)
    const inWeek = data.items.filter((m) => {
      const k = dayKey(doneAt(m))
      return k >= start && k < end
    })
    return {
      start,
      spoke: inWeek.filter((m) => m.status === 'spoke').length,
      skipped: inWeek.filter((m) => m.status === 'skipped').length,
    }
  })
}

export const history = (data: MomentsData) =>
  data.items.filter((m) => m.status !== 'pending').sort((a, b) => doneAt(b) - doneAt(a))
