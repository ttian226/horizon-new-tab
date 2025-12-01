import { X } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  isLoggedIn: boolean
  onSignOut: () => void
}

export default function SettingsModal({
  isOpen,
  onClose,
  isLoggedIn,
  onSignOut,
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
          Settings
        </h3>
        <p className="text-sm text-white/50 mb-8 font-light">
          Manage your account.
        </p>

        <div className="flex justify-between items-center">
          {/* Sign Out Button - Only show when logged in */}
          {isLoggedIn ? (
            <button
              onClick={() => {
                onSignOut()
                onClose()
              }}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <div />
          )}

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
