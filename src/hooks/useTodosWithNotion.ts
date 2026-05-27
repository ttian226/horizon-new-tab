import { useCallback, useEffect, useRef, useState } from 'react'
import type { Unsubscribe } from 'firebase/firestore'
import {
  CloudTodoItem,
  subscribeTodos,
  ensureDefaultTodoList,
} from '../services/firestore'
import {
  loadConfig as loadNotionConfig,
  fetchTasks as fetchNotionTasks,
  notionTaskToTodoItem,
  type NotionConfig,
} from '../services/notion'

const POLL_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const NOTION_TASK_LIMIT = 50

export interface UseTodosResult {
  /** Rendered list — adapted to CloudTodoItem shape regardless of source. */
  todos: CloudTodoItem[]
  /** True while the initial data source / first fetch is settling. */
  isLoading: boolean
  /** True when Notion is configured and is the active data source. */
  isNotionMode: boolean
  /** ms epoch of the last successful Notion fetch (null otherwise). */
  lastSyncedAt: number | null
  /** Notion fetch error message, cleared on the next successful fetch. */
  notionError: string | null
  /** For Notion-sourced rows, the Notion page URL for click-through. */
  notionUrlFor: (todoId: string) => string | undefined
  /** Local-mode list id, needed by the add-todo input. Empty in Notion mode. */
  localListId: string
  /** Manually trigger a Notion refetch (no-op outside Notion mode). */
  refreshNotion: () => void
}

/**
 * Single hook backing both TodoApp and TodoWidget. Picks source based on
 * Notion config:
 *
 *   - Notion configured → fetch + 5-minute poll + window-focus refresh.
 *     Rendered items get a `notionUrl` for click-through.
 *   - Not configured     → subscribe to the user's Firestore todos
 *     (existing behaviour, unchanged).
 *
 * Config presence is the only switch — we don't dual-source. Stopping the
 * Notion integration in Settings makes the hook fall back to Firestore on
 * the next render.
 */
export function useTodosWithNotion(userId: string | undefined): UseTodosResult {
  // Three-state: undefined = still loading, null = no Notion, NotionConfig = enabled.
  const [config, setConfig] = useState<NotionConfig | null | undefined>(undefined)
  const [todos, setTodos] = useState<CloudTodoItem[]>([])
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const [notionError, setNotionError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [localListId, setLocalListId] = useState('')
  const notionUrlMapRef = useRef<Map<string, string>>(new Map())

  // 1. Load Notion config on mount.
  useEffect(() => {
    loadNotionConfig().then((c) => setConfig(c))
  }, [])

  // 2. Notion path — fetch + poll + refresh on tab focus.
  useEffect(() => {
    if (!config) return
    let cancelled = false

    const runFetch = async () => {
      try {
        const tasks = await fetchNotionTasks(config, { limit: NOTION_TASK_LIMIT })
        if (cancelled) return
        const items = tasks.map(notionTaskToTodoItem)
        const map = new Map<string, string>()
        for (const t of tasks) map.set(t.pageId, t.url)
        notionUrlMapRef.current = map
        setTodos(items)
        setLastSyncedAt(Date.now())
        setNotionError(null)
      } catch (e) {
        if (cancelled) return
        setNotionError(e instanceof Error ? e.message : 'Failed to fetch Notion tasks')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    runFetch()
    const interval = window.setInterval(runFetch, POLL_INTERVAL_MS)
    const onFocus = () => runFetch()
    window.addEventListener('focus', onFocus)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [config])

  // 3. Firestore path — only when config has resolved to null AND user is in.
  useEffect(() => {
    if (config !== null || !userId) return
    let unsub: Unsubscribe | undefined
    let cancelled = false

    setIsLoading(true)
    ensureDefaultTodoList(userId).then((listId) => {
      if (cancelled) return
      setLocalListId(listId)
      unsub = subscribeTodos(userId, listId, (updated) => {
        setTodos(updated)
        setIsLoading(false)
      })
    })

    return () => {
      cancelled = true
      unsub?.()
    }
  }, [config, userId])

  const notionUrlFor = useCallback(
    (todoId: string) => notionUrlMapRef.current.get(todoId),
    []
  )

  const refreshNotion = useCallback(() => {
    if (!config) return
    fetchNotionTasks(config, { limit: NOTION_TASK_LIMIT })
      .then((tasks) => {
        const map = new Map<string, string>()
        for (const t of tasks) map.set(t.pageId, t.url)
        notionUrlMapRef.current = map
        setTodos(tasks.map(notionTaskToTodoItem))
        setLastSyncedAt(Date.now())
        setNotionError(null)
      })
      .catch((e) => {
        setNotionError(e instanceof Error ? e.message : 'Refresh failed')
      })
  }, [config])

  return {
    todos,
    isLoading,
    isNotionMode: !!config,
    lastSyncedAt,
    notionError,
    notionUrlFor,
    localListId,
    refreshNotion,
  }
}
