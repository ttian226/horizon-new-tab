// Notion API client for v0.1.4 Tasks integration.
//
// Talks directly to api.notion.com from the extension. host_permissions in
// manifest.json grants cross-origin access. Chrome's MV3 fetch in an
// extension context bypasses CORS once that permission is in place.
//
// API version 2022-06-28 (stable database query endpoint).
// Schema assumption matches Babe's existing SyncTasks DB (and the
// notion-tasks skill): Name (title) / Status (status) / Due date (date)
// + page-level icon emoji.

import { getLocal, setLocal, removeLocal, onLocalChange } from './extensionStorage'
import type { CloudTodoItem } from './firestore'

const CONFIG_KEY = 'horizon_notion_config'
const API_BASE = 'https://api.notion.com/v1'
const API_VERSION = '2022-06-28'

// User-tunable view, mirroring the approachable layer of SyncTask's "View"
// sheet (Shown-in-list toggles + Sort) — not its advanced filter builder.
// Only the two axes our DB exposes (Status + Due date) are configurable.
export interface NotionViewSettings {
  /** Show "Done" tasks (with strikethrough) vs. hide them. */
  showCompleted: boolean
  /** Show tasks whose Due date is before today. Undated tasks always show. */
  showOverdue: boolean
  /** Render the due-date label on each row (display-only, client-side). */
  showDates: boolean
  sortBy: 'due' | 'edited' | 'created'
  sortOrder: 'asc' | 'desc'
}

export const DEFAULT_VIEW_SETTINGS: NotionViewSettings = {
  showCompleted: true,
  showOverdue: true,
  showDates: true,
  sortBy: 'due',
  sortOrder: 'asc',
}

export interface NotionConfig {
  token: string
  databaseId: string
  /** Absent on configs saved before v0.1.4 — callers fall back to defaults. */
  view?: NotionViewSettings
}

// 2-state model aligned with SyncTask and the actual Notion Tasks DB:
// anything that's not literally "Done" is treated as "Not done".
export type NotionStatus = 'Not done' | 'Done'

export interface NotionTask {
  pageId: string
  title: string
  status: NotionStatus
  dueDate?: string // ISO 'YYYY-MM-DD'
  icon?: string
  lastEditedTime: string // ISO timestamp
  url: string
}

export interface ConnectionTestResult {
  ok: boolean
  error?: string
  taskCount?: number
}

// ============ Config persistence ============

export async function loadConfig(): Promise<NotionConfig | null> {
  const config = await getLocal<NotionConfig>(CONFIG_KEY)
  if (!config || !config.token || !config.databaseId) return null
  return config
}

export async function saveConfig(config: NotionConfig): Promise<void> {
  await setLocal(CONFIG_KEY, config)
}

export async function clearConfig(): Promise<void> {
  await removeLocal(CONFIG_KEY)
}

/** Fire `cb` whenever the saved config changes (e.g. Settings save/disconnect
 *  or a view-toggle), so an open new-tab page can re-fetch live. */
export function onConfigChange(cb: () => void): () => void {
  return onLocalChange(CONFIG_KEY, cb)
}

// ============ API calls ============

interface NotionPage {
  id: string
  icon: { type: 'emoji'; emoji: string } | { type: 'external'; external: { url: string } } | null
  last_edited_time: string
  url: string
  properties: Record<string, NotionPropertyValue>
}

type NotionPropertyValue =
  | { type: 'title'; title: Array<{ plain_text: string }> }
  | { type: 'status'; status: { name: string } | null }
  | { type: 'date'; date: { start: string } | null }
  | { type: string; [key: string]: unknown }

interface NotionQueryResponse {
  results: NotionPage[]
  has_more: boolean
  next_cursor: string | null
}

interface NotionErrorResponse {
  object: 'error'
  status: number
  code: string
  message: string
}

function buildHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Notion-Version': API_VERSION,
    'Content-Type': 'application/json',
  }
}

// Extract title text from a "title" property (handles multi-segment rich text)
function extractTitle(prop: NotionPropertyValue | undefined): string {
  if (!prop || prop.type !== 'title') return ''
  return (prop as Extract<NotionPropertyValue, { type: 'title' }>).title
    .map((seg) => seg.plain_text)
    .join('')
}

function extractStatus(prop: NotionPropertyValue | undefined): NotionStatus {
  if (!prop || prop.type !== 'status') return 'Not done'
  const name = (prop as Extract<NotionPropertyValue, { type: 'status' }>).status?.name
  return name === 'Done' ? 'Done' : 'Not done'
}

function extractDate(prop: NotionPropertyValue | undefined): string | undefined {
  if (!prop || prop.type !== 'date') return undefined
  const date = (prop as Extract<NotionPropertyValue, { type: 'date' }>).date
  return date?.start
}

function extractIcon(icon: NotionPage['icon']): string | undefined {
  if (icon && icon.type === 'emoji') return icon.emoji
  return undefined
}

function pageToTask(page: NotionPage): NotionTask {
  return {
    pageId: page.id,
    title: extractTitle(page.properties['Name']),
    status: extractStatus(page.properties['Status']),
    dueDate: extractDate(page.properties['Due date']),
    icon: extractIcon(page.icon),
    lastEditedTime: page.last_edited_time,
    url: page.url,
  }
}

/** Verify token + database access. Reads at most 1 task so it's cheap. */
export async function testConnection(config: NotionConfig): Promise<ConnectionTestResult> {
  try {
    const response = await fetch(`${API_BASE}/databases/${config.databaseId}/query`, {
      method: 'POST',
      headers: buildHeaders(config.token),
      body: JSON.stringify({ page_size: 1 }),
    })

    if (!response.ok) {
      const err = (await response.json().catch(() => null)) as NotionErrorResponse | null
      return {
        ok: false,
        error: err?.message || `HTTP ${response.status}`,
      }
    }

    const data = (await response.json()) as NotionQueryResponse
    return { ok: true, taskCount: data.results.length }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Network error',
    }
  }
}

export interface FetchTasksOptions {
  /** Hard cap on results returned. Default 100 (one page). */
  limit?: number
}

function buildSorts(view: NotionViewSettings) {
  const direction = view.sortOrder === 'asc' ? 'ascending' : 'descending'
  switch (view.sortBy) {
    case 'due':
      return [{ property: 'Due date', direction }]
    case 'created':
      return [{ timestamp: 'created_time', direction }]
    case 'edited':
    default:
      return [{ timestamp: 'last_edited_time', direction }]
  }
}

// Compose the Notion query filter from the view toggles. Done server-side so
// the page-size cap applies to the *filtered* set (we don't waste the 50-row
// budget on tasks that get dropped client-side).
function buildFilter(view: NotionViewSettings): Record<string, unknown> | undefined {
  const and: Record<string, unknown>[] = []
  if (!view.showCompleted) {
    and.push({ property: 'Status', status: { does_not_equal: 'Done' } })
  }
  if (!view.showOverdue) {
    // Keep today/future AND undated (undated isn't "overdue"); drop only past.
    and.push({
      or: [
        { property: 'Due date', date: { on_or_after: todayISO() } },
        { property: 'Due date', date: { is_empty: true } },
      ],
    })
  }
  if (and.length === 0) return undefined
  if (and.length === 1) return and[0]
  return { and }
}

/** Fetch tasks from the configured Notion database, applying the saved view's
 *  filter + sort (defaults when the config predates v0.1.4). */
export async function fetchTasks(
  config: NotionConfig,
  options: FetchTasksOptions = {}
): Promise<NotionTask[]> {
  const { limit = 100 } = options
  const view = config.view ?? DEFAULT_VIEW_SETTINGS

  const body: Record<string, unknown> = {
    page_size: Math.min(limit, 100),
    sorts: buildSorts(view),
  }

  const filter = buildFilter(view)
  if (filter) body.filter = filter

  const response = await fetch(`${API_BASE}/databases/${config.databaseId}/query`, {
    method: 'POST',
    headers: buildHeaders(config.token),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = (await response.json().catch(() => null)) as NotionErrorResponse | null
    throw new Error(err?.message || `Notion API error: HTTP ${response.status}`)
  }

  const data = (await response.json()) as NotionQueryResponse
  return data.results.map(pageToTask)
}

// ============ Write paths (M2) ============

/** Toggle the Status property of a Notion page between Done and Not done. */
export async function updateTaskStatus(
  config: NotionConfig,
  pageId: string,
  completed: boolean
): Promise<void> {
  const response = await fetch(`${API_BASE}/pages/${pageId}`, {
    method: 'PATCH',
    headers: buildHeaders(config.token),
    body: JSON.stringify({
      properties: {
        Status: {
          status: { name: completed ? 'Done' : 'Not done' },
        },
      },
    }),
  })
  if (!response.ok) {
    const err = (await response.json().catch(() => null)) as NotionErrorResponse | null
    throw new Error(err?.message || `Notion API error: HTTP ${response.status}`)
  }
}

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Create a new task page in the configured database. Status defaults to
 *  "Not done"; Due date defaults to today (matches SyncTask iOS behaviour
 *  so tasks created from either client land in the same "today" bucket). */
export async function createTask(
  config: NotionConfig,
  text: string
): Promise<NotionTask> {
  const response = await fetch(`${API_BASE}/pages`, {
    method: 'POST',
    headers: buildHeaders(config.token),
    body: JSON.stringify({
      parent: { database_id: config.databaseId },
      properties: {
        Name: {
          title: [{ text: { content: text } }],
        },
        Status: {
          status: { name: 'Not done' },
        },
        'Due date': {
          date: { start: todayISO() },
        },
      },
    }),
  })
  if (!response.ok) {
    const err = (await response.json().catch(() => null)) as NotionErrorResponse | null
    throw new Error(err?.message || `Notion API error: HTTP ${response.status}`)
  }
  const page = (await response.json()) as NotionPage
  return pageToTask(page)
}

// ============ Page body (note) — M1 read / M2 write ============

interface RichTextSpan {
  plain_text: string
}

interface NotionBlock {
  id: string
  type: string
  paragraph?: { rich_text: RichTextSpan[] }
  [key: string]: unknown
}

interface NotionBlocksResponse {
  results: NotionBlock[]
  has_more: boolean
  next_cursor: string | null
}

export interface PageContent {
  /** Plain text of the page body — paragraphs joined by newlines. */
  text: string
  /** True when the body is empty or only paragraph blocks, so the extension
   *  can safely overwrite it (M2). Any rich block → read-only to avoid
   *  clobbering images / lists / tables / toggles. */
  editable: boolean
}

function blockText(block: NotionBlock): string {
  if (block.type === 'paragraph') {
    return (block.paragraph?.rich_text ?? []).map((t) => t.plain_text).join('')
  }
  // Other block types still carry rich_text we can show read-only.
  const inner = block[block.type] as { rich_text?: RichTextSpan[] } | undefined
  return (inner?.rich_text ?? []).map((t) => t.plain_text).join('')
}

/** Read a task page's body as plain text. `editable` is false when the body
 *  holds anything other than paragraphs (so M2 won't rewrite it). */
export async function fetchPageContent(
  config: NotionConfig,
  pageId: string
): Promise<PageContent> {
  const response = await fetch(`${API_BASE}/blocks/${pageId}/children?page_size=100`, {
    method: 'GET',
    headers: buildHeaders(config.token),
  })
  if (!response.ok) {
    const err = (await response.json().catch(() => null)) as NotionErrorResponse | null
    throw new Error(err?.message || `Notion API error: HTTP ${response.status}`)
  }
  const data = (await response.json()) as NotionBlocksResponse
  const lines = data.results.map(blockText)
  const editable = data.results.every((b) => b.type === 'paragraph')
  return { text: lines.join('\n'), editable }
}

/** Overwrite a task page's body with plain-text paragraphs. Only safe when the
 *  body is paragraphs-only — re-checked here, throwing otherwise, so rich
 *  content (images / lists / tables / toggles) is never destroyed. */
export async function updatePageContent(
  config: NotionConfig,
  pageId: string,
  text: string
): Promise<void> {
  const headers = buildHeaders(config.token)
  const readRes = await fetch(`${API_BASE}/blocks/${pageId}/children?page_size=100`, { headers })
  if (!readRes.ok) {
    const err = (await readRes.json().catch(() => null)) as NotionErrorResponse | null
    throw new Error(err?.message || `Notion API error: HTTP ${readRes.status}`)
  }
  const data = (await readRes.json()) as NotionBlocksResponse
  if (!data.results.every((b) => b.type === 'paragraph')) {
    throw new Error('This note has rich content — edit it in Notion.')
  }

  // Remove the old paragraphs, then append the new text as paragraphs.
  for (const b of data.results) {
    const del = await fetch(`${API_BASE}/blocks/${b.id}`, { method: 'DELETE', headers })
    if (!del.ok) {
      const err = (await del.json().catch(() => null)) as NotionErrorResponse | null
      throw new Error(err?.message || `Notion API error: HTTP ${del.status}`)
    }
  }

  const children =
    text === ''
      ? []
      : text.split('\n').map((line) => ({
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: line ? [{ type: 'text', text: { content: line } }] : [] },
        }))
  if (children.length === 0) return

  const appendRes = await fetch(`${API_BASE}/blocks/${pageId}/children`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ children }),
  })
  if (!appendRes.ok) {
    const err = (await appendRes.json().catch(() => null)) as NotionErrorResponse | null
    throw new Error(err?.message || `Notion API error: HTTP ${appendRes.status}`)
  }
}

// ============ Adapter ============

// Adapter: shape a NotionTask into CloudTodoItem so the UI renders both
// sources through a single component path. The Notion page URL is kept on
// the item so the click handler can jump to Notion when explicitly asked.
export function notionTaskToTodoItem(task: NotionTask): CloudTodoItem & { notionUrl: string } {
  const editedAt = new Date(task.lastEditedTime)
  return {
    id: task.pageId,
    text: task.title,
    completed: task.status === 'Done',
    listId: 'notion', // synthetic, never persisted
    notionPageId: task.pageId,
    notionUrl: task.url,
    icon: task.icon,
    dueDate: task.dueDate,
    lastSyncedAt: Date.now(),
    createdAt: editedAt,
    updatedAt: editedAt,
  }
}
