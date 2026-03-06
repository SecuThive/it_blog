'use client'

import { useRouter } from 'next/navigation'
import { startTransition } from 'react'

type Props = {
  currentPage: number
  totalPages: number
  basePath?: string
}

export default function Pagination({ currentPage, totalPages, basePath = '' }: Props) {
  const router = useRouter()

  if (totalPages <= 1) return null

  function pageUrl(page: number) {
    return page === 1 ? `${basePath}/` : `${basePath}/?page=${page}`
  }

  function go(e: React.MouseEvent<HTMLAnchorElement>, page: number) {
    e.preventDefault()
    startTransition(() => {
      router.push(pageUrl(page))
      router.refresh()
    })
  }

  const delta = 2
  const start = Math.max(1, currentPage - delta)
  const end = Math.min(totalPages, currentPage + delta)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <nav className="pagination" aria-label="페이지 이동">
      {currentPage > 1 ? (
        <a href={pageUrl(currentPage - 1)} onClick={(e) => go(e, currentPage - 1)} className="pagination__btn" aria-label="이전 페이지">
          ←
        </a>
      ) : (
        <span className="pagination__btn is-disabled">←</span>
      )}

      {start > 1 && (
        <>
          <a href={pageUrl(1)} onClick={(e) => go(e, 1)} className="pagination__num">1</a>
          {start > 2 && <span className="pagination__ellipsis">…</span>}
        </>
      )}

      {pages.map((page) => (
        <a
          key={page}
          href={pageUrl(page)}
          onClick={(e) => go(e, page)}
          className={`pagination__num${page === currentPage ? ' is-active' : ''}`}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </a>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="pagination__ellipsis">…</span>}
          <a href={pageUrl(totalPages)} onClick={(e) => go(e, totalPages)} className="pagination__num">{totalPages}</a>
        </>
      )}

      {currentPage < totalPages ? (
        <a href={pageUrl(currentPage + 1)} onClick={(e) => go(e, currentPage + 1)} className="pagination__btn" aria-label="다음 페이지">
          →
        </a>
      ) : (
        <span className="pagination__btn is-disabled">→</span>
      )}
    </nav>
  )
}
