import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import Navbar from './components/Navbar'

export const metadata: Metadata = {
  title: '오늘의 IT 블로그',
  description: '스마트폰, 노트북, 태블릿, IT 액세서리 리뷰와 구매가이드를 다루는 블로그',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <div className="page-bg" />
        <Navbar />
        <main className="page-main">{children}</main>
        <footer className="site-footer">
          <div className="container">
            <p>© 2026 오늘의 IT 블로그</p>
            <p>
              IT 상품 선택에 도움이 되는 리뷰와 구매 정보를 전합니다. <Link href="/donation">기부 내역 공개 보기</Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
