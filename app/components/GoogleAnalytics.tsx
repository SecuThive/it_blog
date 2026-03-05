'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export default function GoogleAnalytics() {
  const [consented, setConsented] = useState(false)

  useEffect(() => {
    // 쿠키 동의 여부 확인 (CookieBanner와 동일한 키)
    try {
      if (localStorage.getItem('cookie-consent') === '1') {
        setConsented(true)
      }
    } catch { /* ignore */ }

    // 동의 후 배너가 닫힐 때도 감지 (storage 이벤트)
    function onStorage(e: StorageEvent) {
      if (e.key === 'cookie-consent' && e.newValue === '1') setConsented(true)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  if (!GA_ID || !consented) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { page_path: window.location.pathname });
        `}
      </Script>
    </>
  )
}
