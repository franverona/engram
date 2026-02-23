'use client'

import { useState } from 'react'
import { LayoutInnerContent } from '@/components/layout'
import { SearchBar } from '@/components/search-bar'
import { SearchResults } from '@/components/search-results'
import { ErrorBoundary } from '@/components/ui'
import { trpc } from '@/trpc/react'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(5)

  const searchQuery = trpc.search.hybrid.useQuery(
    { query, limit },
    { enabled: query.length > 0 },
  )

  return (
    <ErrorBoundary>
      <LayoutInnerContent>
        <h1 className="mb-2 text-2xl font-bold">Hybrid Search</h1>
        <p className="mb-6 text-sm text-text-muted">
          Search your notes using natural language. Results are ranked by keyword and semantic similarity combined.
        </p>
        <div className="space-y-6">
          <SearchBar
            onSearch={setQuery}
            isLoading={searchQuery.isFetching}
          />
          <div className="text-right">
            <div className="flex justify-end items-center gap-4">
              <label htmlFor="limitResults" className="block text-sm font-medium">
                Show:
              </label>
              <select id="limitResults" className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm shadow-sm" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                <option value={5}>5 results</option>
                <option value={10}>10 results</option>
                <option value={20}>20 results</option>
              </select>
            </div>
          </div>
          {searchQuery.isFetching && !searchQuery.data && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-surface p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="h-5 w-1/3 animate-pulse rounded bg-border" />
                    <div className="h-5 w-16 animate-pulse rounded-full bg-border" />
                  </div>
                  <div className="mt-3 h-4 w-full animate-pulse rounded bg-border" />
                  <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-border" />
                </div>
              ))}
            </div>
          )}
          {searchQuery.data && <SearchResults results={searchQuery.data} />}
          {searchQuery.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {searchQuery.error.message}
            </p>
          )}
          {!query && !searchQuery.data && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-text-faint">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p className="text-lg font-medium text-text-muted">Search your notes</p>
              <p className="mt-1 text-sm text-text-faint">
                Type a question or topic to find relevant notes
              </p>
            </div>
          )}
        </div>
      </LayoutInnerContent>
    </ErrorBoundary>
  )
}
