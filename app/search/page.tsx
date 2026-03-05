import type { Metadata } from 'next'
import { searchPosts } from '../lib/posts'
import PostCard from '../components/PostCard'
import SearchBar from '../components/SearchBar'

type Props = { searchParams: Promise<{ q?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `"${q}" 검색 결과` : '검색',
    robots: { index: false },
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''
  const posts = query ? await searchPosts(query) : []

  return (
    <div className="container search-page">
      <div className="search-page__header">
        <h1 className="search-page__title">검색</h1>
        <SearchBar initialQuery={query} />
      </div>

      {query && (
        <p className="search-page__meta">
          <strong>&quot;{query}&quot;</strong> 검색 결과 {posts.length}건
        </p>
      )}

      {query && posts.length === 0 && (
        <p className="search-page__empty">검색 결과가 없습니다. 다른 키워드를 시도해 보세요.</p>
      )}

      {posts.length > 0 && (
        <div className="post-grid">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
