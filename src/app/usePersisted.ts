import { useCallback, useEffect, useState } from 'react'

/** Loads a value once, then saves every change made through `mutate`. `load`/`save` must be stable. */
export function usePersisted<T>(load: () => Promise<T>, save: (value: T) => Promise<void>) {
  const [data, setData] = useState<T | null>(null)

  useEffect(() => {
    load().then(setData)
  }, [load])

  const mutate = useCallback(
    (fn: (value: T) => T) =>
      setData((prev) => {
        if (prev === null) return prev
        const next = fn(prev)
        void save(next)
        return next
      }),
    [save],
  )

  return [data, mutate] as const
}
