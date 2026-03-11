'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function AnimationInit() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const paginationObserverRef = useRef<IntersectionObserver | null>(null)

  // 페이지 이동(pathname 변경) 시: 전체 초기화 + 재관찰
  useEffect(() => {
    document.querySelectorAll<Element>('.animate-up').forEach((el) => el.classList.remove('is-visible'))

    let io: IntersectionObserver | null = null
    let mo: MutationObserver | null = null

    const timerId = setTimeout(() => {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              io!.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.06, rootMargin: '0px 0px -30px 0px' }
      )
      document.querySelectorAll<Element>('.animate-up').forEach((el) => io!.observe(el))

      // loading.tsx 이후 실제 콘텐츠(PostCard 등)가 DOM에 마운트될 때도 관찰
      mo = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue
            const el = node as Element
            if (el.classList.contains('animate-up') && !el.classList.contains('is-visible')) {
              io!.observe(el)
            }
            el.querySelectorAll<Element>('.animate-up:not(.is-visible)').forEach((child) => io!.observe(child))
          }
        }
      })
      mo.observe(document.body, { childList: true, subtree: true })
    }, 50)

    return () => {
      clearTimeout(timerId)
      io?.disconnect()
      mo?.disconnect()
    }
  }, [pathname])

  // 페이지네이션(searchParams 변경) 시: is-visible 없는 요소만 관찰
  // 이미 보이는 요소(히어로 등)는 건드리지 않음
  useEffect(() => {
    if (paginationObserverRef.current) {
      paginationObserverRef.current.disconnect()
    }

    const timerId = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              observer.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.06, rootMargin: '0px 0px -30px 0px' }
      )

      paginationObserverRef.current = observer
      document
        .querySelectorAll<Element>('.animate-up:not(.is-visible)')
        .forEach((el) => observer.observe(el))
    }, 50)

    return () => {
      clearTimeout(timerId)
      if (paginationObserverRef.current) {
        paginationObserverRef.current.disconnect()
        paginationObserverRef.current = null
      }
    }
  }, [searchParams])

  return null
}
