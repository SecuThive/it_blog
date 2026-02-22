import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '개인정보처리방침 | 오늘의 IT 블로그',
  description: '오늘의 IT 블로그 개인정보처리방침입니다.',
}

export default function PrivacyPage() {
  return (
    <div className="container info-page">
      <header className="info-hero info-hero--sm">
        <p className="info-hero__eyebrow">PRIVACY POLICY</p>
        <h1>개인정보처리방침</h1>
        <p className="info-hero__date">최종 업데이트: 2026년 2월 21일</p>
      </header>

      <div className="info-doc">
        <section className="info-doc__section">
          <h2>1. 개인정보 수집 항목 및 수집 방법</h2>
          <p>
            오늘의 IT 블로그(이하 &quot;블로그&quot;)는 다음과 같은 개인정보를 수집할 수 있습니다.
          </p>
          <ul>
            <li>
              <strong>댓글 작성 시:</strong> 닉네임(필수), 이메일 주소(선택)
            </li>
            <li>
              <strong>문의 양식 제출 시:</strong> 이름, 이메일 주소, 문의 내용
            </li>
            <li>
              <strong>자동 수집 정보:</strong> 방문 IP 주소, 브라우저 종류, 방문 일시, 서비스 이용
              기록 (Google Analytics, Google AdSense를 통해 수집될 수 있음)
            </li>
          </ul>
        </section>

        <section className="info-doc__section">
          <h2>2. 개인정보 수집 및 이용 목적</h2>
          <ul>
            <li>댓글 서비스 운영 및 스팸·어뷰징 방지</li>
            <li>문의 사항 확인 및 답변</li>
            <li>서비스 이용 통계 분석 및 품질 개선</li>
            <li>맞춤형 광고 제공 (Google AdSense)</li>
          </ul>
        </section>

        <section className="info-doc__section">
          <h2>3. 개인정보 보유 및 이용 기간</h2>
          <p>
            블로그는 개인정보 수집 목적이 달성된 후 해당 정보를 즉시 파기합니다. 단, 관계 법령에
            의해 보존할 필요가 있는 경우에는 법령에서 정한 기간 동안 보관합니다.
          </p>
          <ul>
            <li>댓글 정보: 삭제 요청 시 또는 블로그 서비스 종료 시까지</li>
            <li>문의 기록: 문의 처리 완료 후 6개월</li>
          </ul>
        </section>

        <section className="info-doc__section">
          <h2>4. 개인정보의 제3자 제공</h2>
          <p>
            블로그는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 아래의
            경우에는 예외로 합니다.
          </p>
          <ul>
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의거하거나 수사기관의 요구가 있는 경우</li>
          </ul>
        </section>

        <section className="info-doc__section">
          <h2>5. 쿠키(Cookie) 사용</h2>
          <p>
            블로그는 Google Analytics 및 Google AdSense 운영을 위해 쿠키를 사용합니다. 쿠키는
            웹사이트가 사용자 컴퓨터에 저장하는 소규모 텍스트 파일입니다.
          </p>
          <p>
            이용자는 브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있습니다. 단, 쿠키
            거부 시 일부 서비스 이용에 제한이 생길 수 있습니다.
          </p>
          <p>
            Google AdSense의 개인화 광고를 원하지 않는 경우{' '}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google 광고 설정
            </a>
            에서 조정할 수 있습니다.
          </p>
        </section>

        <section className="info-doc__section">
          <h2>6. Google Analytics 및 Google AdSense</h2>
          <p>
            본 블로그는 Google Inc.의 웹 분석 서비스인 Google Analytics와 광고 서비스인 Google
            AdSense를 사용합니다. 이 서비스들은 쿠키를 통해 익명 형태의 방문 데이터를 수집합니다.
          </p>
          <p>
            수집된 데이터는 Google의 서버에 전송되어 저장되며, Google의 개인정보처리방침에 따라
            처리됩니다. 자세한 내용은{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google 개인정보처리방침
            </a>
            을 참조하세요.
          </p>
        </section>

        <section className="info-doc__section">
          <h2>7. 이용자의 권리</h2>
          <p>이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다.</p>
          <ul>
            <li>개인정보 처리 현황 조회 요청</li>
            <li>개인정보 수정·삭제 요청</li>
            <li>개인정보 처리 정지 요청</li>
          </ul>
          <p>
            권리 행사는 <Link href="/contact">문의 페이지</Link>를 통해 신청하실 수 있으며,
            확인 후 지체 없이 처리합니다.
          </p>
        </section>

        <section className="info-doc__section">
          <h2>8. 개인정보 보호 책임자</h2>
          <ul>
            <li>
              <strong>운영자:</strong> 오늘의 IT 블로그 편집팀
            </li>
            <li>
              <strong>문의:</strong> <Link href="/contact">문의 페이지</Link> 이용
            </li>
          </ul>
        </section>

        <section className="info-doc__section">
          <h2>9. 개인정보처리방침 변경</h2>
          <p>
            법령이나 서비스 변경에 따라 본 방침이 수정될 수 있습니다. 변경 시 본 페이지 상단의
            &quot;최종 업데이트&quot; 날짜를 갱신하고, 중요한 변경이 있을 경우 블로그 공지를 통해
            안내합니다.
          </p>
        </section>
      </div>

      <div className="info-back">
        <Link href="/">← 홈으로 돌아가기</Link>
      </div>
    </div>
  )
}
