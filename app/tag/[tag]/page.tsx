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

  const canonical = `${SITE_URL}/tag/${encodeURIComponent(summary.tag)}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/og-default.svg`],
    },
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params

  const [summary, posts] = await Promise.all([getTagSummary(tag), getPostsByTag(tag)])
  if (!summary) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `#${summary.tag} | ThiveLab`,
    url: `${SITE_URL}/tag/${encodeURIComponent(summary.tag)}`,
    inLanguage: 'ko-KR',
    isPartOf: { '@type': 'WebSite', name: 'ThiveLab', url: SITE_URL },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: `#${summary.tag}`, item: `${SITE_URL}/tag/${encodeURIComponent(summary.tag)}` },
    ],
  }

  return (
    <div className="container category-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <header className="category-header">
        <p>태그</p>
        <h1>#{summary.tag}</h1>
        <p>{summary.description}</p>
      </header>

      <div className="category-list">
        {posts.length > 0
          ? posts.map((post) => <PostCard key={post.id} post={post} />)
          : <p className="home-empty">글을 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.</p>
        }
      </div>

      <Link href="/" className="back-link">
        홈으로 돌아가기
      </Link>
    </div>
  )
}
