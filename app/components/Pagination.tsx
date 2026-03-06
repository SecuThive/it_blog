'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

  function go(page: number) {
    router.push(pageUrl(page))
    router.refresh()
  }

  // 표시할 페이지 번호 범위 (최대 5개)
  const delta = 2
  const start = Math.max(1, currentPage - delta)
  const end = Math.min(totalPages, currentPage + delta)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <nav className="pagination" aria-label="페이지 이동">
      {currentPage > 1 ? (
        <Link href={pageUrl(currentPage - 1)} onClick={() => router.refresh()} className="pagination__btn" aria-label="이전 페이지">
          ←
        </Link>
      ) : (
        <span className="pagination__btn is-disabled">←</span>
      )}

      {start > 1 && (
        <>
          <Link href={pageUrl(1)} onClick={() => router.refresh()} className="pagination__num">1</Link>
          {start > 2 && <span className="pagination__ellipsis">…</span>}
        </>
      )}

      {pages.map((page) => (
        <Link
          key={page}
          href={pageUrl(page)}
          onClick={() => router.refresh()}
          className={`pagination__num${page === currentPage ? ' is-active' : ''}`}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </Link>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="pagination__ellipsis">…</span>}
          <Link href={pageUrl(totalPages)} onClick={() => router.refresh()} className="pagination__num">{totalPages}</Link>
        </>
      )}

      {currentPage < totalPages ? (
        <Link href={pageUrl(currentPage + 1)} onClick={() => router.refresh()} className="pagination__btn" aria-label="다음 페이지">
          →
        </Link>
      ) : (
        <span className="pagination__btn is-disabled">→</span>
      )}
    </nav>
  )
}
