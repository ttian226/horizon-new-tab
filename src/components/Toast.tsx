import { useEffect } from 'react'
import { AlertTriangle, CheckCircle, X } from 'lucide-react'

type ToastType = 'success' | 'warning' | 'error'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
}

export default function Toast({ message, type = 'warning', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle size={14} className="text-green-400" strokeWidth={2.5} />
          </div>
        )
      case 'error':
        return (
          <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
            <X size={14} className="text-red-400" strokeWidth={2.5} />
          </div>
        )
      default: // warning/limit
        return (
          <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <AlertTriangle size={14} className="text-yellow-400" strokeWidth={2.5} />
          </div>
        )
    }
  }

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100]">
      <div
        className="
          px-5 py-3
          bg-black/70 backdrop-blur-md
          border border-white/10
          rounded-full shadow-2xl
          flex items-center gap-3
        "
        style={{
          animation: 'toastSlideIn 0.3s ease-out forwards',
        }}
      >
        {getIcon()}
        <p className="text-sm text-white/90 font-medium">{message}</p>
      </div>
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
