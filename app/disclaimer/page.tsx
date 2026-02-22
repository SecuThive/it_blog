import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '광고·제휴 고지 | 오늘의 IT 블로그',
  description: '오늘의 IT 블로그의 광고 수익 구조, 협찬 정책, 제휴 링크 사용에 관한 고지입니다.',
}

export default function DisclaimerPage() {
  return (
    <div className="container info-page">
      <header className="info-hero info-hero--sm">
        <p className="info-hero__eyebrow">DISCLAIMER</p>
        <h1>광고·제휴 고지</h1>
        <p className="info-hero__date">최종 업데이트: 2026년 2월 21일</p>
      </header>

      <div className="info-doc">
        <section className="info-doc__section">
          <h2>1. 광고 수익 안내</h2>
          <p>
            오늘의 IT 블로그는 블로그 운영비 충당을 위해 다음과 같은 방법으로 광고 수익을
            얻을 수 있습니다.
          </p>
          <ul>
            <li>
              <strong>Google AdSense:</strong> Google이 자동으로 표시하는 배너 광고로, 블로그
              운영자는 광고 내용을 직접 선정하지 않습니다.
            </li>
            <li>
              <strong>제휴 마케팅 링크:</strong> 쿠팡 파트너스, 제조사·판매자 제휴 링크를 통해
              독자가 구매를 완료할 경우 일정 수수료를 받을 수 있습니다. 이는 독자에게 추가
              비용을 발생시키지 않습니다.
            </li>
          </ul>
          <div className="disclaimer-notice">
            <strong>중요:</strong> 광고 수익은 콘텐츠의 독립성에 영향을 주지 않습니다. 제휴
            링크가 포함된 제품이라도 품질 기준에 미달하면 추천하지 않으며, 비제휴 제품이
            더 낫다면 해당 제품을 먼저 안내합니다.
          </div>
        </section>

        <section className="info-doc__section">
          <h2>2. 협찬·체험단 정책</h2>
          <p>
            제조사 또는 판매자로부터 제품을 무상으로 제공받거나 비용 지원을 받아 작성된
            리뷰는 반드시 본문 상단에 다음과 같이 명시합니다.
          </p>
          <div className="disclaimer-example">
            <p>
              <em>
                [협찬 고지] 이 리뷰는 (제조사명)으로부터 제품을 무상 제공받아 작성되었습니다.
                협찬 여부는 리뷰 내용과 평가 결과에 영향을 주지 않습니다.
              </em>
            </p>
          </div>
          <p>협찬 표기가 없는 콘텐츠는 에디터가 직접 비용을 지불하여 구매한 제품입니다.</p>
        </section>

        <section className="info-doc__section">
          <h2>3. 제휴 링크 표기</h2>
          <p>
            글 내에 포함된 제품 링크 중 일부는 제휴 수수료가 발생하는 링크일 수 있습니다.
            해당 링크는 가능한 경우 링크 옆에 &quot;[제휴]&quot; 또는 &quot;[파트너스]&quot;로
            표기합니다.
          </p>
          <p>
            제휴 링크 여부와 무관하게, 가격 비교 후 가장 합리적인 구매처를 우선 안내하는 것이
            원칙입니다.
          </p>
        </section>

        <section className="info-doc__section">
          <h2>4. 정보의 정확성 및 면책</h2>
          <p>
            본 블로그에 게재된 정보는 작성 시점의 조사를 바탕으로 하며, 제품 가격·사양·정책은
            이후 변경될 수 있습니다. 최종 구매 전에는 공식 판매처 및 제조사 홈페이지에서 반드시
            확인하시기 바랍니다.
          </p>
          <p>
            블로그 운영자는 본 블로그의 정보를 바탕으로 한 구매 결정에 따른 손해에 대해 법적
            책임을 지지 않습니다. 구매 결정은 독자 본인의 판단과 책임 하에 이루어져야 합니다.
          </p>
        </section>

        <section className="info-doc__section">
          <h2>5. 저작권</h2>
          <p>
            본 블로그의 모든 콘텐츠(텍스트, 이미지, 구성 등)는 저작권법의 보호를 받습니다.
            무단 복제·배포·전송을 금지합니다. 인용 시에는 출처(블로그명 및 URL)를 명확히
            표기해주세요.
          </p>
        </section>

        <section className="info-doc__section">
          <h2>6. 문의</h2>
          <p>
            광고·제휴 관련 문의 또는 본 고지 내용에 대한 질문은{' '}
            <Link href="/contact">문의 페이지</Link>를 이용해주세요.
          </p>
        </section>
      </div>

      <div className="info-back">
        <Link href="/">← 홈으로 돌아가기</Link>
      </div>
    </div>
  )
}
