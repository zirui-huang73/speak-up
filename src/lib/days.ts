const ROLLOVER_HOUR = 4

/** Local calendar day that starts at 04:00, so late-night moments count for the previous day. */
export function dayKey(at: number): string {
  const d = new Date(at)
  d.setHours(d.getHours() - ROLLOVER_HOUR)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const keyDate = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export function shiftDay(key: string, delta: number): string {
  const d = keyDate(key)
  d.setDate(d.getDate() + delta)
  return dayKey(d.getTime() + ROLLOVER_HOUR * 3_600_000)
}

/** Monday of the week containing `at` (practice-day based). */
export function weekStartKey(at: number): string {
  const key = dayKey(at)
  const weekday = (keyDate(key).getDay() + 6) % 7
  return shiftDay(key, -weekday)
}
