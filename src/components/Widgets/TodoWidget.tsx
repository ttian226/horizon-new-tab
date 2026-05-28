import { useState } from 'react'
import { ListTodo, Plus, Trash2, ExternalLink } from 'lucide-react'
import GlassCard from './GlassCard'
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

  const mergedTodos = isNotionMode ? todos : [...optimistic, ...todos]
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

  return (
    <GlassCard
      id="todo"
      title="Today's Tasks"
      icon={ListTodo}
      onClose={onClose}
      defaultWidth={320}
      defaultHeight={380}
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
}

function TodoItem({ todo, isNotionMode, showDates, onClick, onDelete, onOpenInNotion }: TodoItemProps) {
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

      {onOpenInNotion ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onOpenInNotion()
          }}
          title="Open in Notion"
          className={`shrink-0 text-white/30 hover:text-white/80 transition-all ${
            isHover ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <ExternalLink size={12} />
        </button>
      ) : onDelete ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className={`shrink-0 text-white/30 hover:text-red-400 transition-all ${
            isHover ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Trash2 size={12} />
        </button>
      ) : null}
    </div>
  )
}
