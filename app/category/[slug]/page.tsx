import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PostCard from '../../components/PostCard'
import { getPostCategorySummary, getPostsByCategory } from '../../lib/posts'

type CategoryPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const summary = await getPostCategorySummary(slug)

  if (!summary) {
    return { title: '카테고리 없음' }
  }

  return {
    title: `${summary.name} | 오늘의 IT 블로그`,
    description: summary.description,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const [summary, posts] = await Promise.all([getPostCategorySummary(slug), getPostsByCategory(slug)])
  if (!summary || posts.length === 0) notFound()

  return (
    <div className="container category-page">
      <header className="category-header">
        <p>카테고리</p>
        <h1>{summary.name}</h1>
        <p>{summary.description}</p>
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
