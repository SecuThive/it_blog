import type { Metadata } from 'next'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { notFound } from 'next/navigation'
import CommentSection from '../../components/CommentSection'
import PostCard from '../../components/PostCard'
import { getCategoryLabel, getPostBySlug, getPrevNextPost, getRelatedPosts } from '../../lib/posts'

type PostPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return { title: '게시글 없음' }
  }

  return {
    title: `${post.title} | 오늘의 IT 블로그`,
    description: post.description,
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const [relatedPosts, { prev, next }] = await Promise.all([
    getRelatedPosts(post.slug, post.category),
    getPrevNextPost(post.slug),
  ])

  return (
    <div className="container post-page">
      <article className="post-article">
        <header className="post-header">
          <span className="chip">{getCategoryLabel(post.category)}</span>
          <h1>{post.title}</h1>
          <p>{post.description}</p>
          <div className="post-header__meta">
            <span>{post.author}</span>
            <span>{format(new Date(post.createdAt), 'PPP', { locale: ko })}</span>
            <span>{post.readMinutes}분 읽기</span>
          </div>
          <ul className="tag-list">
            {post.tags.map((tag) => (
              <li key={tag}>#{tag}</li>
            ))}
          </ul>
        </header>

        <div className="post-content">
          {post.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.content}</p>
            </section>
          ))}
        </div>
      </article>

      <section className="pager" aria-label="글 이동">
        {next ? <Link href={`/post/${next.slug}`}>← 더 최신 글: {next.title}</Link> : <span />}
        {prev ? <Link href={`/post/${prev.slug}`}>이전 글: {prev.title} →</Link> : <span />}
      </section>

      <CommentSection slug={post.slug} />

      {relatedPosts.length > 0 ? (
        <section className="related-posts" aria-label="관련 글">
          <h3>같은 카테고리의 다른 글</h3>
          <div className="related-posts__grid">
            {relatedPosts.map((relatedPost) => (
              <PostCard key={relatedPost.id} post={relatedPost} compact />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
