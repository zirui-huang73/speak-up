export interface StorageStatus {
  persisted: boolean | null
  usageBytes: number | null
}

/** Asks the browser not to evict this site's data. Safe to call repeatedly. */
export async function requestPersistence(): Promise<boolean | null> {
  if (!navigator.storage?.persist) return null
  try {
    return (await navigator.storage.persisted()) || (await navigator.storage.persist())
  } catch {
    return null
  }
}

export async function storageStatus(): Promise<StorageStatus> {
  const persisted = navigator.storage?.persisted ? await navigator.storage.persisted().catch(() => null) : null
  const usageBytes = navigator.storage?.estimate
    ? ((await navigator.storage.estimate().catch(() => null))?.usage ?? null)
    : null
  return { persisted, usageBytes }
}
