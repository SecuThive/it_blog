'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function DynamicUI() {
  const pathname = usePathname()

  useEffect(() => {
    // ── 1. 스크롤 진행 바 ──────────────────────────
    const bar = document.getElementById('scroll-progress')
    const onScroll = () => {
      if (!bar) return
      const doc = document.documentElement
      const pct = (doc.scrollTop / (doc.scrollHeight - doc.clientHeight)) * 100
      bar.style.width = `${Math.min(pct, 100)}%`
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // ── 2. 카드 3D 틸트 + 커서 스포트라이트 ───────
    const isTouchDevice = window.matchMedia('(hover: none)').matches
    if (!isTouchDevice) {
      const cards = document.querySelectorAll<HTMLElement>('.post-card')

      cards.forEach((card) => {
        const onMove = (e: MouseEvent) => {
          const rect = card.getBoundingClientRect()
          const x = (e.clientX - rect.left) / rect.width - 0.5
          const y = (e.clientY - rect.top) / rect.height - 0.5
          card.style.transform = `perspective(700px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg) translateY(-4px)`
          card.style.transition = 'box-shadow 0.12s ease'
          card.style.boxShadow = '0 14px 40px rgba(25,31,40,0.14)'
          card.style.setProperty('--sx', `${e.clientX - rect.left}px`)
          card.style.setProperty('--sy', `${e.clientY - rect.top}px`)
        }
        const onLeave = () => {
          card.style.transform = ''
          card.style.boxShadow = ''
          card.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease'
        }
        card.addEventListener('mousemove', onMove)
        card.addEventListener('mouseleave', onLeave)
      })

      // 사이드바 카드 스포트라이트
      document.querySelectorAll<HTMLElement>('.sidebar-card, .lead-side, .home-hero__ranking').forEach((card) => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect()
          card.style.setProperty('--sx', `${e.clientX - rect.left}px`)
          card.style.setProperty('--sy', `${e.clientY - rect.top}px`)
        })
      })
    }

    // ── 3. CTA 버튼 리플 효과 ─────────────────────
    const rippleTargets = document.querySelectorAll<HTMLElement>(
      '.home-hero__cta, .header-cta, .not-found-page a, .contact-form__submit, .lead-main__cta'
    )
    rippleTargets.forEach((btn) => {
      btn.style.position = 'relative'
      btn.style.overflow = 'hidden'
      const onClick = (e: MouseEvent) => {
        const rect = btn.getBoundingClientRect()
        const size = Math.max(rect.width, rect.height) * 2
        const ripple = document.createElement('span')
        ripple.className = 'ripple-dot'
        ripple.style.cssText = `
          position:absolute;
          width:${size}px;height:${size}px;
          left:${e.clientX - rect.left - size / 2}px;
          top:${e.clientY - rect.top - size / 2}px;
          background:rgba(255,255,255,0.32);
          border-radius:50%;
          transform:scale(0);
          animation:ripple-anim 0.55s ease-out forwards;
          pointer-events:none;
        `
        btn.appendChild(ripple)
        ripple.addEventListener('animationend', () => ripple.remove())
      }
      btn.addEventListener('click', onClick)
    })

    // ── 4. 통계 숫자 카운트업 ─────────────────────
    const statEls = document.querySelectorAll<HTMLElement>('.home-stat strong[data-count]')
    if (statEls.length > 0) {
      const countObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = entry.target as HTMLElement
          const target = parseInt(el.dataset.count || '0', 10)
          const suffix = el.dataset.suffix || ''
          let current = 0
          const step = Math.ceil(target / 28)
          const timer = setInterval(() => {
            current = Math.min(current + step, target)
            el.textContent = current + suffix
            if (current >= target) clearInterval(timer)
          }, 28)
          countObserver.unobserve(el)
        })
      }, { threshold: 0.5 })
      statEls.forEach((el) => countObserver.observe(el))
    }

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [pathname])

  return (
    <>
      <div
        id="scroll-progress"
        style={{
          position: 'fixed',
          top: 0, left: 0,
          height: '3px',
          width: '0%',
          background: 'linear-gradient(90deg,#3182F6 0%,#6366f1 60%,#a855f7 100%)',
          zIndex: 9999,
          transition: 'width 0.1s linear',
          borderRadius: '0 2px 2px 0',
        }}
      />
      <div className="floating-blobs" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
    </>
  )
}
