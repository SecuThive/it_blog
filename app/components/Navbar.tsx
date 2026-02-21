import Link from 'next/link'
import { categoryMeta } from '../lib/posts'

const navItems = [
  { href: '/', label: '홈' },
  { href: '/category/smartphone', label: categoryMeta.smartphone.name },
  { href: '/category/laptop', label: categoryMeta.laptop.name },
  { href: '/category/review', label: categoryMeta.review.name },
  { href: '/category/deal', label: categoryMeta.deal.name },
  { href: '/donation', label: '기부공개' },
]

export default function Navbar() {
  return (
    <header className="site-header">
      <div className="top-ribbon">
        <div className="site-header__inner">
          <p>프리미엄 IT 상품 큐레이션</p>
          <span>매일 오전 9시 업데이트</span>
        </div>
      </div>
      <div className="main-header">
        <div className="site-header__inner">
          <Link href="/" className="brand">
            오늘의 IT 블로그
          </Link>
          <nav aria-label="메인 메뉴" className="main-nav">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/donation" className="header-cta">
            기부 참여
          </Link>
        </div>
      </div>
    </header>
  )
}
