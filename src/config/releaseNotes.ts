import type { ReleaseNote } from '../components/WhatsNewModal'

// Bump this whenever shipping user-visible changes. The "What's New" modal
// auto-opens once for existing users when CURRENT_VERSION differs from the
// value stored under SEEN_VERSION_KEY in localStorage. First-time users do
// not see it (they have no prior version to compare against).
export const CURRENT_VERSION = '0.1.4'

export const SEEN_VERSION_KEY = 'horizon_seen_version'

export const CURRENT_RELEASE: ReleaseNote = {
  version: CURRENT_VERSION,
  date: 'May 2026',
  highlights: [
    {
      title: 'Sync your Notion tasks (optional)',
      description:
        'Use Notion for tasks? Connect your database in Settings → Notion to view, complete, and add tasks right from the new tab — changes sync back to Notion. Takes a quick manual setup. Not a Notion user? Your local to-dos work exactly as before.',
    },
    {
      title: 'Smoother wallpaper transitions',
      description:
        'Wallpapers now cross-fade when they change, instead of flashing black while the next image loads.',
    },
    {
      title: 'Refreshed task panel',
      description:
        'A cleaner task list — click a task to mark it done, with due dates and a refined look.',
    },
  ],
}
