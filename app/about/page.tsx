import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '블로그 소개 | 오늘의 IT 블로그',
  description: '오늘의 IT 블로그는 AI가 수집·작성한 IT 콘텐츠를 사람 에디터가 검수해 제공하는 AI 운영 블로그입니다.',
}

const writers = [
  {
    name: 'DevThive',
    role: '블로그 운영자 & 에디터',
    bio: 'AI가 수집·초안 작성한 콘텐츠를 검토·보완하며 블로그를 운영합니다. 스마트폰·노트북·태블릿·액세서리 전 분야를 다루며, 정보 오류나 편향이 없도록 편집 기준을 유지합니다.',
    categories: ['스마트폰', '노트북', '상품 리뷰', '구매가이드'],
  },
]

const principles = [
  {
    title: 'AI 운영 투명성',
    description:
      '이 블로그는 AI가 콘텐츠를 수집·작성하며 사람 에디터가 검수합니다. AI 활용 사실을 숨기지 않고 독자에게 투명하게 공개하는 것이 원칙입니다.',
  },
  {
    title: '정보 정확성 유지',
    description:
      'AI가 생성한 콘텐츠는 오류 가능성이 있습니다. 오류 신고를 적극 수용하고 신속히 수정합니다. 중요한 정보는 공식 출처를 함께 제공합니다.',
  },
  {
    title: '구매 환경 반영',
    description:
      '글로벌 리뷰가 아닌 국내 가격, 통신사 정책, AS 환경, 소비자보호법을 기준으로 작성합니다. 해외 직구가 유리한 경우도 솔직하게 안내합니다.',
  },
  {
    title: '광고·제휴 투명성',
    description:
      '이 블로그는 쿠팡 파트너스, 제조사 제휴 링크를 통해 수익을 얻을 수 있습니다. 수익 구조가 콘텐츠 내용에 영향을 주지 않도록 편집 독립성을 유지합니다.',
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
          오늘의 IT 블로그는 AI가 수집·작성한 IT 콘텐츠를 사람 에디터가 검수·보완하는
          <br className="hide-mobile" />
          AI 운영 블로그입니다. 정보의 정확성과 투명성을 최우선으로 합니다.
        </p>
      </header>

      {/* AI 운영 공개 배너 */}
      <section className="info-section info-ai-notice">
        <div className="ai-notice-badge">🤖 AI-Powered Blog</div>
        <h2>이 블로그는 AI가 운영합니다</h2>
        <div className="info-prose">
          <p>
            <strong>오늘의 IT 블로그</strong>는 AI(인공지능)가 최신 IT 정보를 수집하고 초안을
            작성하며, 사람 에디터가 이를 검토·보완하는 <strong>AI 운영 블로그</strong>입니다.
            콘텐츠 생성 과정에서 AI를 활용한다는 사실을 투명하게 밝힙니다.
          </p>
          <p>
            AI가 작성한 글은 최신 정보를 빠르게 반영할 수 있다는 장점이 있지만, 때로는 오류나
            부정확한 정보가 포함될 수 있습니다. 오류를 발견하셨다면{' '}
            <Link href="/contact">문의 페이지</Link>를 통해 알려주세요. 빠르게 수정하겠습니다.
          </p>
        </div>
      </section>

      {/* 블로그 소개 */}
      <section className="info-section">
        <h2>왜 만들었나요?</h2>
        <div className="info-prose">
          <p>
            인터넷에는 IT 리뷰가 넘쳐나지만, 대부분은 협찬·광고 여부를 명확히 밝히지 않거나 국내
            구매 환경과 거리가 먼 내용을 담고 있습니다. AI를 활용해 더 빠르고 폭넓은 IT 정보를
            제공하면서도, 정보의 신뢰성과 투명성을 지키는 공간을 만들고자 했습니다.
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
