import { useState, useEffect, useRef } from 'react'
import { X, Plus, Check, Trash2 } from 'lucide-react'
import {
  CloudTodoItem,
  subscribeTodos,
  addTodo,
  toggleTodo,
  deleteTodo,
  clearCompletedTodos,
  ensureDefaultTodoList,
} from '../../services/firestore'

// Constants for limits
const MAX_TODO_TEXT_LENGTH = 100
const MAX_TODO_COUNT = 20
const DEFAULT_TODO_LIST_ID = 'today'

interface TodoAppProps {
  userId: string
  isOpen: boolean
  onToggle: () => void
}

export default function TodoApp({ userId, isOpen, onToggle }: TodoAppProps) {
  const [todos, setTodos] = useState<CloudTodoItem[]>([])
  const [newTodoText, setNewTodoText] = useState('')
  const [loading, setLoading] = useState(true)
  const [listId, setListId] = useState<string>(DEFAULT_TODO_LIST_ID)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Ensure default list exists and subscribe to todos - LAZY LOADING: only when panel is open
  useEffect(() => {
    if (!userId || !isOpen) return

    setLoading(true)

    // Ensure default "Today" list exists
    ensureDefaultTodoList(userId).then((defaultListId) => {
      setListId(defaultListId)

      // Subscribe to todos for this list
      const unsubscribe = subscribeTodos(userId, defaultListId, (updatedTodos) => {
        setTodos(updatedTodos)
        setLoading(false)
      })

      return () => unsubscribe()
    })
  }, [userId, isOpen])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onToggle()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onToggle])

  const handleAddTodo = async () => {
    const text = newTodoText.trim()
    if (!text) return

    // Check todo count limit
    if (todos.length >= MAX_TODO_COUNT) {
      console.warn('Todo limit reached')
      return
    }

    // Optimistic update: Add todo locally first for instant feedback
    const optimisticTodo: CloudTodoItem = {
      id: `temp-${Date.now()}`, // Temporary ID
      text: text.slice(0, MAX_TODO_TEXT_LENGTH),
      completed: false,
      listId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Update UI immediately
    setTodos((prev) => [optimisticTodo, ...prev])
    setNewTodoText('')

    // Then sync to Firestore in background
    try {
      const realId = await addTodo(userId, text.slice(0, MAX_TODO_TEXT_LENGTH), listId)
      // Update the optimistic todo with real ID
      setTodos((prev) =>
        prev.map((todo) => (todo.id === optimisticTodo.id ? { ...todo, id: realId } : todo))
      )
    } catch (error) {
      console.error('Failed to add todo:', error)
      // Rollback on error: remove the optimistic todo
      setTodos((prev) => prev.filter((todo) => todo.id !== optimisticTodo.id))
    }
  }

  const handleClearCompleted = async () => {
    try {
      await clearCompletedTodos(userId, listId)
    } catch (error) {
      console.error('Failed to clear completed todos:', error)
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTodo()
    }
  }

  const incompleteTodos = todos.filter((t) => !t.completed)
  const completedTodos = todos.filter((t) => t.completed)

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      className="absolute bottom-8 left-0 w-80 max-h-96 bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-modal-content"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <h3 className="text-sm font-medium text-white/90 tracking-wide">
          Today's Tasks
        </h3>
        <div className="flex items-center gap-2">
          {completedTodos.length > 0 && (
            <button
              onClick={handleClearCompleted}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Clear done
            </button>
          )}
          <button
            onClick={onToggle}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Todo List */}
      <div className="overflow-y-auto max-h-60 p-2">
        {loading ? (
          <div className="text-center py-8 text-white/40 text-sm">
            Loading...
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center py-8 text-white/40 text-sm">
            No tasks for today, enjoy!
          </div>
        ) : (
          <div className="space-y-1">
            {/* Incomplete todos */}
            {incompleteTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={() => handleToggleTodo(todo.id, todo.completed)}
                onDelete={() => handleDeleteTodo(todo.id)}
              />
            ))}

            {/* Completed todos */}
            {completedTodos.length > 0 && incompleteTodos.length > 0 && (
              <div className="h-px w-full bg-white/5 my-2" />
            )}
            {completedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={() => handleToggleTodo(todo.id, todo.completed)}
                onDelete={() => handleDeleteTodo(todo.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/5">
        {todos.length >= MAX_TODO_COUNT ? (
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
    </div>
  )
}

// Todo Item Component
interface TodoItemProps {
  todo: CloudTodoItem
  onToggle: () => void
  onDelete: () => void
}

function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <div
      className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
          todo.completed
            ? 'bg-white/20 border-white/30'
            : 'border-white/20 hover:border-white/40'
        }`}
      >
        {todo.completed && <Check size={12} className="text-white/70" />}
      </button>

      {/* Text */}
      <span
        className={`flex-1 text-sm transition-all ${
          todo.completed ? 'text-white/30 line-through' : 'text-white/80'
        }`}
      >
        {todo.text}
      </span>

      {/* Delete Button */}
      <button
        onClick={onDelete}
        className={`text-white/30 hover:text-red-400 transition-all ${
          showDelete ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
