import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import KeyboardShortcuts from '@/components/keyboard-shortcuts'
import { LayoutContent, LayoutNavBar } from '@/components/layout'
import { ToastProvider } from '@/components/toast'
import { TRPCProvider } from '@/trpc/react'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Engram',
  description: 'A notes app with semantic search and RAG chat',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TRPCProvider>
          <ToastProvider>
            <LayoutNavBar />
            <LayoutContent>{children}</LayoutContent>
            <KeyboardShortcuts />
          </ToastProvider>
        </TRPCProvider>
      </body>
    </html>
  )
}
