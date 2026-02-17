'use client'

import { useState } from 'react'
import { SearchBar } from '@/components/search-bar'
import { SearchResults } from '@/components/search-results'
import { trpc } from '@/trpc/react'

export default function SearchPage() {
  const [query, setQuery] = useState('')

  const searchQuery = trpc.search.semantic.useQuery(
    { query },
    { enabled: query.length > 0 },
  )

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Semantic Search</h1>
      <div className="space-y-6">
        <SearchBar
          onSearch={setQuery}
          isLoading={searchQuery.isFetching}
        />
        {searchQuery.data && <SearchResults results={searchQuery.data} />}
        {searchQuery.error && (
          <p className="text-sm text-red-600">{searchQuery.error.message}</p>
        )}
      </div>
    </div>
  )
}
