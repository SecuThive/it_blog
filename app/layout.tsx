import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import './globals.css'
import Navbar from './components/Navbar'
import AnimationInit from './components/AnimationInit'
import DynamicUI from './components/DynamicUI'
import CookieBanner from './components/CookieBanner'
import GoogleAnalytics from './components/GoogleAnalytics'
import { Analytics } from '@vercel/analytics/next'
import { getPostCategorySummaries } from './lib/posts'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'
const SITE_NAME = 'ThiveLab'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: 'AI가 큐레이션하는 IT 인사이트 — 한국 소비자 관점의 기기 소식/업데이트 정리',
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'ko_KR',
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/og-default.svg`, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: 'AI가 큐레이션하는 IT 인사이트 — 한국 소비자 관점의 기기 소식/업데이트 정리',
    images: [`${SITE_URL}/og-default.svg`],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
    types: {
      'application/rss+xml': `${SITE_URL}/feed.xml`,
    },
  },
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const categories = await getPostCategorySummaries()

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'ko-KR',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/og-default.svg`,
  }

  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2091277631590195"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <div className="page-bg" />
        <Analytics />
        <Suspense fallback={null}><AnimationInit /></Suspense>
        <DynamicUI />
        <GoogleAnalytics />
        <CookieBanner />
        <Navbar />
        <main className="page-main">{children}</main>

        {/* 푸터 */}
        <footer className="site-footer">
          <div className="container footer-body">
            {/* 브랜드 컬럼 */}
            <div className="footer-brand-col">
              <Link href="/" className="footer-brand">
                ThiveLab
              </Link>
              <p className="footer-brand-desc">
                AI가 수집·분석한 최신 IT 정보를 사람 에디터가 검수해 제공하는
                AI 기반 IT 큐레이션 미디어입니다.
              </p>
              <div className="footer-social-links">
                <a
                  href="https://www.instagram.com/thive_lab/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-link"
                  aria-label="ThiveLab 인스타그램"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                  </svg>
                  @thive_lab
                </a>
              </div>

              <p className="footer-ai-notice">
                🤖 이 블로그는 AI가 콘텐츠를 수집·작성하고 사람 에디터가 검수합니다.
              </p>
              <p className="footer-ad-notice">
                이 블로그는 쿠팡 파트너스 등 제휴 마케팅을 통해 수익을 얻을 수 있습니다.
              </p>
            </div>

            {/* 카테고리 링크 */}
            <div className="footer-nav-col">
              <h3>카테고리</h3>
              <ul>
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link href={`/category/${category.slug}`}>{category.name}</Link>
                  </li>
                ))}
                {categories.length === 0 ? <li>등록된 카테고리가 없습니다.</li> : null}
              </ul>
            </div>

            {/* 블로그 정보 링크 */}
            <div className="footer-nav-col">
              <h3>블로그 정보</h3>
              <ul>
                <li><Link href="/about">블로그 소개</Link></li>
                <li><Link href="/terms">이용약관</Link></li>
                <li><Link href="/disclaimer">광고·제휴 고지</Link></li>
                <li><Link href="/privacy">개인정보처리방침</Link></li>
                <li><Link href="/contact">문의하기</Link></li>
              </ul>
            </div>
          </div>

          {/* 하단 바 */}
          <div className="footer-bottom">
            <div className="container footer-bottom__inner">
              <p>© 2026 ThiveLab. All rights reserved.</p>
              <div className="footer-bottom__links">
                <Link href="/terms">이용약관</Link>
                <span aria-hidden="true">·</span>
                <Link href="/privacy">개인정보처리방침</Link>
                <span aria-hidden="true">·</span>
                <Link href="/disclaimer">광고 고지</Link>
                <span aria-hidden="true">·</span>
                <Link href="/contact">문의</Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
