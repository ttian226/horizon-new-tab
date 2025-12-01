import { X, Leaf, Building2, LayoutGrid, Cpu } from 'lucide-react'
import { WallpaperCategory, WALLPAPER_CATEGORIES } from '../services/wallpaper'
import GlassButton from './GlassButton'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  category: WallpaperCategory
  onCategoryChange: (category: WallpaperCategory) => void
}

const CATEGORY_ICONS: Record<WallpaperCategory, typeof Leaf> = {
  nature: Leaf,
  architecture: Building2,
  minimalist: LayoutGrid,
  technology: Cpu,
}

const CATEGORY_LABELS: Record<WallpaperCategory, string> = {
  nature: 'Nature',
  architecture: 'Architecture',
  minimalist: 'Minimalist',
  technology: 'Technology',
}

export default function SettingsModal({
  isOpen,
  onClose,
  category,
  onCategoryChange,
}: SettingsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-modal-backdrop">
      <div className="relative w-full max-w-md p-8 mx-4 bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl animate-modal-content">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors p-1"
        >
          <X size={24} />
        </button>

        <h3 className="text-2xl font-serif-elegant italic text-white mb-2">
          Display Settings
        </h3>
        <p className="text-sm text-white/50 mb-8 font-light">
          Customize your daily inspiration.
        </p>

        {/* Category Selection */}
        <div className="space-y-4">
          <label className="text-xs uppercase tracking-widest text-white/40 font-bold ml-1 block pb-2">
            Background Theme
          </label>
          <div className="grid grid-cols-2 gap-3">
            {WALLPAPER_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat]
              return (
                <GlassButton
                  key={cat}
                  active={category === cat}
                  onClick={() => onCategoryChange(cat)}
                  className="w-full justify-center"
                >
                  <Icon size={14} />
                  {CATEGORY_LABELS[cat]}
                </GlassButton>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-white/5 my-8" />

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
