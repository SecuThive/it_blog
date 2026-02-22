import Link from 'next/link'
import { getPostCategorySummaries } from '../lib/posts'

export default async function Navbar() {
  const categories = await getPostCategorySummaries()
  const navItems = [{ href: '/', label: '홈' }, ...categories.map((c) => ({ href: `/category/${c.slug}`, label: c.name }))]

  return (
    <header className="site-header">
      {/* 상단 리본 */}
      <div className="top-ribbon">
        <div className="site-header__inner top-ribbon__inner">
          <div className="top-ribbon__left">
            <span className="top-ribbon__live">LIVE</span>
            <span>프리미엄 IT 상품 큐레이션</span>
            <span className="top-ribbon__sep" aria-hidden="true">·</span>
            <span>매일 오전 9시 업데이트</span>
          </div>
          <nav className="top-ribbon__links" aria-label="보조 메뉴">
            <Link href="/about">소개</Link>
            <span className="top-ribbon__sep" aria-hidden="true">·</span>
            <Link href="/disclaimer">광고·제휴</Link>
            <span className="top-ribbon__sep" aria-hidden="true">·</span>
            <Link href="/contact">문의</Link>
          </nav>
        </div>
      </div>

      {/* 메인 헤더 */}
      <div className="main-header">
        <div className="site-header__inner main-header__inner">
          <Link href="/" className="brand" aria-label="오늘의 IT 블로그 홈">
            오늘의 IT 블로그
          </Link>

          <nav aria-label="메인 메뉴" className="main-nav">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <Link href="/about" className="header-cta">
            블로그 소개
          </Link>
        </div>
      </div>
    </header>
  )
}
