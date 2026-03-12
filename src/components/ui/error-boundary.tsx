'use client'

import { Component } from 'react'
import type { ReactNode } from 'react'

type Props = { children: ReactNode; fallback?: ReactNode }
type State = { hasError: boolean; error?: Error }

function DefaultFallback({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-lg font-medium text-text-muted">Something went wrong</p>
      <button
        onClick={onReset}
        className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-border-hover
  hover:bg-surface-secondary"
      >
        Try again
      </button>
    </div>
  )
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary]', error, info)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <DefaultFallback onReset={() => this.setState({ hasError: false })} />
        )
      )
    }
    return this.props.children
  }
}
