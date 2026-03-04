import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import Navbar from './components/Navbar'
import AnimationInit from './components/AnimationInit'
import DynamicUI from './components/DynamicUI'
import CookieBanner from './components/CookieBanner'
import { getPostCategorySummaries } from './lib/posts'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'
const SITE_NAME = '오늘의 IT 블로그'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: '스마트폰, 노트북, 태블릿, IT 액세서리 리뷰와 구매가이드를 다루는 블로그',
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'ko_KR',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    types: {
      'application/rss+xml': `${SITE_URL}/feed.xml`,
    },
  },
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const categories = await getPostCategorySummaries()

  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <div className="page-bg" />
        <AnimationInit />
        <DynamicUI />
        <CookieBanner />
        <Navbar />
        <main className="page-main">{children}</main>

        {/* 푸터 */}
        <footer className="site-footer">
          <div className="container footer-body">
            {/* 브랜드 컬럼 */}
            <div className="footer-brand-col">
              <Link href="/" className="footer-brand">
                오늘의 IT 블로그
              </Link>
              <p className="footer-brand-desc">
                스마트폰·노트북·태블릿·IT 액세서리를 직접 구매하고 사용한 경험을 바탕으로
                솔직한 리뷰와 구매 가이드를 제공합니다.
              </p>
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
              <p>© 2026 오늘의 IT 블로그. All rights reserved.</p>
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
