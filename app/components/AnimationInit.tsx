'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AnimationInit() {
  const pathname = usePathname()

  useEffect(() => {
    // 경로 변경 시 기존 is-visible 초기화 후 재관찰
    const elements = document.querySelectorAll<Element>('.animate-up')
    elements.forEach((el) => el.classList.remove('is-visible'))

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

    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [pathname])

  return null
}
