'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { CATEGORIES } from '../lib/categories'

export default function NavCategoryDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="nav-dropdown" ref={ref}>
      <button
        className="nav-dropdown__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        카테고리
        <svg className={`nav-dropdown__arrow${open ? ' is-open' : ''}`} width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul className="nav-dropdown__menu" role="menu">
          {CATEGORIES.map((cat) => (
            <li key={cat.slug} role="none">
              <Link
                href={`/category/${cat.slug}`}
                className="nav-dropdown__item"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {cat.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
