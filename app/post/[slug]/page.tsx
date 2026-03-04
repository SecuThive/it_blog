import type { Metadata } from 'next'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { notFound } from 'next/navigation'
import CommentSection from '../../components/CommentSection'
import PostCard from '../../components/PostCard'
import FaqAccordion from '../../components/FaqAccordion'
import { getCategoryLabel, getPostBySlug, getPrevNextPost, getRelatedPosts } from '../../lib/posts'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

type PostPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: '게시글 없음' }
  return {
    title: `${post.title} | 오늘의 IT 블로그`,
    description: post.description,
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const [relatedPosts, { prev, next }] = await Promise.all([
    getRelatedPosts(post.slug, post.category),
    getPrevNextPost(post.slug),
  ])

  return (
    <div className="container post-page">
      {/* 본문 + 목차 2단 레이아웃 */}
      <div className="post-layout">
        {/* ── 본문 ── */}
        <article className="post-article animate-up">
          <header className="post-header">
            <div className="post-header__top">
              <span className="chip">{getCategoryLabel(post.category)}</span>
              <div className="post-header__meta">
                <span>{post.author}</span>
                <span className="post-meta-dot" />
                <span>{format(new Date(post.createdAt), 'PPP', { locale: ko })}</span>
                <span className="post-meta-dot" />
                <span>{post.readMinutes}분 읽기</span>
              </div>
            </div>

            <h1>{post.title}</h1>
            <p className="post-header__desc">{post.description}</p>

            {post.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="post-header__cover" src={post.coverImageUrl} alt={post.title} />
            ) : null}


            {post.tags.length > 0 && (
              <ul className="tag-list">
                {post.tags.map((tag) => (
                  <li key={tag}>#{tag}</li>
                ))}
              </ul>
            )}
          </header>

          <div className="post-content">
            {post.sections.map((section, idx) => (
              <div key={idx} id={`section-${idx}`} className="post-section">
                <h2>
                  <span className="post-section-num">{String(idx + 1).padStart(2, '0')}</span>
                  {section.heading}
                </h2>
                <div className="post-md">
                  {section.heading.trim().toLowerCase() === 'faq' || section.heading.includes('FAQ') ? (
                    <FaqAccordion text={section.content} />
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                      {section.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* ── 목차 사이드바 ── */}
        {post.sections.length > 0 && (
          <aside className="post-toc animate-up">
            <div className="post-toc__inner">
              <p className="post-toc__label">목차</p>
              <nav>
                <ol className="post-toc__list">
                  {post.sections.map((section, idx) => (
                    <li key={idx} className="post-toc__item">
                      <a href={`#section-${idx}`}>
                        <span className="post-toc__num">{idx + 1}</span>
                        <span>{section.heading}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
              <div className="post-toc__footer">
                <span>{post.readMinutes}분 읽기</span>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── 이전/다음 글 ── */}
      <section className="pager" aria-label="글 이동">
        {next ? <Link href={`/post/${next.slug}`}>← {next.title}</Link> : <span />}
        {prev ? <Link href={`/post/${prev.slug}`}>{prev.title} →</Link> : <span />}
      </section>

      <CommentSection slug={post.slug} />

      {relatedPosts.length > 0 && (
        <section className="related-posts" aria-label="관련 글">
          <h3>같은 카테고리의 다른 글</h3>
          <div className="related-posts__grid">
            {relatedPosts.map((relatedPost) => (
              <PostCard key={relatedPost.id} post={relatedPost} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
