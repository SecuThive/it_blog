import type { Metadata } from 'next'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { notFound } from 'next/navigation'
import CommentSection from '../../components/CommentSection'
import ShareButtons from '../../components/ShareButtons'
import PostCard from '../../components/PostCard'
import FaqAccordion from '../../components/FaqAccordion'
import PostToc from '../../components/PostToc'
import CoupangProducts from '../../components/CoupangProducts'
import { getCategoryLabel, getPostBySlug, getPrevNextPost, getRelatedPosts } from '../../lib/posts'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

type PostPageProps = {
  params: Promise<{ slug: string }>
}

function cleanHeading(heading: string) {
  return heading.replace(/\(SEO[^)]*\)/gi, '').trim()
}

// 제목 앞 3단어 추출 (폴백용) — 영어 불용어 제거
const STOP_WORDS = new Set(['the', 'a', 'an', 'with', 'and', 'or', 'for', 'of', 'in', 'on', 'at', 'new', 'all'])

function deriveSearchKeyword(title: string): string {
  return title
    .replace(/[·:·\-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w.toLowerCase()))
    .slice(0, 3)
    .join(' ')
}

// 태그 또는 제목으로 기기별 맞춤 악세사리 키워드 생성
const NOISE_TAGS = new Set([
  'it', 'news', 'apple', 'google', 'microsoft', 'samsung', 'lg',
  'apple-newsroom', '칩셋', '업그레이드', '배터리', '사전예약',
  '최신', '공개', '발표', '정리', '핵심', '출시', '리뷰',
  'thunderbolt5', 'thunderbolt', 'usb', 'npu', 'rtx', 'gtx',
])

function deriveAccessoryKeyword(title: string, tags: string[]): string {
  const productTags = tags
    .filter(t => !NOISE_TAGS.has(t.toLowerCase()) && t.length > 2)
    .slice(0, 2)
    .map(t => t.replace(/-/g, ' '))

  const base = productTags.length > 0
    ? productTags.join(' ')
    : deriveSearchKeyword(title)

  return `${base} 악세사리`
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: '게시글 없음', robots: { index: false } }
  const ogImage = post.coverImageUrl || `${SITE_URL}/og-default.svg`
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `${SITE_URL}/post/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: `${SITE_URL}/post/${post.slug}`,
      publishedTime: post.createdAt,
      tags: post.tags,
      images: [{ url: ogImage, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.createdAt,
    author: { '@type': 'Organization', name: 'ThiveLab' },
    publisher: { '@type': 'Organization', name: 'ThiveLab', url: SITE_URL },
    url: `${SITE_URL}/post/${post.slug}`,
    ...(post.coverImageUrl ? { image: post.coverImageUrl } : {}),
  }

  return (
    <div className="container post-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
                  {cleanHeading(section.heading)}
                </h2>
                <div className="post-md">
                  {section.heading.includes('악세사리') || section.heading.includes('도구 추천') || section.heading.includes('대체재') || section.heading.includes('비교 프레임') ? (
                    <CoupangProducts keyword={deriveAccessoryKeyword(post.title, post.tags)} />
                  ) : section.heading.trim().toLowerCase() === 'faq' || section.heading.includes('FAQ') ? (
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
        <PostToc sections={post.sections} readMinutes={post.readMinutes} />
      </div>

      {/* ── 공유 버튼 ── */}
      <ShareButtons title={post.title} url={`${SITE_URL}/post/${post.slug}`} />

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
