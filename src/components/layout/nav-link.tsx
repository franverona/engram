'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({
  href,
  children,
  onClick,
}: {
  href: string
  children: React.ReactNode
  onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`text-sm font-medium transition-colors ${
        isActive ? 'text-primary' : 'text-text-muted hover:text-foreground'
      }`}
    >
      {children}
    </Link>
  )
}
