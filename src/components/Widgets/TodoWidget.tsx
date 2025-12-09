import { useState, useEffect } from 'react'
import { ListTodo, Plus, Check, Trash2 } from 'lucide-react'
import GlassCard from './GlassCard'
import {
  CloudTodoItem,
  subscribeTodos,
  addTodo,
  toggleTodo,
  deleteTodo,
  clearCompletedTodos,
  ensureDefaultTodoList,
} from '../../services/firestore'

const MAX_TODO_TEXT_LENGTH = 100
const MAX_TODO_COUNT = 20
const DEFAULT_TODO_LIST_ID = 'today'

interface TodoWidgetProps {
  userId: string
  onClose?: () => void
}

export default function TodoWidget({ userId, onClose }: TodoWidgetProps) {
  const [todos, setTodos] = useState<CloudTodoItem[]>([])
  const [newTodoText, setNewTodoText] = useState('')
  const [loading, setLoading] = useState(true)
  const [listId, setListId] = useState<string>(DEFAULT_TODO_LIST_ID)

  useEffect(() => {
    if (!userId) return

    setLoading(true)
    ensureDefaultTodoList(userId).then((defaultListId) => {
      setListId(defaultListId)
      const unsubscribe = subscribeTodos(userId, defaultListId, (updatedTodos) => {
        setTodos(updatedTodos)
        setLoading(false)
      })
      return () => unsubscribe()
    })
  }, [userId])

  const handleAddTodo = async () => {
    const text = newTodoText.trim()
    if (!text || todos.length >= MAX_TODO_COUNT) return

    const optimisticTodo: CloudTodoItem = {
      id: `temp-${Date.now()}`,
      text: text.slice(0, MAX_TODO_TEXT_LENGTH),
      completed: false,
      listId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setTodos((prev) => [optimisticTodo, ...prev])
    setNewTodoText('')

    try {
      const realId = await addTodo(userId, text.slice(0, MAX_TODO_TEXT_LENGTH), listId)
      setTodos((prev) =>
        prev.map((todo) => (todo.id === optimisticTodo.id ? { ...todo, id: realId } : todo))
      )
    } catch (error) {
      console.error('Failed to add todo:', error)
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

  return (
    <GlassCard
      id="todo"
      title="Today's Tasks"
      icon={ListTodo}
      onClose={onClose}
      defaultWidth={320}
      defaultHeight={380}
    >
      {/* Todo List - Takes remaining space */}
      <div className="flex-1 overflow-y-auto -mx-4 px-4 min-h-0">
        {loading ? (
          <div className="space-y-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-1.5 animate-pulse">
                <div className="w-4 h-4 rounded-[3px] bg-white/10 shrink-0" />
                <div className="h-4 bg-white/10 rounded" style={{ width: `${60 + i * 10}%` }} />
              </div>
            ))}
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center py-4 text-white/40 text-sm">No tasks for today</div>
        ) : (
          <div className="space-y-1">
            {incompleteTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={() => handleToggleTodo(todo.id, todo.completed)}
                onDelete={() => handleDeleteTodo(todo.id)}
              />
            ))}
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

      {/* Clear completed button */}
      {completedTodos.length > 0 && (
        <div className="-mx-4 px-4 pt-2 border-t border-white/5 flex-shrink-0">
          <button
            onClick={handleClearCompleted}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Clear completed
          </button>
        </div>
      )}

      {/* Input - Always at bottom */}
      <div className="-mx-4 px-4 pt-3 mt-auto border-t border-white/5 flex-shrink-0">
        {todos.length >= MAX_TODO_COUNT ? (
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
              placeholder="Add a task..."
              maxLength={MAX_TODO_TEXT_LENGTH}
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
            />
          </div>
        )}
      </div>
    </GlassCard>
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
      className="group flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <button
        onClick={onToggle}
        className={`shrink-0 w-4 h-4 rounded-[3px] border flex items-center justify-center transition-all ${
          todo.completed
            ? 'bg-white/20 border-white/30'
            : 'border-white/20 hover:border-white/40'
        }`}
      >
        {todo.completed && <Check size={10} className="text-white/70" />}
      </button>

      <span
        className={`flex-1 text-sm transition-all ${
          todo.completed ? 'text-white/30 line-through' : 'text-white/80'
        }`}
      >
        {todo.text}
      </span>

      <button
        onClick={onDelete}
        className={`text-white/30 hover:text-red-400 transition-all ${
          showDelete ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}
