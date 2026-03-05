'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SearchBar({ initialQuery = '' }: { initialQuery?: string }) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <input
        className="search-bar__input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="제품명, 키워드로 검색..."
        aria-label="검색어 입력"
        autoComplete="off"
      />
      <button className="search-bar__btn" type="submit" aria-label="검색">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </form>
  )
}
