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

import { getLocal, setLocal, removeLocal } from './extensionStorage'

const CONFIG_KEY = 'horizon_notion_config'
const API_BASE = 'https://api.notion.com/v1'
const API_VERSION = '2022-06-28'

export interface NotionConfig {
  token: string
  databaseId: string
}

export type NotionStatus = 'Not done' | 'Doing' | 'Done'

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
  const status = (prop as Extract<NotionPropertyValue, { type: 'status' }>).status
  const name = status?.name
  if (name === 'Doing' || name === 'Done') return name
  return 'Not done'
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
  /** When true, omit "Done" tasks from result. Default false. */
  excludeDone?: boolean
  /** Hard cap on results returned. Default 100 (one page). */
  limit?: number
}

/** Fetch tasks from the configured Notion database. */
export async function fetchTasks(
  config: NotionConfig,
  options: FetchTasksOptions = {}
): Promise<NotionTask[]> {
  const { excludeDone = false, limit = 100 } = options

  const body: Record<string, unknown> = {
    page_size: Math.min(limit, 100),
    sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
  }

  if (excludeDone) {
    body.filter = {
      property: 'Status',
      status: { does_not_equal: 'Done' },
    }
  }

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
