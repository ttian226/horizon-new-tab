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
