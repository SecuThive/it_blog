import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '블로그 소개 | ThiveLab',
  description: 'ThiveLab은 한국 소비자 관점에서 최신 IT 정보를 큐레이션하는 IT 인사이트 미디어입니다. 스마트폰·노트북·AI 서비스 최신 소식을 빠르고 정확하게 전달합니다.',
}

const principles = [
  {
    title: '한국 소비자 중심',
    description:
      '글로벌 리뷰 그대로가 아닌, 국내 출시 일정·가격·통신사 정책·AS 환경·소비자보호법을 기준으로 정보를 재해석합니다. 해외 직구가 유리한 경우도 솔직하게 안내합니다.',
  },
  {
    title: '정보 정확성',
    description:
      '공식 발표 출처를 명시하고, 가격·사양 정보는 작성 시점 기준으로 표기합니다. 오류 제보를 적극 수용하고 신속히 수정합니다.',
  },
  {
    title: '편집 독립성',
    description:
      '쿠팡 파트너스 등 제휴 링크를 통해 수익을 얻을 수 있으나, 수익 구조가 콘텐츠 평가에 영향을 주지 않습니다. 더 나은 제품이 있으면 비제휴 제품을 먼저 소개합니다.',
  },
  {
    title: '광고·협찬 투명 고지',
    description:
      '협찬·체험단을 통해 작성된 콘텐츠는 본문 상단에 명확히 고지합니다. 표기 없는 콘텐츠는 에디터가 직접 비용을 지불하거나 공개 발표 자료를 기반으로 작성된 것입니다.',
  },
]

const coverageAreas = [
  {
    category: 'AI · 서비스',
    items: ['ChatGPT·Gemini·Claude 주요 업데이트', 'AI 서비스 국내 출시 및 활용 가이드', '생성형 AI 비교 및 실사용 팁'],
  },
  {
    category: 'IT 뉴스',
    items: ['애플·삼성·구글·MS 공식 발표 정리', '국내 출시 일정·가격 분석', '기술 정책·산업 이슈 해설'],
  },
  {
    category: '노트북 · 태블릿',
    items: ['신제품 스펙 분석 및 구매 가이드', '학생·직장인 용도별 추천', '예산별 최적 모델 비교'],
  },
  {
    category: '스마트폰',
    items: ['신제품 출시 분석 및 국내 구매 가이드', '통신사 혜택·공시지원금 정리', '기기 간 실사용 비교'],
  },
]

export default function AboutPage() {
  return (
    <div className="container info-page">
      {/* 페이지 헤더 */}
      <header className="info-hero">
        <p className="info-hero__eyebrow">ABOUT</p>
        <h1>ThiveLab 소개</h1>
        <p className="info-hero__lead">
          한국 소비자 관점의 IT 큐레이션 미디어.
          <br className="hide-mobile" />
          최신 IT 정보를 빠르고 정확하게, 실생활에 유용하게 전달합니다.
        </p>
      </header>

      {/* 미션 */}
      <section className="info-section">
        <h2>왜 만들었나요?</h2>
        <div className="info-prose">
          <p>
            인터넷에는 IT 리뷰와 뉴스가 넘쳐나지만, 대부분은 협찬·광고 여부를 명확히 밝히지 않거나
            글로벌 관점에서만 작성되어 국내 실구매 환경과 거리가 멀습니다.
          </p>
          <p>
            <strong>ThiveLab</strong>은 국내 소비자가 실제로 알아야 할 정보—국내 출시 일정,
            정발 가격, 통신사 정책, AS 조건, 직구 총비용—를 중심으로 IT 정보를 정리합니다.
            빠른 업데이트와 투명한 출처 표기를 원칙으로 운영합니다.
          </p>
        </div>
      </section>

      {/* 에디터 소개 */}
      <section className="info-section">
        <h2>에디터 소개</h2>
        <div className="writer-grid">
          <article className="writer-card">
            <div className="writer-avatar">D</div>
            <div className="writer-info">
              <h3>DevThive</h3>
              <p className="writer-role">블로그 운영자 · 에디터</p>
              <p className="writer-bio">
                국내외 IT 공식 발표 및 최신 소식을 직접 검토하고 한국 소비자 관점에서 재해석합니다.
                스마트폰·노트북·태블릿·AI 서비스 전 분야를 다루며, 가성비·실사용 중심의
                편집 기준을 유지합니다. 정보 오류나 편향이 없도록 출처를 꼼꼼히 확인합니다.
              </p>
              <div className="writer-tags">
                {['스마트폰', '노트북', 'AI 서비스', '구매가이드', 'IT 뉴스'].map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* 다루는 콘텐츠 */}
      <section className="info-section">
        <h2>다루는 콘텐츠</h2>
        <div className="info-prose">
          <p>
            최신 IT 발표를 한국 소비자 관점으로 빠르게 정리하고, 구매 결정에 필요한
            체크포인트를 함께 제공합니다.
          </p>
        </div>
        <div className="info-principles">
          {coverageAreas.map((area) => (
            <article key={area.category} className="principle-card">
              <h3>{area.category}</h3>
              <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
                {area.items.map((item) => (
                  <li key={item} style={{ marginBottom: '0.3em', fontSize: '0.92em' }}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
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

      {/* 콘텐츠 제작 방식 — 간략 고지 */}
      <section className="info-section">
        <h2>콘텐츠 제작 방식</h2>
        <div className="info-prose">
          <p>
            ThiveLab은 국내외 IT 공식 채널·뉴스룸의 최신 발표를 빠르게 모니터링하고,
            에디터가 직접 내용을 검토·정리해 게시합니다. 콘텐츠 초안 작성 과정에서
            최신 IT 도구를 보조적으로 활용하며, 모든 게시물은 에디터의 검수를 거쳐
            정확성과 편집 기준을 확인한 후 발행됩니다.
          </p>
          <p>
            정보 오류나 사실과 다른 내용을 발견하셨다면{' '}
            <Link href="/contact">문의 페이지</Link>를 통해 알려주세요.
            빠르게 확인하고 수정하겠습니다.
          </p>
        </div>
      </section>

      {/* 문의 안내 */}
      <section className="info-section">
        <h2>연락처</h2>
        <div className="info-prose">
          <p>
            오류 제보, 콘텐츠 관련 문의, 협찬·제휴 제안은{' '}
            <Link href="/contact">문의 페이지</Link>를 통해 남겨주세요.
            광고·제휴 수익 구조에 대한 자세한 내용은{' '}
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
