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

    let observer: IntersectionObserver | null = null
    const timerId = setTimeout(() => {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              observer!.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.06, rootMargin: '0px 0px -30px 0px' }
      )
      document.querySelectorAll<Element>('.animate-up').forEach((el) => observer!.observe(el))
    }, 50)

    return () => {
      clearTimeout(timerId)
      observer?.disconnect()
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
