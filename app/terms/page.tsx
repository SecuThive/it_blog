import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '이용약관 | 오늘의 IT 블로그',
  description: '오늘의 IT 블로그 이용약관입니다. 서비스 이용 전 반드시 확인해 주세요.',
}

export default function TermsPage() {
  return (
    <div className="container info-page">
      <header className="info-hero info-hero--sm">
        <p className="info-hero__eyebrow">TERMS</p>
        <h1>이용약관</h1>
        <p className="info-hero__date">최종 수정일: 2026년 3월 4일</p>
      </header>

      <section className="info-section">
        <h2>제1조 목적</h2>
        <div className="info-prose">
          <p>
            본 약관은 오늘의 IT 블로그(이하 &quot;블로그&quot;)가 제공하는 웹사이트
            및 관련 서비스(이하 &quot;서비스&quot;)의 이용 조건과 절차, 이용자와 블로그 간의
            권리·의무 및 책임 사항을 규정하는 것을 목적으로 합니다.
          </p>
        </div>
      </section>

      <section className="info-section">
        <h2>제2조 서비스 이용</h2>
        <div className="info-prose">
          <p>
            블로그가 제공하는 서비스는 인터넷 접속이 가능한 환경에서 누구나 무료로 이용할 수
            있습니다. 단, 일부 기능은 별도 동의 또는 설정이 필요할 수 있습니다.
          </p>
          <p>
            이용자는 본 약관 및 관련 법령을 준수하여야 하며, 다음 행위를 해서는 안 됩니다.
          </p>
          <ul>
            <li>서비스의 정상적인 운영을 방해하는 행위</li>
            <li>블로그 콘텐츠를 무단으로 복제·배포·상업적으로 이용하는 행위</li>
            <li>타인의 정보를 도용하거나 허위 정보를 입력하는 행위</li>
            <li>블로그 서버에 과도한 부하를 주는 자동화된 크롤링·스크래핑 행위</li>
            <li>기타 관련 법령에 위반되는 행위</li>
          </ul>
        </div>
      </section>

      <section className="info-section">
        <h2>제3조 AI 생성 콘텐츠 고지</h2>
        <div className="info-prose">
          <p>
            본 블로그의 콘텐츠 일부는 인공지능(AI)이 자동으로 수집·작성하고, 사람 에디터가
            검토·보완하는 방식으로 생성됩니다. 이용자는 이 사실을 인지하고 서비스를 이용해야 하며,
            AI 생성 콘텐츠는 오류 또는 부정확한 정보를 포함할 수 있습니다.
          </p>
          <p>
            콘텐츠에 오류가 있다고 판단되면{' '}
            <Link href="/contact">문의 페이지</Link>를 통해 알려주시면 신속히 검토·수정하겠습니다.
          </p>
        </div>
      </section>

      <section className="info-section">
        <h2>제4조 저작권 및 지적재산권</h2>
        <div className="info-prose">
          <p>
            블로그에 게시된 글, 이미지, 디자인, 코드 등 모든 콘텐츠의 저작권은 블로그 운영자 또는
            해당 저작권자에게 있습니다. 이용자는 블로그 콘텐츠를 개인적·비상업적 목적으로만
            이용할 수 있으며, 무단 복제·수정·배포·상업적 이용은 금지됩니다.
          </p>
          <p>
            외부 출처(제조사, 뉴스, 공식 보도자료 등)의 이미지 및 정보는 해당 저작권자에게
            귀속됩니다. 저작권 침해 신고는 <Link href="/contact">문의 페이지</Link>를 이용해 주세요.
          </p>
        </div>
      </section>

      <section className="info-section">
        <h2>제5조 광고 및 제휴 링크</h2>
        <div className="info-prose">
          <p>
            블로그는 Google AdSense, 쿠팡 파트너스 등 제3자 광고 네트워크 및 제휴 프로그램을
            통해 수익을 얻을 수 있습니다. 제휴 링크를 통해 구매가 이루어질 경우 블로그에 수수료가
            지급될 수 있으며, 이는 콘텐츠의 내용이나 평가에 영향을 주지 않습니다.
          </p>
          <p>
            광고 및 제휴에 관한 자세한 사항은{' '}
            <Link href="/disclaimer">광고·제휴 고지</Link>를 참고하세요.
          </p>
        </div>
      </section>

      <section className="info-section">
        <h2>제6조 쿠키 및 개인정보</h2>
        <div className="info-prose">
          <p>
            블로그는 서비스 개선과 맞춤 광고 제공을 위해 쿠키를 사용합니다. 이용자는 브라우저
            설정을 통해 쿠키 사용을 거부할 수 있으나, 이 경우 일부 서비스 이용에 제한이 생길 수
            있습니다.
          </p>
          <p>
            개인정보 수집·이용에 관한 자세한 사항은{' '}
            <Link href="/privacy">개인정보처리방침</Link>을 참고하세요.
          </p>
        </div>
      </section>

      <section className="info-section">
        <h2>제7조 면책 조항</h2>
        <div className="info-prose">
          <p>
            블로그는 콘텐츠의 정확성·완전성·최신성을 보장하지 않습니다. 블로그에 게시된 정보를
            바탕으로 한 이용자의 구매 결정, 투자, 기타 행위에 대해 블로그는 법적 책임을 지지
            않습니다.
          </p>
          <p>
            블로그는 천재지변, 서버 장애, 제3자의 불법 행위 등 불가항력으로 인한 서비스 중단에
            대해 책임을 지지 않습니다.
          </p>
        </div>
      </section>

      <section className="info-section">
        <h2>제8조 약관 변경</h2>
        <div className="info-prose">
          <p>
            블로그는 필요 시 본 약관을 변경할 수 있으며, 변경된 약관은 블로그 내 공지 또는
            페이지 상단의 최종 수정일 갱신을 통해 고지합니다. 변경 후 서비스를 계속 이용하는
            경우 변경된 약관에 동의한 것으로 간주합니다.
          </p>
        </div>
      </section>

      <section className="info-section">
        <h2>제9조 준거법 및 분쟁 해결</h2>
        <div className="info-prose">
          <p>
            본 약관은 대한민국 법령에 따라 해석되며, 서비스 이용과 관련한 분쟁은 대한민국 법원을
            관할 법원으로 합니다.
          </p>
          <p>
            서비스 이용 관련 문의 및 분쟁은 <Link href="/contact">문의 페이지</Link>를 통해
            접수해 주세요.
          </p>
        </div>
      </section>

      <div className="info-back">
        <Link href="/">← 홈으로 돌아가기</Link>
      </div>
    </div>
  )
}
