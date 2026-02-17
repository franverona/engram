'use client'

type SearchResult = {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  distance: number;
}

export function SearchResults({ results }: { results: SearchResult[] }) {
  if (results.length === 0) {
    return <p className="text-gray-500">No results found.</p>
  }

  return (
    <ul className="space-y-4">
      {results.map((result) => (
        <li
          key={result.id}
          className="rounded border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <h3 className="font-semibold">{result.title}</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">
            {result.body}
          </p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Distance: {result.distance.toFixed(4)}
          </p>
        </li>
      ))}
    </ul>
  )
}
