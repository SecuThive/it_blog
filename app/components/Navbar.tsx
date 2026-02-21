import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tighter text-slate-900">
          IT BLOG<span className="text-blue-600">.</span>
        </Link>
        <div className="flex gap-6 text-sm font-medium text-slate-600">
          <Link href="/" className="hover:text-blue-600 transition-colors">홈</Link>
          <Link href="/category/news" className="hover:text-blue-600 transition-colors">최신뉴스</Link>
          <Link href="/category/review" className="hover:text-blue-600 transition-colors">리뷰</Link>
        </div>
      </div>
    </nav>
  )
}
