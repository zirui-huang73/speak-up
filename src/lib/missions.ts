import { dayKey } from './days'
import type { Moment, MomentsData } from './moments'
import { isSituation, type SituationId } from './situations'
import { getValue, setValue } from './storage'

export interface Mission {
  id: string
  text: string
  situation: SituationId
}

export interface MissionsData {
  /** 1-based current level. */
  level: number
  levelSince: number
  levels: Mission[][]
  daily: { day: string; ids: string[] } | null
  /** Attempts needed before the level-up suggestion shows again after "Not yet". */
  snoozeUntil: number | null
}

export const LEVEL_NAMES = ['Warm-up', 'Small steps', 'Speaking up', 'Taking the floor', 'Center stage']
export const ATTEMPTS_TO_LEVEL_UP = 7
export const DAILY_COUNT = 3

const m = (id: string, situation: SituationId, text: string): Mission => ({ id, situation, text })

export const DEFAULT_LADDER: Mission[][] = [
  [
    m('l1-1', 'chat', 'Say “Morning!” to a colleague'),
    m('l1-2', 'chat', 'React in a chat: “Nice!” or “Really?”'),
    m('l1-3', 'intro', 'Read your self-introduction out loud, alone'),
    m('l1-4', 'other', 'Order a coffee using your Speech Plan'),
    m('l1-5', 'other', 'Thank someone, with eye contact'),
  ],
  [
    m('l2-1', 'chat', 'Ask a colleague one question at lunch'),
    m('l2-2', 'silence', 'Break a silence with one person (pantry or lift)'),
    m('l2-3', 'meeting', 'Say one sentence in the first 5 minutes of a small meeting'),
    m('l2-4', 'other', 'Ask a shop assistant a question'),
  ],
  [
    m('l3-1', 'meeting', 'Ask a question in a meeting'),
    m('l3-2', 'chat', 'Join a group chat with your opener'),
    m('l3-3', 'boss', 'Have a short 1:1 with your boss on a prepared topic'),
    m('l3-4', 'phone', 'Make a short phone call (book or ask something)'),
  ],
  [
    m('l4-1', 'meeting', 'Give a short update in a team meeting'),
    m('l4-2', 'intro', 'Introduce yourself to someone new'),
    m('l4-3', 'silence', 'Start a topic in a group'),
    m('l4-4', 'meeting', 'Add a different view politely in a meeting'),
  ],
  [
    m('l5-1', 'meeting', 'Speak up in a bigger meeting'),
    m('l5-2', 'boss', "Answer your boss's question in a meeting"),
    m('l5-3', 'meeting', 'Volunteer to present something'),
    m('l5-4', 'intro', 'Introduce yourself in front of a group'),
  ],
]

export const defaultMissions = (now: number): MissionsData => ({
  level: 1,
  levelSince: now,
  levels: DEFAULT_LADDER.map((l) => l.map((x) => ({ ...x }))),
  daily: null,
  snoozeUntil: null,
})

export const newMissionId = () => `mis-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

export const findMission = (data: MissionsData, id: string) => data.levels.flat().find((x) => x.id === id)

export const missionLevel = (data: MissionsData, id: string) => data.levels.findIndex((l) => l.some((x) => x.id === id)) + 1

function pickFrom(pool: Mission[], count: number, exclude: Set<string>, random: () => number): string[] {
  const options = pool.filter((x) => !exclude.has(x.id))
  const out: string[] = []
  while (out.length < count && options.length) out.push(options.splice(Math.floor(random() * options.length), 1)[0].id)
  return out
}

/** Two missions from the current level and one from the level below (or three at level 1). */
export function pickDaily(data: MissionsData, random: () => number = Math.random): string[] {
  const current = data.levels[data.level - 1] ?? []
  const below = data.levels[data.level - 2] ?? []
  const picked = new Set<string>()
  const fromBelow = below.length ? pickFrom(below, 1, picked, random) : []
  fromBelow.forEach((id) => picked.add(id))
  const fromCurrent = pickFrom(current, DAILY_COUNT - fromBelow.length, picked, random)
  fromCurrent.forEach((id) => picked.add(id))
  const ids = [...fromCurrent, ...fromBelow]
  if (ids.length < DAILY_COUNT) ids.push(...pickFrom(data.levels.flat(), DAILY_COUNT - ids.length, new Set(ids), random))
  return ids
}

/** Returns the same object if today's missions are still valid, otherwise a copy with a new pick. */
export function ensureDaily(data: MissionsData, now: number, random: () => number = Math.random): MissionsData {
  const day = dayKey(now)
  const valid = data.daily?.day === day && data.daily.ids.every((id) => findMission(data, id))
  return valid ? data : { ...data, daily: { day, ids: pickDaily(data, random) } }
}

export function shuffleMission(data: MissionsData, id: string, random: () => number = Math.random): MissionsData {
  if (!data.daily) return data
  const level = missionLevel(data, id)
  const exclude = new Set(data.daily.ids)
  const [replacement] = pickFrom(data.levels[level - 1] ?? [], 1, exclude, random)
  if (!replacement) return data
  return { ...data, daily: { ...data.daily, ids: data.daily.ids.map((x) => (x === id ? replacement : x)) } }
}

export const setLevel = (data: MissionsData, level: number, now: number): MissionsData => ({
  ...data,
  level: Math.min(data.levels.length, Math.max(1, level)),
  levelSince: now,
  daily: null,
  snoozeUntil: null,
})

const doneAt = (x: Moment) => x.completedAt ?? x.createdAt

export function doneToday(moments: MomentsData, missionId: string, now: number): boolean {
  const today = dayKey(now)
  return moments.items.some((x) => x.missionId === missionId && x.status === 'spoke' && dayKey(doneAt(x)) === today)
}

export const pendingFor = (moments: MomentsData, missionId: string) =>
  moments.items.find((x) => x.missionId === missionId && x.status === 'pending')

/** Spoken attempts on missions of the current level since reaching it. */
export function attemptsAtLevel(data: MissionsData, moments: MomentsData): number {
  const ids = new Set((data.levels[data.level - 1] ?? []).map((x) => x.id))
  return moments.items.filter(
    (x) => x.status === 'spoke' && x.missionId && ids.has(x.missionId) && doneAt(x) >= data.levelSince,
  ).length
}

export function suggestLevelUp(data: MissionsData, moments: MomentsData): boolean {
  if (data.level >= data.levels.length) return false
  return attemptsAtLevel(data, moments) >= Math.max(ATTEMPTS_TO_LEVEL_UP, data.snoozeUntil ?? 0)
}

export function normalizeMissions(raw: unknown, now: number): MissionsData {
  const d = defaultMissions(now)
  if (!raw || typeof raw !== 'object') return d
  const r = raw as Partial<Record<keyof MissionsData, unknown>>
  const levels =
    Array.isArray(r.levels) && r.levels.length === DEFAULT_LADDER.length
      ? r.levels.map((l) =>
          Array.isArray(l)
            ? l.filter(
                (x): x is Mission => !!x && typeof x.id === 'string' && typeof x.text === 'string' && isSituation(x.situation),
              )
            : [],
        )
      : d.levels
  const level = typeof r.level === 'number' ? Math.min(levels.length, Math.max(1, Math.round(r.level))) : 1
  const daily =
    r.daily && typeof r.daily === 'object' && typeof (r.daily as { day: unknown }).day === 'string' &&
    Array.isArray((r.daily as { ids: unknown }).ids)
      ? (r.daily as MissionsData['daily'])
      : null
  return {
    level,
    levelSince: typeof r.levelSince === 'number' ? r.levelSince : now,
    levels,
    daily,
    snoozeUntil: typeof r.snoozeUntil === 'number' ? r.snoozeUntil : null,
  }
}

export const loadMissions = async () => normalizeMissions(await getValue('missions'), Date.now())
export const saveMissions = (d: MissionsData) => setValue('missions', d)
