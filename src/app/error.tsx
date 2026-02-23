'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[GlobalError]', error)
    }
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-medium text-text-muted">Something went wrong</p>
      <p className="mt-1 text-sm text-text-faint">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-border-hover hover:bg-surface-secondary"
      >
        Try again
      </button>
    </div>
  )
}
