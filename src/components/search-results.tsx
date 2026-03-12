'use client'

import type { notes } from '@/lib/db/schema'

type SearchResult = typeof notes.$inferSelect & {
  score: number
}

function scoreToPercentage(score: number): number {
  return Math.round((score / (2 / 61)) * 100)
}

function SimilarityBadge({ score }: { score: number }) {
  const pct = scoreToPercentage(score)
  const color =
    pct >= 80
      ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
      : pct >= 50
        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {pct}% match
    </span>
  )
}

export function SearchResults({ results }: { results: SearchResult[] }) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-3 text-text-faint"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <p className="text-sm text-text-muted">No results found. Try a different query.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {results.map((result) => (
        <li
          key={result.id}
          className="rounded-xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-border-hover hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold leading-snug">{result.title}</h3>
            <SimilarityBadge score={result.score} />
          </div>
          <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-sm text-text-muted">
            {result.summary || result.body}
          </p>
        </li>
      ))}
    </ul>
  )
}
