import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { TRPCProvider } from "@/trpc/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Engram",
  description: "A notes app with semantic search and RAG chat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TRPCProvider>
          <nav className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
              <Link href="/" className="text-lg font-semibold">
                Engram
              </Link>
              <Link
                href="/notes/new"
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                New Note
              </Link>
              <Link
                href="/search"
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                Search
              </Link>
              <Link
                href="/chat"
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                Chat
              </Link>
            </div>
          </nav>
          <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
        </TRPCProvider>
      </body>
    </html>
  );
}
