import { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2, Pin } from 'lucide-react'
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

interface TodoAppProps {
  userId: string
  isOpen: boolean
  isPinned: boolean
  onToggle: () => void
  onPinToggle: (pinned: boolean) => void
}

export default function TodoApp({ userId, isOpen, isPinned, onToggle, onPinToggle }: TodoAppProps) {
  if (!isOpen) return null
  // Body lives in a child so the hook only runs while the panel is mounted.
  return (
    <TodoAppBody
      userId={userId}
      isPinned={isPinned}
      onToggle={onToggle}
      onPinToggle={onPinToggle}
    />
  )
}

function TodoAppBody({
  userId,
  isPinned,
  onToggle,
  onPinToggle,
}: Omit<TodoAppProps, 'isOpen'>) {
  const {
    todos,
    isLoading,
    isNotionMode,
    lastSyncedAt,
    notionError,
    notionUrlFor,
    localListId,
  } = useTodosWithNotion(userId)

  const [newTodoText, setNewTodoText] = useState('')
  const [optimistic, setOptimistic] = useState<CloudTodoItem[]>([])
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close panel when clicking outside (only if not pinned)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        if (!isPinned) {
          onToggle()
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isPinned, onToggle])

  const mergedTodos = isNotionMode ? todos : [...optimistic, ...todos]
  const incompleteTodos = mergedTodos.filter((t) => !t.completed)
  const completedTodos = mergedTodos.filter((t) => t.completed)

  const handleAddTodo = async () => {
    const text = newTodoText.trim()
    if (!text || mergedTodos.length >= MAX_TODO_COUNT || !localListId) return

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

  const handleRowClick = (todo: CloudTodoItem) => {
    if (isNotionMode) {
      const url = notionUrlFor(todo.id)
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    handleToggleTodo(todo.id, todo.completed)
  }

  const handleClose = () => {
    if (isPinned) onPinToggle(false)
    onToggle()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddTodo()
  }

  return (
    <div
      ref={panelRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`absolute bottom-14 left-0 w-[400px] max-h-[500px] bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-modal-content transition-opacity duration-300 ${
        isPinned && !isHovered ? 'opacity-60' : 'opacity-100'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <h3 className="text-sm font-medium text-white/90 tracking-wide">Today's Tasks</h3>
        <div className="flex items-center gap-2">
          {!isNotionMode && completedTodos.length > 0 && (
            <button
              onClick={handleClearCompleted}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Clear done
            </button>
          )}
          <button
            onClick={() => onPinToggle(!isPinned)}
            className={`transition-colors ${
              isPinned ? 'text-blue-400 hover:text-blue-300' : 'text-white/40 hover:text-white'
            }`}
            title={isPinned ? 'Unpin panel' : 'Pin panel'}
          >
            <Pin size={16} className={isPinned ? 'fill-current' : ''} />
          </button>
          <button
            onClick={handleClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Notion sync status — shown only when Notion is the data source */}
      {isNotionMode && (
        <div className="px-4 py-1.5 border-b border-white/5 text-[10px] text-white/40">
          {notionError ? (
            <span className="text-red-400">Notion: {notionError}</span>
          ) : (
            <>Synced from Notion · {formatSyncedAgo(lastSyncedAt) || '…'}</>
          )}
        </div>
      )}

      {/* Todo list */}
      <div className="overflow-y-auto max-h-60 p-2">
        {isLoading ? (
          <div className="space-y-1 p-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2.5 pl-3 pr-8 py-2 animate-pulse">
                <div className="w-4 h-4 rounded-[3px] bg-white/10 shrink-0" />
                <div className="h-4 bg-white/10 rounded w-full" style={{ width: `${65 + i * 10}%` }} />
              </div>
            ))}
          </div>
        ) : mergedTodos.length === 0 ? (
          <div className="text-center py-8 text-white/40 text-sm">
            {isNotionMode ? 'No tasks in Notion' : 'No tasks for today, enjoy!'}
          </div>
        ) : (
          <div className="space-y-1">
            {incompleteTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                isNotionMode={isNotionMode}
                onClick={() => handleRowClick(todo)}
                onDelete={isNotionMode ? undefined : () => handleDeleteTodo(todo.id)}
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
                onClick={() => handleRowClick(todo)}
                onDelete={isNotionMode ? undefined : () => handleDeleteTodo(todo.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input — local mode only. Notion mode shows a hint. */}
      {!isNotionMode ? (
        <div className="p-3 border-t border-white/5">
          {mergedTodos.length >= MAX_TODO_COUNT ? (
            <div className="text-center text-xs text-white/30 py-1">
              Limit reached ({MAX_TODO_COUNT} tasks). Complete or delete some tasks.
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
              <Plus size={16} className="text-white/40" />
              <input
                ref={inputRef}
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a task..."
                maxLength={MAX_TODO_TEXT_LENGTH}
                className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 border-t border-white/5 text-center text-[11px] text-white/30">
          Add and edit tasks in Notion
        </div>
      )}
    </div>
  )
}

interface TodoItemProps {
  todo: CloudTodoItem
  isNotionMode: boolean
  onClick: () => void
  onDelete?: () => void
}

function TodoItem({ todo, isNotionMode, onClick, onDelete }: TodoItemProps) {
  const [showDelete, setShowDelete] = useState(false)
  const due = todo.dueDate ? formatDueDate(todo.dueDate) : null

  return (
    <div
      className="group relative flex items-start gap-2.5 pl-3 pr-8 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      onClick={onClick}
      title={isNotionMode ? 'Open in Notion' : undefined}
    >
      {todo.icon && (
        <span className="shrink-0 text-base leading-snug" aria-hidden>
          {todo.icon}
        </span>
      )}

      <span
        className={`flex-1 text-sm leading-snug break-words line-clamp-2 transition-all ${
          todo.completed ? 'text-white/30 line-through' : 'text-white/80'
        }`}
        title={todo.text}
      >
        {todo.text}
      </span>

      {due && (
        <span
          className={`shrink-0 mt-0.5 text-[10px] font-mono tabular-nums ${
            due.isPast && !todo.completed ? 'text-red-400' : 'text-white/40'
          }`}
        >
          {due.label}
        </span>
      )}

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className={`absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-red-400 transition-all ${
            showDelete ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}
