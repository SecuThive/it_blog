'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function CookieBanner() {
  const [show, setShow] = useState(false)

  // Initialize from localStorage once; avoids setState inside effect (eslint rule).
  const [show, setShow] = useState(() => {
    try {
      return !localStorage.getItem('cookie-consent')
    } catch {
      return false
    }
  })

  useEffect(() => {
    // no-op: kept for future cookie sync if needed
  }, [])

  function accept() {
    try {
      localStorage.setItem('cookie-consent', '1')
    } catch { /* ignore */ }
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="cookie-banner" role="region" aria-label="쿠키 사용 안내">
      <div className="cookie-banner__inner">
        <p className="cookie-banner__text">
          이 사이트는 서비스 개선 및 맞춤 광고(Google AdSense)를 위해 쿠키를 사용합니다.{' '}
          <Link href="/privacy" className="cookie-banner__link">개인정보처리방침</Link>
        </p>
        <div className="cookie-banner__actions">
          <button type="button" className="cookie-banner__accept" onClick={accept}>
            동의 및 닫기
          </button>
        </div>
      </div>
    </div>
  )
}
