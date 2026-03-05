'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

export default function NavSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div className={`nav-search${open ? ' is-open' : ''}`}>
      {open ? (
        <form className="nav-search__form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="nav-search__input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색..."
            onBlur={() => { if (!query) setOpen(false) }}
          />
          <button type="submit" className="nav-search__icon-btn" aria-label="검색 실행">
            <SearchIcon />
          </button>
        </form>
      ) : (
        <button className="nav-search__icon-btn" onClick={() => setOpen(true)} aria-label="검색">
          <SearchIcon />
        </button>
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
