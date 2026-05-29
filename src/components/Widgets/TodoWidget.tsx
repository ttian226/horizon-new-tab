import { useState, useEffect } from 'react'
import { ListTodo, Plus, Trash2, ExternalLink, Pin } from 'lucide-react'
import GlassCard from './GlassCard'
import {
  pinTask,
  unpinTask,
  loadStickies,
  onStickiesChange,
  type StickyColor,
} from '../../services/stickyNotes'
import {
  CloudTodoItem,
  addTodo,
  toggleTodo,
  deleteTodo,
  clearCompletedTodos,
} from '../../services/firestore'
import { formatDueDate, formatSyncedAgo } from '../../utils/formatDate'
import { useTodosWithNotion } from '../../hooks/useTodosWithNotion'

const MAX_TODO_TEXT_LENGTH = 100
const MAX_TODO_COUNT = 20

// Pin-icon color per sticky color — links the list row to its board sticky.
const PIN_COLOR: Record<StickyColor, string> = {
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  sky: 'text-sky-400',
  violet: 'text-violet-400',
  emerald: 'text-emerald-400',
}

interface TodoWidgetProps {
  userId: string
  onClose?: () => void
}

export default function TodoWidget({ userId, onClose }: TodoWidgetProps) {
  const {
    todos,
    isLoading,
    isNotionMode,
    lastSyncedAt,
    notionError,
    notionUrlFor,
    localListId,
    setNotionTaskDone,
    addNotionTask,
    viewSettings,
  } = useTodosWithNotion(userId)

  const [newTodoText, setNewTodoText] = useState('')
  // Optimistic todos that haven't shown up in subscribeTodos yet — kept
  // separately so they merge with the hook's list without races. Only used
  // in local (non-Notion) mode.
  const [optimistic, setOptimistic] = useState<CloudTodoItem[]>([])
  // Pinned page id → sticky color, to mirror pinned state (and color) in the list.
  const [pinnedColors, setPinnedColors] = useState<Map<string, StickyColor>>(new Map())

  useEffect(() => {
    const refresh = () =>
      loadStickies().then((list) =>
        setPinnedColors(new Map(list.filter((s) => s.pinned).map((s) => [s.pageId, s.color])))
      )
    refresh()
    return onStickiesChange(refresh)
  }, [])

  // Drop optimistic placeholders once the real Firestore doc (matched by text)
  // has arrived, so a freshly added task doesn't render twice during the gap
  // between the snapshot echo and the write confirmation that clears `optimistic`.
  const realTexts = new Set(todos.map((t) => t.text))
  const pendingOptimistic = optimistic.filter((t) => !realTexts.has(t.text))
  const mergedTodos = isNotionMode ? todos : [...pendingOptimistic, ...todos]
  const incompleteTodos = mergedTodos.filter((t) => !t.completed)
  const completedTodos = mergedTodos.filter((t) => t.completed)

  const handleAddTodo = async () => {
    const text = newTodoText.trim()
    if (!text || mergedTodos.length >= MAX_TODO_COUNT) return

    if (isNotionMode) {
      setNewTodoText('')
      try {
        await addNotionTask(text.slice(0, MAX_TODO_TEXT_LENGTH))
      } catch (error) {
        console.error('Failed to add Notion task:', error)
      }
      return
    }

    if (!localListId) return
    const placeholder: CloudTodoItem = {
      id: `temp-${Date.now()}`,
      text: text.slice(0, MAX_TODO_TEXT_LENGTH),
      completed: false,
      listId: localListId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setOptimistic((prev) => [placeholder, ...prev])
    setNewTodoText('')

    try {
      await addTodo(userId, placeholder.text, localListId)
    } catch (error) {
      console.error('Failed to add todo:', error)
    } finally {
      setOptimistic((prev) => prev.filter((t) => t.id !== placeholder.id))
    }
  }

  const handleToggleTodo = async (todoId: string, currentCompleted: boolean) => {
    try {
      await toggleTodo(userId, todoId, !currentCompleted)
    } catch (error) {
      console.error('Failed to toggle todo:', error)
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await deleteTodo(userId, todoId)
    } catch (error) {
      console.error('Failed to delete todo:', error)
    }
  }

  const handleClearCompleted = async () => {
    if (!localListId) return
    try {
      await clearCompletedTodos(userId, localListId)
    } catch (error) {
      console.error('Failed to clear completed todos:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddTodo()
  }

  // Per-row click: both modes toggle done. Notion mode pushes via API
  // (hook does optimistic update + rollback on failure). The hover
  // ExternalLink button is how users still jump to the Notion page.
  const handleRowClick = async (todo: CloudTodoItem) => {
    if (isNotionMode) {
      try {
        await setNotionTaskDone(todo.id, !todo.completed)
      } catch (error) {
        console.error('Failed to toggle Notion task:', error)
      }
      return
    }
    handleToggleTodo(todo.id, todo.completed)
  }

  const handleOpenInNotion = (todoId: string) => {
    const url = notionUrlFor(todoId)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Toggle a task on the work-mode sticky board (its note = the task's page body).
  const handleTogglePin = async (todo: CloudTodoItem) => {
    if (pinnedColors.has(todo.id)) {
      await unpinTask(todo.id)
      return
    }
    const ok = await pinTask({
      pageId: todo.id,
      title: todo.text,
      icon: todo.icon,
      dueDate: todo.dueDate,
      completed: todo.completed,
    })
    if (!ok) console.warn('Sticky note limit reached')
  }

  return (
    <GlassCard
      id="todo"
      title="Today's Tasks"
      icon={ListTodo}
      onClose={onClose}
      defaultWidth={320}
      defaultHeight={380}
      className="font-task"
    >
      {/* Source badge — shown only when Notion is the data source */}
      {isNotionMode && (
        <div className="flex items-center justify-between -mx-4 px-4 pb-2 -mt-1 text-[10px] text-white/40">
          <span>
            {notionError
              ? <span className="text-red-400">Notion: {notionError}</span>
              : <>Synced from Notion · {formatSyncedAgo(lastSyncedAt) || '…'}</>}
          </span>
        </div>
      )}

      {/* Todo list */}
      <div className="flex-1 overflow-y-auto -mx-4 px-4 min-h-0">
        {isLoading ? (
          <div className="space-y-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-1.5 animate-pulse">
                <div className="w-4 h-4 rounded-[3px] bg-white/10 shrink-0" />
                <div className="h-4 bg-white/10 rounded" style={{ width: `${60 + i * 10}%` }} />
              </div>
            ))}
          </div>
        ) : mergedTodos.length === 0 ? (
          <div className="text-center py-4 text-white/40 text-sm">
            {isNotionMode ? 'No tasks in Notion' : 'No tasks for today'}
          </div>
        ) : (
          <div className="space-y-1">
            {incompleteTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                isNotionMode={isNotionMode}
                showDates={viewSettings.showDates}
                onClick={() => handleRowClick(todo)}
                onDelete={isNotionMode ? undefined : () => handleDeleteTodo(todo.id)}
                onOpenInNotion={isNotionMode ? () => handleOpenInNotion(todo.id) : undefined}
                onPin={isNotionMode ? () => handleTogglePin(todo) : undefined}
                isPinned={pinnedColors.has(todo.id)}
                pinColor={pinnedColors.get(todo.id)}
              />
            ))}
            {completedTodos.length > 0 && incompleteTodos.length > 0 && (
              <div className="h-px w-full bg-white/5 my-2" />
            )}
            {completedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                isNotionMode={isNotionMode}
                showDates={viewSettings.showDates}
                onClick={() => handleRowClick(todo)}
                onDelete={isNotionMode ? undefined : () => handleDeleteTodo(todo.id)}
                onOpenInNotion={isNotionMode ? () => handleOpenInNotion(todo.id) : undefined}
                onPin={isNotionMode ? () => handleTogglePin(todo) : undefined}
                isPinned={pinnedColors.has(todo.id)}
                pinColor={pinnedColors.get(todo.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Clear-completed — local mode only */}
      {!isNotionMode && completedTodos.length > 0 && (
        <div className="-mx-4 px-4 pt-2 border-t border-white/5 flex-shrink-0">
          <button
            onClick={handleClearCompleted}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Clear completed
          </button>
        </div>
      )}

      {/* Input — same UI in both modes; placeholder hints destination. */}
      <div className="-mx-4 px-4 pt-3 mt-auto border-t border-white/5 flex-shrink-0">
        {mergedTodos.length >= MAX_TODO_COUNT ? (
          <div className="text-center text-xs text-white/30 py-1">
            Limit reached ({MAX_TODO_COUNT} tasks)
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
            <Plus size={16} className="text-white/40" />
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isNotionMode ? 'Add a task to Notion…' : 'Add a task...'}
              maxLength={MAX_TODO_TEXT_LENGTH}
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
            />
          </div>
        )}
      </div>
    </GlassCard>
  )
}

interface TodoItemProps {
  todo: CloudTodoItem
  isNotionMode: boolean
  showDates: boolean
  onClick: () => void
  onDelete?: () => void
  onOpenInNotion?: () => void
  onPin?: () => void
  isPinned?: boolean
  pinColor?: StickyColor
}

function TodoItem({ todo, isNotionMode, showDates, onClick, onDelete, onOpenInNotion, onPin, isPinned, pinColor }: TodoItemProps) {
  const [isHover, setIsHover] = useState(false)
  const due = showDates && todo.dueDate ? formatDueDate(todo.dueDate) : null

  return (
    <div
      className="group relative flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      onClick={onClick}
      title={isNotionMode ? 'Click to toggle done' : undefined}
    >
      {todo.icon && (
        <span className="shrink-0 text-base leading-none" aria-hidden>
          {todo.icon}
        </span>
      )}

      <span
        className={`flex-1 text-sm truncate transition-all ${
          todo.completed ? 'text-white/30 line-through' : 'text-white/80'
        }`}
      >
        {todo.text}
      </span>

      {due && (
        <span
          className={`shrink-0 text-[10px] font-mono tabular-nums ${
            due.isPast && !todo.completed ? 'text-red-400' : 'text-white/40'
          }`}
        >
          {due.label}
        </span>
      )}

      <div className="flex items-center gap-1.5 shrink-0">
        {onPin && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPin()
            }}
            title={isPinned ? 'Pinned · click to unpin' : 'Pin as sticky note'}
            className={`transition-all ${
              isPinned
                ? `opacity-100 ${PIN_COLOR[pinColor ?? 'amber']}`
                : `text-white/30 hover:text-white/70 ${isHover ? 'opacity-100' : 'opacity-0'}`
            }`}
          >
            <Pin size={12} className={isPinned ? 'fill-current' : ''} />
          </button>
        )}
        {onOpenInNotion && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onOpenInNotion()
            }}
            title="Open in Notion"
            className={`text-white/30 hover:text-white/80 transition-all ${
              isHover ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <ExternalLink size={12} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            title="Delete"
            className={`text-white/30 hover:text-red-400 transition-all ${
              isHover ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  )
}
