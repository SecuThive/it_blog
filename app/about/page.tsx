import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '블로그 소개 | 오늘의 IT 블로그',
  description: '오늘의 IT 블로그는 스마트폰, 노트북, 태블릿, IT 액세서리를 직접 구매·사용한 경험을 바탕으로 솔직한 리뷰와 구매 가이드를 제공합니다.',
}

const writers = [
  {
    name: 'DevThive',
    role: '블로그 운영자 & 에디터',
    bio: 'IT 기기를 직접 구매하고 실사용한 경험을 바탕으로 스마트폰·노트북·태블릿·액세서리 전 분야를 다룹니다. 체험단·협찬 제품과 자비 구매 제품을 명확히 구분하는 것이 원칙입니다.',
    categories: ['스마트폰', '노트북', '상품 리뷰', '구매가이드'],
  },
]

const principles = [
  {
    title: '직접 구매 원칙',
    description:
      '리뷰 제품은 가능한 자비로 구매합니다. 체험단·협찬을 받은 경우 본문 상단에 명확히 표기하며, 이는 평가에 영향을 주지 않습니다.',
  },
  {
    title: '실사용 기반 평가',
    description:
      '스펙 수치가 아닌 실제 사용 환경에서의 경험을 중심으로 서술합니다. 장기 사용 후 변화(배터리 열화, 소프트웨어 업데이트 등)도 반영합니다.',
  },
  {
    title: '구매 환경 반영',
    description:
      '글로벌 리뷰가 아닌 국내 가격, 통신사 정책, AS 환경, 소비자보호법을 기준으로 작성합니다. 해외 직구가 유리한 경우도 솔직하게 안내합니다.',
  },
  {
    title: '광고·제휴 투명성',
    description:
      '이 블로그는 쿠팡 파트너스, 제조사 제휴 링크를 통해 수익을 얻을 수 있습니다. 수익 구조가 리뷰 내용에 영향을 주지 않도록 편집 독립성을 유지합니다.',
  },
]

export default function AboutPage() {
  return (
    <div className="container info-page">
      {/* 페이지 헤더 */}
      <header className="info-hero">
        <p className="info-hero__eyebrow">ABOUT</p>
        <h1>블로그 소개</h1>
        <p className="info-hero__lead">
          오늘의 IT 블로그는 스마트폰·노트북·태블릿·IT 액세서리를 직접 사용한 경험을 바탕으로
          <br className="hide-mobile" />
          솔직하고 실용적인 리뷰와 구매 가이드를 제공합니다.
        </p>
      </header>

      {/* 블로그 소개 */}
      <section className="info-section">
        <h2>왜 만들었나요?</h2>
        <div className="info-prose">
          <p>
            인터넷에는 IT 리뷰가 넘쳐나지만, 대부분은 협찬·광고 여부를 명확히 밝히지 않거나 국내
            구매 환경과 거리가 먼 내용을 담고 있습니다. 한국에서 실제로 구매하고, 실제로 쓰는
            사람 입장에서 &quot;이 돈 내고 살 만한가?&quot;라는 질문에 솔직하게 답하는 공간을
            만들고 싶었습니다.
          </p>
        </div>
      </section>

      {/* 운영 원칙 */}
      <section className="info-section">
        <h2>운영 원칙</h2>
        <div className="info-principles">
          {principles.map((p) => (
            <article key={p.title} className="principle-card">
              <h3>{p.title}</h3>
              <p>{p.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 에디터 소개 */}
      <section className="info-section">
        <h2>에디터 소개</h2>
        <div className="writer-grid">
          {writers.map((w) => (
            <article key={w.name} className="writer-card">
              <div className="writer-avatar">{w.name[0]}</div>
              <div className="writer-info">
                <h3>{w.name}</h3>
                <p className="writer-role">{w.role}</p>
                <p className="writer-bio">{w.bio}</p>
                <div className="writer-tags">
                  {w.categories.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 다루는 콘텐츠 */}
      <section className="info-section">
        <h2>다루는 콘텐츠</h2>
        <div className="info-prose">
          <ul>
            <li>
              <strong>스마트폰</strong> — 신제품 출시 분석, 기기 간 비교, 국내 구매 가이드, 통신사
              혜택 정리
            </li>
            <li>
              <strong>노트북 / 태블릿</strong> — 학생·직장인 용도별 추천, 성능 비교, 배터리·휴대성
              실측 리뷰
            </li>
            <li>
              <strong>상품 리뷰</strong> — IT 기기·액세서리 실사용 후기 (협찬 여부 명기)
            </li>
            <li>
              <strong>구매가이드</strong> — 할인 정보, 예산별 추천, 구매 전 체크리스트
            </li>
          </ul>
        </div>
      </section>

      {/* 문의 안내 */}
      <section className="info-section">
        <h2>연락처</h2>
        <div className="info-prose">
          <p>
            제품 협찬 제안, 오류 제보, 콘텐츠 관련 문의는{' '}
            <Link href="/contact">문의 페이지</Link>를 통해 남겨주세요.
            광고·제휴에 대한 자세한 내용은{' '}
            <Link href="/disclaimer">광고·제휴 고지</Link>를 확인하세요.
          </p>
        </div>
      </section>

      <div className="info-back">
        <Link href="/">← 홈으로 돌아가기</Link>
      </div>
    </div>
  )
}
