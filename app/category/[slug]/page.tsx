import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PostCard from '../../components/PostCard'
import { categoryMeta, getPostsByCategory, type PostCategory } from '../../lib/posts'

type CategoryPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  if (!(slug in categoryMeta)) {
    return { title: '카테고리 없음' }
  }

  const category = slug as PostCategory
  return {
    title: `${categoryMeta[category].name} | 오늘의 IT 블로그`,
    description: categoryMeta[category].description,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params

  if (!(slug in categoryMeta)) {
    notFound()
  }

  const category = slug as PostCategory
  const posts = getPostsByCategory(category)

  return (
    <div className="container category-page">
      <header className="category-header">
        <p>카테고리</p>
        <h1>{categoryMeta[category].name}</h1>
        <p>{categoryMeta[category].description}</p>
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
