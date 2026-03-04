import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import PostCard from './components/PostCard'
import { getAllPosts, getFeaturedPosts, getPostCategorySummaries, getCategoryLabel } from './lib/posts'

export const revalidate = 3600

export default async function Home() {
  const [featured, allPosts, categories] = await Promise.all([
    getFeaturedPosts(),
    getAllPosts(),
    getPostCategorySummaries(),
  ])
  const hotPosts = allPosts.slice(0, 5)
  const leadPost = allPosts[0]
  const leadSecondary = allPosts.slice(1, 4)

  return (
    <div className="container home">

      {/* ── 히어로 섹션 ───────────────────────────── */}
      <section className="home-hero animate-up" aria-label="메인 히어로">
        <div className="home-hero__main">
          <div className="home-hero__eyebrow">
            <span className="home-hero__live-dot" />
            TODAY&apos;S PICK
          </div>

          {leadPost ? (
            <>
              <div className="home-hero__chip">
                {getCategoryLabel(leadPost.category)}
              </div>
              <h1 className="home-hero__title">{leadPost.title}</h1>
              <p className="home-hero__desc">{leadPost.description}</p>
              <div className="home-hero__meta">
                <span>{format(new Date(leadPost.createdAt), 'PPP', { locale: ko })}</span>
                <span className="home-hero__meta-dot" />
                <span>{leadPost.author}</span>
                <span className="home-hero__meta-dot" />
                <span>{leadPost.readMinutes}분 읽기</span>
              </div>
              <Link href={`/post/${leadPost.slug}`} className="home-hero__cta">
                메인 리뷰 보기
              </Link>
            </>
          ) : (
            <>
              <h1 className="home-hero__title">아직 등록된 포스트가 없습니다.</h1>
              <p className="home-hero__desc">DB에 포스트를 추가하면 메인 콘텐츠가 자동으로 노출됩니다.</p>
            </>
          )}
        </div>

        <aside className="home-hero__ranking">
          <div className="home-hero__ranking-header">
            <span className="home-hero__ranking-icon">🔥</span>
            <span>지금 많이 찾는 글</span>
          </div>
          <ol className="home-ranking-list">
            {hotPosts.map((post, index) => (
              <li key={post.id} className="home-ranking-item">
                <span className={`home-ranking-num${index === 0 ? ' is-top' : ''}`}>{index + 1}</span>
                <Link href={`/post/${post.slug}`}>{post.title}</Link>
              </li>
            ))}
            {hotPosts.length === 0 && (
              <li className="home-ranking-empty">포스트를 추가해주세요</li>
            )}
          </ol>
        </aside>

        {/* 배경 데코 */}
        <div className="home-hero__deco" aria-hidden="true" />
      </section>

      {/* ── 공지 바 ───────────────────────────────── */}
      <div className="home-notice animate-up">
        <span className="home-notice__badge">공지</span>
        <p>체험단/협찬 여부와 실제 구매 만족도 기준을 명확히 구분해서 리뷰합니다.</p>
      </div>

      {/* ── 통계 바 ───────────────────────────────── */}
      <div className="home-stats animate-up" aria-label="블로그 통계">
        <div className="home-stat">
          <strong data-count={allPosts.length} data-suffix="+">{allPosts.length}+</strong>
          <span>누적 리뷰</span>
        </div>
        <div className="home-stat">
          <strong data-count={categories.length} data-suffix="">{categories.length}</strong>
          <span>카테고리</span>
        </div>
        <div className="home-stat home-stat--text">
          <strong>매일</strong>
          <span>업데이트</span>
        </div>
      </div>

      {/* ── 에디터 추천 ───────────────────────────── */}
      <section className="animate-up" aria-label="에디터 추천">
        <div className="home-section-header">
          <div>
            <h2>에디터 추천</h2>
            <p>구매 만족도가 높았던 콘텐츠</p>
          </div>
          <span className="home-section-badge">FEATURED</span>
        </div>
        <div className="featured-grid">
          {featured.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {featured.length === 0 && (
            <p className="home-empty">추천 포스트가 없습니다.</p>
          )}
        </div>
      </section>

      {/* ── 최신 발행 + 사이드바 ─────────────────── */}
      <section className="content-grid">
        <div>
          <div className="home-section-header">
            <div>
              <h2>최신 발행 글</h2>
              <p>업데이트 {format(new Date(), 'PPP', { locale: ko })}</p>
            </div>
          </div>
          <div className="post-list">
            {allPosts.map((post) => (
              <PostCard key={post.id} post={post} compact />
            ))}
            {allPosts.length === 0 && <p className="home-empty">등록된 글이 없습니다.</p>}
          </div>
        </div>

        <aside className="sidebar animate-up" aria-label="사이드바">
          <section className="sidebar-card">
            <h3>카테고리</h3>
            <ul>
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link href={`/category/${category.slug}`}>{category.name}</Link>
                  <p>{category.description}</p>
                </li>
              ))}
              {categories.length === 0 && <li>카테고리 데이터가 없습니다.</li>}
            </ul>
          </section>

          <section className="sidebar-card">
            <h3>빠른 요약</h3>
            <ul>
              {leadSecondary.map((post) => (
                <li key={post.id}>
                  <Link href={`/post/${post.slug}`}>{post.title}</Link>
                  <p>{post.description}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="sidebar-card sidebar-card--notice">
            <h3>구매 체크포인트</h3>
            <p>가격만 보지 말고 AS 정책, 배송 조건, 반품 가능 기간까지 함께 비교하세요.</p>
          </section>
        </aside>
      </section>
    </div>
  )
}
