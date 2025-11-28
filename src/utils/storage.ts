// Chrome Storage Utilities
// Uses chrome.storage.local for persistence

export interface UserSettings {
  name: string
  showWeather: boolean
  showQuote: boolean
  showTodo: boolean
}

export interface TodoItem {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

export async function getSettings(): Promise<UserSettings> {
  // TODO: Implement storage get
  throw new Error('Not implemented')
}

export async function saveSettings(settings: Partial<UserSettings>): Promise<void> {
  // TODO: Implement storage save
  throw new Error('Not implemented')
}

export async function getTodos(): Promise<TodoItem[]> {
  // TODO: Implement todos get
  throw new Error('Not implemented')
}

export async function saveTodos(todos: TodoItem[]): Promise<void> {
  // TODO: Implement todos save
  throw new Error('Not implemented')
}
