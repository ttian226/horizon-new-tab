import { X, Sparkles } from 'lucide-react'

export interface ReleaseNote {
  version: string
  date: string
  highlights: { title: string; description: string }[]
}

interface WhatsNewModalProps {
  isOpen: boolean
  onClose: () => void
  release: ReleaseNote
}

export default function WhatsNewModal({ isOpen, onClose, release }: WhatsNewModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="relative w-[460px] max-w-[calc(100vw-2rem)] mx-4 bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl animate-modal-content overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-white/80" />
            <h3 className="text-lg font-medium text-white">What's New</h3>
            <span className="text-xs text-white/40 ml-1">v{release.version}</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        <div className="px-6 py-5">
          <p className="text-xs text-white/40 mb-4">{release.date}</p>
          <ul className="space-y-4">
            {release.highlights.map((h, i) => (
              <li key={i}>
                <h4 className="text-sm font-medium text-white mb-1">{h.title}</h4>
                <p className="text-sm text-white/60 leading-relaxed">{h.description}</p>
              </li>
            ))}
          </ul>
        </div>

        <footer className="px-6 py-4 border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl transition-colors"
          >
            Got it
          </button>
        </footer>
      </div>
    </div>
  )
}
