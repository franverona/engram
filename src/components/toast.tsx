'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

type ToastContextValue = { showToast: (message: string, onUndo?: () => void) => void }
const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

function Toast({
  message,
  onClose,
  onUndo,
}: {
  message: string
  onClose: () => void
  onUndo?: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, typeof onUndo !== 'undefined' ? 5000 : 3000)
    return () => clearTimeout(timer)
  }, [onClose, onUndo])

  const dismiss = () => {
    onUndo?.()
    onClose()
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-[slideUp_0.2s_ease-out] rounded-lg border border-border bg-surface px-4 py-3 shadow-lg">
      <div className="flex items-center gap-3">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-green-500"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <p className="text-sm font-medium">{message}</p>
        {onUndo && (
          <button
            onClick={dismiss}
            className="ml-2 text-sm border bg-black/50 border-border px-2 py-1 rounded-lg text-text-faint hover:text-foreground"
          >
            Undo
          </button>
        )}
        <button onClick={onClose} className="ml-2 text-text-faint hover:text-foreground">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{
    message: string
    onUndo?: () => void
  } | null>(null)
  const showToast = useCallback(
    (message: string, onUndo?: () => void) => setToast({ message, onUndo }),
    [],
  )
  const dismissToast = useCallback(() => setToast(null), [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <Toast message={toast.message} onClose={dismissToast} onUndo={toast.onUndo} />}
    </ToastContext.Provider>
  )
}
