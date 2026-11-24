import { dayKey, shiftDay, weekStartKey } from './days'
import { isSituation, type SituationId } from './situations'
import { getValue, setValue } from './storage'

export type StuckGuess = 'likely' | 'maybe' | 'unlikely'
export type MomentStatus = 'pending' | 'spoke' | 'skipped'

export interface Moment {
  id: string
  situation: SituationId
  missionId?: string
  createdAt: number
  completedAt?: number
  status: MomentStatus
  /** Only set when predicted before speaking. */
  expected?: number
  stuck?: StuckGuess
  felt?: number
  result?: 'pass' | 'fail'
  note: string
  /** Logged after the fact (never has a prediction). */
  retro: boolean
}

export interface MomentsData {
  items: Moment[]
}

export interface StartInput {
  situation: SituationId
  expected?: number
  stuck?: StuckGuess
  missionId?: string
}

export interface Outcome {
  spoke: boolean
  felt?: number
  result?: 'pass' | 'fail'
  note?: string
}

export const MILESTONES = [1, 10, 25, 50, 100, 250, 500]

const clampScore = (n: unknown) =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(10, Math.max(0, Math.round(n))) : undefined

export const newMomentId = (now = Date.now()) => `m-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`

export function startMoment(
  data: MomentsData,
  input: StartInput,
  now: number,
  id = newMomentId(now),
): { data: MomentsData; id: string } {
  const m: Moment = {
    id,
    situation: input.situation,
    missionId: input.missionId,
    createdAt: now,
    status: 'pending',
    expected: clampScore(input.expected),
    stuck: input.stuck,
    note: '',
    retro: false,
  }
  return { data: { items: [...data.items, m] }, id }
}

function applyOutcome(m: Moment, o: Outcome, now: number): Moment {
  return {
    ...m,
    status: o.spoke ? 'spoke' : 'skipped',
    completedAt: now,
    felt: o.spoke ? clampScore(o.felt) : undefined,
    result: o.spoke ? o.result : undefined,
    note: (o.note ?? '').trim(),
  }
}

export function completeMoment(data: MomentsData, id: string, o: Outcome, now: number): MomentsData {
  return { items: data.items.map((m) => (m.id === id ? applyOutcome(m, o, now) : m)) }
}

export function logMoment(
  data: MomentsData,
  input: { situation: SituationId; missionId?: string } & Outcome,
  now: number,
  id = newMomentId(now),
): { data: MomentsData; id: string } {
  const base: Moment = { id, situation: input.situation, missionId: input.missionId, createdAt: now, status: 'pending', note: '', retro: true }
  return { data: { items: [...data.items, applyOutcome(base, input, now)] }, id }
}

export const deleteMoment = (data: MomentsData, id: string): MomentsData => ({ items: data.items.filter((m) => m.id !== id) })

export const pendingMoments = (data: MomentsData) => data.items.filter((m) => m.status === 'pending')

const doneAt = (m: Moment) => m.completedAt ?? m.createdAt
export const spokenMoments = (data: MomentsData) =>
  data.items.filter((m) => m.status === 'spoke').sort((a, b) => doneAt(a) - doneAt(b))

/** 1-based position among spoken moments ("Brave moment #N"). */
export const braveNumber = (data: MomentsData, id: string) => spokenMoments(data).findIndex((m) => m.id === id) + 1

export function weekCount(data: MomentsData, now: number): number {
  const start = weekStartKey(now)
  return spokenMoments(data).filter((m) => dayKey(doneAt(m)) >= start).length
}

/** Consecutive days with at least one spoken moment; today counts once it has one. */
export function streak(data: MomentsData, now: number): number {
  const days = new Set(spokenMoments(data).map((m) => dayKey(doneAt(m))))
  let key = dayKey(now)
  if (!days.has(key)) key = shiftDay(key, -1)
  let n = 0
  while (days.has(key)) {
    n++
    key = shiftDay(key, -1)
  }
  return n
}

export function normalizeMoments(raw: unknown): MomentsData {
  const items = raw && typeof raw === 'object' && Array.isArray((raw as MomentsData).items) ? (raw as MomentsData).items : []
  return {
    items: items
      .filter(
        (m): m is Moment =>
          !!m &&
          typeof m.id === 'string' &&
          isSituation(m.situation) &&
          typeof m.createdAt === 'number' &&
          ['pending', 'spoke', 'skipped'].includes(m.status),
      )
      .map((m) => ({
        ...m,
        expected: clampScore(m.expected),
        felt: clampScore(m.felt),
        result: m.result === 'pass' || m.result === 'fail' ? m.result : undefined,
        stuck: ['likely', 'maybe', 'unlikely'].includes(m.stuck as string) ? m.stuck : undefined,
        note: typeof m.note === 'string' ? m.note : '',
        retro: m.retro === true,
      })),
  }
}

export const loadMoments = async () => normalizeMoments(await getValue('moments'))
export const saveMoments = (d: MomentsData) => setValue('moments', d)
