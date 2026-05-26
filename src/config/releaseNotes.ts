import type { ReleaseNote } from '../components/WhatsNewModal'

// Bump this whenever shipping user-visible changes. The "What's New" modal
// auto-opens once for existing users when CURRENT_VERSION differs from the
// value stored under SEEN_VERSION_KEY in localStorage. First-time users do
// not see it (they have no prior version to compare against).
export const CURRENT_VERSION = '0.1.3'

export const SEEN_VERSION_KEY = 'horizon_seen_version'

export const CURRENT_RELEASE: ReleaseNote = {
  version: CURRENT_VERSION,
  date: 'May 2026',
  highlights: [
    {
      title: 'Wallpaper auto-rotates hourly',
      description:
        'New tabs opened more than an hour apart now refresh to a different wallpaper automatically. Tabs opened within the same hour still share one wallpaper for a calmer experience.',
    },
  ],
}
