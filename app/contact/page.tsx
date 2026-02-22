import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '문의하기 | 오늘의 IT 블로그',
  description: '블로그 관련 문의, 오류 제보, 제품 협찬 제안은 이 페이지를 통해 남겨주세요.',
}

const contactTopics = [
  {
    icon: '✉',
    title: '오류·정보 수정 제보',
    description:
      '리뷰 내용 중 사실과 다른 부분이나 업데이트가 필요한 정보를 발견하셨으면 알려주세요. 확인 후 신속히 수정하겠습니다.',
  },
  {
    icon: '📦',
    title: '협찬·제품 제공 제안',
    description:
      '제품 협찬을 제안하실 경우, 협찬 여부는 반드시 본문에 공개합니다. 협찬이 리뷰 결과에 영향을 주지 않는다는 점을 양해 부탁드립니다.',
  },
  {
    icon: '🤝',
    title: '비즈니스·제휴 문의',
    description:
      '광고 집행, 콘텐츠 제휴, 기타 비즈니스 협력 관련 문의를 환영합니다. 자세한 내용은 광고·제휴 고지 페이지도 함께 확인해주세요.',
  },
  {
    icon: '💬',
    title: '기타 문의',
    description:
      '블로그 운영에 관한 의견, 개인정보 관련 요청, 그 밖의 문의 사항도 남겨주세요.',
  },
]

export default function ContactPage() {
  return (
    <div className="container info-page">
      <header className="info-hero info-hero--sm">
        <p className="info-hero__eyebrow">CONTACT</p>
        <h1>문의하기</h1>
        <p className="info-hero__lead">
          오류 제보, 협찬 제안, 비즈니스 문의 등 블로그 관련 내용을 남겨주세요.
          <br className="hide-mobile" />
          보통 2–3 영업일 내에 답변드립니다.
        </p>
      </header>

      {/* 문의 유형 */}
      <section className="info-section">
        <h2>어떤 내용인가요?</h2>
        <div className="contact-topics">
          {contactTopics.map((t) => (
            <article key={t.title} className="contact-topic-card">
              <span className="contact-topic-icon">{t.icon}</span>
              <div>
                <h3>{t.title}</h3>
                <p>{t.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 문의 폼 */}
      <section className="info-section">
        <h2>문의 남기기</h2>
        <p className="info-section__desc">
          아래 양식을 작성해 주시면 검토 후 이메일로 회신드립니다.
        </p>
        <form className="contact-form" action="#" method="POST">
          <div className="contact-form__row">
            <div className="contact-form__field">
              <label htmlFor="cf-name">이름 *</label>
              <input
                id="cf-name"
                name="name"
                type="text"
                placeholder="홍길동"
                required
                autoComplete="name"
              />
            </div>
            <div className="contact-form__field">
              <label htmlFor="cf-email">이메일 *</label>
              <input
                id="cf-email"
                name="email"
                type="email"
                placeholder="example@email.com"
                required
                autoComplete="email"
              />
            </div>
          </div>
          <div className="contact-form__field">
            <label htmlFor="cf-subject">문의 유형</label>
            <select id="cf-subject" name="subject">
              <option value="">선택해주세요</option>
              <option value="correction">오류·정보 수정 제보</option>
              <option value="sponsorship">협찬·제품 제공 제안</option>
              <option value="business">비즈니스·제휴 문의</option>
              <option value="privacy">개인정보 관련 요청</option>
              <option value="other">기타</option>
            </select>
          </div>
          <div className="contact-form__field">
            <label htmlFor="cf-message">문의 내용 *</label>
            <textarea
              id="cf-message"
              name="message"
              rows={6}
              placeholder="문의하실 내용을 자세히 작성해 주세요."
              required
            />
          </div>
          <p className="contact-form__notice">
            제출하시면 <Link href="/privacy">개인정보처리방침</Link>에 동의하는 것으로
            간주합니다.
          </p>
          <button type="submit" className="contact-form__submit">
            문의 보내기
          </button>
        </form>
      </section>

      {/* 관련 링크 */}
      <section className="info-section">
        <h2>관련 페이지</h2>
        <div className="info-links">
          <Link href="/about" className="info-link-card">
            <strong>블로그 소개</strong>
            <span>에디터 소개와 운영 원칙을 확인하세요</span>
          </Link>
          <Link href="/disclaimer" className="info-link-card">
            <strong>광고·제휴 고지</strong>
            <span>광고 수익 구조와 협찬 정책을 확인하세요</span>
          </Link>
          <Link href="/privacy" className="info-link-card">
            <strong>개인정보처리방침</strong>
            <span>수집 정보와 이용 목적을 확인하세요</span>
          </Link>
        </div>
      </section>

      <div className="info-back">
        <Link href="/">← 홈으로 돌아가기</Link>
      </div>
    </div>
  )
}
