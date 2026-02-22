import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import PostCard from './components/PostCard'
// import { getDonationSummary, formatKrw } from './lib/donations'
import { getAllPosts, getFeaturedPosts, getPostCategorySummaries } from './lib/posts'

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
  // const donationSummary = await getDonationSummary()

  return (
    <div className="container home">
      <section className="notice-bar" aria-label="공지">
        <strong>NOTICE</strong>
        <p>체험단/협찬 여부와 실제 구매 만족도 기준을 명확히 구분해서 리뷰합니다.</p>
      </section>

      <section className="lead-board" aria-label="메인 보드">
        <article className="lead-main">
          <p className="hero__eyebrow">TODAY&apos;S PICK</p>
          {leadPost ? (
            <>
              <h1>{leadPost.title}</h1>
              <p>{leadPost.description}</p>
              <div className="lead-main__meta">
                <span>{format(new Date(leadPost.createdAt), 'PPP', { locale: ko })}</span>
                <span>{leadPost.author}</span>
                <span>{leadPost.readMinutes}분 읽기</span>
              </div>
              <Link href={`/post/${leadPost.slug}`} className="lead-main__cta">
                메인 리뷰 보기
              </Link>
            </>
          ) : (
            <>
              <h1>아직 등록된 포스트가 없습니다.</h1>
              <p>DB에 포스트를 추가하면 메인 콘텐츠가 자동으로 노출됩니다.</p>
            </>
          )}
        </article>

        <aside className="lead-side">
          <h2>지금 많이 찾는 글</h2>
          <ol>
            {hotPosts.map((post, index) => (
              <li key={post.id}>
                <span>{index + 1}</span>
                <Link href={`/post/${post.slug}`}>{post.title}</Link>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <section aria-label="에디터 추천">
        <div className="section-title-row">
          <h2>에디터 추천</h2>
          <span>구매 만족도가 높았던 콘텐츠</span>
        </div>
        <div className="featured-grid">
          {featured.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      <section className="content-grid">
        <div>
          <div className="section-title-row">
            <h2>최신 발행 글</h2>
            <span>업데이트 {format(new Date(), 'PPP', { locale: ko })}</span>
          </div>
          <div className="post-list">
            {allPosts.map((post) => (
              <PostCard key={post.id} post={post} compact />
            ))}
            {allPosts.length === 0 ? <p>등록된 글이 없습니다.</p> : null}
          </div>
        </div>

        <aside className="sidebar" aria-label="사이드바">
          {/* 기부 투명성 공개 카드 (비활성화)
          <section className="sidebar-card sidebar-card--donation">
            <h3>기부 투명성 공개</h3>
            <div className="donation-mini">
              <p>
                <span>누적 후원금</span>
                <strong>{formatKrw(donationSummary.incomeTotal)}</strong>
              </p>
              <p>
                <span>누적 집행금</span>
                <strong>{formatKrw(donationSummary.expenseTotal)}</strong>
              </p>
              <p>
                <span>현재 잔액</span>
                <strong>{formatKrw(donationSummary.balance)}</strong>
              </p>
            </div>
            <Link href="/donation" className="sidebar-card__link">
              전체 기부 내역 보기
            </Link>
          </section>
          */}

          <section className="sidebar-card">
            <h3>카테고리</h3>
            <ul>
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link href={`/category/${category.slug}`}>{category.name}</Link>
                  <p>{category.description}</p>
                </li>
              ))}
              {categories.length === 0 ? <li>카테고리 데이터가 없습니다.</li> : null}
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
