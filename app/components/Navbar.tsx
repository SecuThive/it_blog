import Link from 'next/link'
import NavCategoryDropdown from './NavCategoryDropdown'

export default function Navbar() {
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
          <Link href="/" className="brand" aria-label="ThiveLab 홈">
            ThiveLab
          </Link>

          <nav aria-label="메인 메뉴" className="main-nav">
            <Link href="/">홈</Link>
            <NavCategoryDropdown />
          </nav>

          <Link href="/about" className="header-cta">
            블로그 소개
          </Link>
        </div>
      </div>
    </header>
  )
}
