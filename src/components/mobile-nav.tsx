'use client'

import { useState } from 'react'
import { NavLink } from './layout/nav-link'

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-md p-2 text-text-muted hover:bg-surface-secondary hover:text-foreground"
        aria-label="Toggle menu"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        )}
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full border-b border-border bg-surface/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4">
            <NavLink href="/" onClick={() => setOpen(false)}>Notes</NavLink>
            <NavLink href="/notes/new" onClick={() => setOpen(false)}>New Note</NavLink>
            <NavLink href="/search" onClick={() => setOpen(false)}>Search</NavLink>
            <NavLink href="/chat" onClick={() => setOpen(false)}>Chat</NavLink>
          </div>
        </div>
      )}
    </div>
  )
}
