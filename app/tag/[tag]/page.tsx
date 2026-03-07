import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PostCard from '../../components/PostCard'
import { getPostsByTag, getTagSummary } from '../../lib/posts'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'

type TagPageProps = {
  params: Promise<{ tag: string }>
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params
  const summary = await getTagSummary(tag)

  if (!summary) return { title: '태그 없음', robots: { index: false } }

  const title = `#${summary.tag} | ThiveLab`
  const description = `#${summary.tag} 관련 글 ${summary.count}개 모음 — 최신 IT 소식/업데이트를 모아봅니다.`

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/tag/${encodeURIComponent(summary.tag)}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${SITE_URL}/tag/${encodeURIComponent(summary.tag)}`,
    },
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params

  const [summary, posts] = await Promise.all([getTagSummary(tag), getPostsByTag(tag)])
  if (!summary || posts.length === 0) notFound()

  return (
    <div className="container category-page">
      <header className="category-header">
        <p>태그</p>
        <h1>#{summary.tag}</h1>
        <p>관련 글 {summary.count}개</p>
      </header>

      <div className="category-list">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <Link href="/" className="back-link">
        홈으로 돌아가기
      </Link>
    </div>
  )
}
