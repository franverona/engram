import Link from 'next/link'
import { NavLink } from './nav-link'

export default function LayoutSidebar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="max-w-6xl flex gap-10 items-center m-auto px-4 py-2">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
            <path d="M9 21h6" />
            <path d="M10 21v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1" />
            <path d="M12 2v4" />
            <path d="M8 6l2 2" />
            <path d="M16 6l-2 2" />
          </svg>
          Engram
        </Link>
        <div className="flex gap-5">
          <NavLink href="/">Notes</NavLink>
          <NavLink href="/search">Search</NavLink>
          <NavLink href="/chat">Chat</NavLink>
        </div>
      </div>
    </nav>
  )
}
