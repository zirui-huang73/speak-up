/** Keeps the screen on until the returned release function is called. No-op where unsupported. */
export function keepAwake(): () => void {
  if (!('wakeLock' in navigator)) return () => {}
  let sentinel: WakeLockSentinel | null = null
  let active = true
  const acquire = async () => {
    try {
      sentinel = await navigator.wakeLock.request('screen')
    } catch {
      sentinel = null
    }
  }
  const onVisible = () => {
    if (active && document.visibilityState === 'visible') void acquire()
  }
  void acquire()
  document.addEventListener('visibilitychange', onVisible)
  return () => {
    active = false
    document.removeEventListener('visibilitychange', onVisible)
    void sentinel?.release()
  }
}
