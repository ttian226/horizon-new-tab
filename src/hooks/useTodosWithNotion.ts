import { useCallback, useEffect, useRef, useState } from 'react'
import type { Unsubscribe } from 'firebase/firestore'
import {
  CloudTodoItem,
  subscribeTodos,
  ensureDefaultTodoList,
} from '../services/firestore'
import {
  loadConfig as loadNotionConfig,
  onConfigChange as onNotionConfigChange,
  fetchTasks as fetchNotionTasks,
  updateTaskStatus as updateNotionTaskStatus,
  createTask as createNotionTask,
  notionTaskToTodoItem,
  DEFAULT_VIEW_SETTINGS,
  type NotionConfig,
  type NotionViewSettings,
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
  /** Toggle done state for a Notion-sourced todo. No-op in local mode (the
   *  component should call toggleTodo from firestore.ts directly there). */
  setNotionTaskDone: (todoId: string, completed: boolean) => Promise<void>
  /** Add a new task into the configured Notion database. */
  addNotionTask: (text: string) => Promise<void>
  /** Resolved view settings (defaults outside Notion mode). The UI reads
   *  `showDates` from here; filter/sort are already applied at fetch time. */
  viewSettings: NotionViewSettings
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

  // 1. Load Notion config on mount, and re-load whenever Settings changes it
  //    (save / disconnect / view-toggle) so the open page updates live.
  useEffect(() => {
    loadNotionConfig().then((c) => setConfig(c))
    const unsub = onNotionConfigChange(() => {
      loadNotionConfig().then((c) => setConfig(c))
    })
    return unsub
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

  // Toggle done with optimistic update + rollback on Notion API failure.
  // Caller passes the new value (true = mark done).
  const setNotionTaskDone = useCallback(
    async (todoId: string, completed: boolean) => {
      if (!config) return
      // Snapshot for rollback
      const prev = todos
      setTodos((curr) => curr.map((t) => (t.id === todoId ? { ...t, completed } : t)))
      try {
        await updateNotionTaskStatus(config, todoId, completed)
      } catch (e) {
        // Roll back to pre-toggle state
        setTodos(prev)
        setNotionError(e instanceof Error ? e.message : 'Notion update failed')
        throw e
      }
    },
    [config, todos]
  )

  // Add a new task to Notion. Optimistic placeholder inserted at top until
  // the real page is returned; on failure the placeholder is removed.
  // Due date defaults to today to match SyncTask iOS — the createTask call
  // sets it on Notion's side, and we mirror that here so the "Today" label
  // shows immediately in the UI without waiting for the refetch.
  const addNotionTask = useCallback(
    async (text: string) => {
      if (!config) return
      const tempId = `notion-temp-${Date.now()}`
      const now = new Date()
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const placeholder: CloudTodoItem = {
        id: tempId,
        text,
        completed: false,
        listId: 'notion',
        notionPageId: tempId,
        dueDate: today,
        lastSyncedAt: Date.now(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setTodos((curr) => [placeholder, ...curr])
      try {
        const created = await createNotionTask(config, text)
        const realItem = notionTaskToTodoItem(created)
        notionUrlMapRef.current.set(created.pageId, created.url)
        // Replace placeholder with the real page
        setTodos((curr) => curr.map((t) => (t.id === tempId ? realItem : t)))
        setNotionError(null)
      } catch (e) {
        setTodos((curr) => curr.filter((t) => t.id !== tempId))
        setNotionError(e instanceof Error ? e.message : 'Notion create failed')
        throw e
      }
    },
    [config]
  )

  return {
    todos,
    isLoading,
    isNotionMode: !!config,
    lastSyncedAt,
    notionError,
    notionUrlFor,
    localListId,
    refreshNotion,
    setNotionTaskDone,
    addNotionTask,
    viewSettings: config?.view ?? DEFAULT_VIEW_SETTINGS,
  }
}
