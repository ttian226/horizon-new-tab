// Coarse "synced N ago" label for a syncSource timestamp (Notion fetch etc).
// Updates roughly every minute via React state when caller re-renders.
export function formatSyncedAgo(ms: number | null): string {
  if (ms === null) return ''
  const diffMs = Date.now() - ms
  if (diffMs < 30 * 1000) return 'just now'
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// Human-friendly due-date label for todo rows. Returns "Today" / "Tomorrow"
// / "Yesterday" for adjacent days, otherwise a short month+day (and year if
// not current year). isPast lets the caller paint overdue dates in red.

export function formatDueDate(iso: string): { label: string; isPast: boolean } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(iso)
  due.setHours(0, 0, 0, 0)

  const msPerDay = 86400000
  const diffDays = Math.round((due.getTime() - today.getTime()) / msPerDay)

  if (diffDays === 0) return { label: 'Today', isPast: false }
  if (diffDays === 1) return { label: 'Tomorrow', isPast: false }
  if (diffDays === -1) return { label: 'Yesterday', isPast: true }

  const sameYear = due.getFullYear() === today.getFullYear()
  const label = due.toLocaleDateString('en-US', sameYear
    ? { month: 'short', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' })

  return { label, isPast: diffDays < 0 }
}
