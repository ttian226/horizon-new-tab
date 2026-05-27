// Promise-wrapped chrome.storage.local helpers.
// chrome.storage.local survives extension reloads and is sandboxed per
// extension ID — appropriate for sensitive tokens that should NOT live in
// Firestore (which would expose them to backend rules + replication).

export async function getLocal<T>(key: string): Promise<T | undefined> {
  const result = await chrome.storage.local.get(key)
  return result[key] as T | undefined
}

export async function setLocal<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value })
}

export async function removeLocal(key: string): Promise<void> {
  await chrome.storage.local.remove(key)
}
