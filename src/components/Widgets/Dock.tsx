import { ListTodo, StickyNote, Minimize2, LucideIcon } from 'lucide-react'

type WidgetId = 'todo' | 'notes'

interface DockProps {
  activeWidgets: WidgetId[]
  onToggleWidget: (id: WidgetId) => void
  onExitFocusMode: () => void
}

interface DockItem {
  id: WidgetId
  icon: LucideIcon
  label: string
}

const dockItems: DockItem[] = [
  { id: 'todo', icon: ListTodo, label: 'Todo' },
  { id: 'notes', icon: StickyNote, label: 'Notes' },
  // Future: { id: 'pomodoro', icon: Timer, label: 'Pomodoro' },
]

export default function Dock({ activeWidgets, onToggleWidget, onExitFocusMode }: DockProps) {
  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 p-2 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
      {/* Widget buttons */}
      {dockItems.map((item) => {
        const Icon = item.icon
        const isActive = activeWidgets.includes(item.id)

        return (
          <button
            key={item.id}
            onClick={() => onToggleWidget(item.id)}
            className={`group relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              isActive
                ? 'bg-white/20 text-white'
                : 'text-white/50 hover:text-white hover:bg-white/10'
            }`}
            title={item.label}
          >
            <Icon size={18} strokeWidth={2} />

            {/* Active indicator dot */}
            {isActive && (
              <span className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-blue-400" />
            )}

            {/* Tooltip */}
            <span className="absolute left-full ml-3 px-2 py-1 rounded bg-black/80 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {item.label}
            </span>
          </button>
        )
      })}

      {/* Divider */}
      <div className="w-full h-px bg-white/10 my-0.5" />

      {/* Exit focus mode button */}
      <button
        onClick={onExitFocusMode}
        className="group relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 text-white/50 hover:text-white hover:bg-white/10"
        title="Exit focus mode"
      >
        <Minimize2 size={18} strokeWidth={2} />

        {/* Tooltip */}
        <span className="absolute left-full ml-3 px-2 py-1 rounded bg-black/80 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Exit
        </span>
      </button>
    </div>
  )
}

export type { WidgetId }
