import Link from 'next/link'
import type { Metadata } from 'next'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  formatKrw,
  getDonationExpenses,
  getDonationIncomes,
  getDonationSummary,
} from '../lib/donations'
import DonationIntentForm from '../components/DonationIntentForm'
import DonationStatusChecker from '../components/DonationStatusChecker'

export const metadata: Metadata = {
  title: '기부 투명성 공개 | 오늘의 IT 블로그',
  description: '블로그 기부 수입과 집행 내역을 투명하게 공개합니다.',
}

export default async function DonationPage() {
  const [incomes, expenses, summary] = await Promise.all([
    getDonationIncomes(),
    getDonationExpenses(),
    getDonationSummary(),
  ])

  return (
    <div className="container donation-page">
      <header className="donation-hero">
        <p>Donation Transparency</p>
        <h1>기부 내역 투명 공개</h1>
        <p>
          후원금은 월 단위로 집계하여 공개하며, 실제 집행 내역도 함께 업데이트합니다. 개인 정보 보호를 위해 기부자명은 일부 마스킹 처리합니다.
        </p>
      </header>

      <section className="donation-summary" aria-label="기부 요약">
        <article>
          <h2>누적 후원금</h2>
          <strong>{formatKrw(summary.incomeTotal)}</strong>
        </article>
        <article>
          <h2>누적 집행금</h2>
          <strong>{formatKrw(summary.expenseTotal)}</strong>
        </article>
        <article>
          <h2>현재 잔액</h2>
          <strong>{formatKrw(summary.balance)}</strong>
        </article>
      </section>

      <section className="donation-panel" aria-label="기부 참여 안내">
        <h2>기부 참여 방법</h2>
        <ul>
          <li>가상계좌 입금 완료 웹훅을 통해 후원 내역이 자동 반영됩니다.</li>
          <li>자동 반영 API: `POST /api/webhooks/virtual-account`</li>
          <li>기부 의도 생성 API: `POST /api/donation-intents`</li>
        </ul>
      </section>

      <div className="donation-tools">
        <DonationIntentForm />
        <DonationStatusChecker />
      </div>

      <section className="donation-panel" aria-label="운영자 안내">
        <h2>운영자 인증 페이지</h2>
        <ul>
          <li>웹훅 장애/누락 상황에서는 운영자 수동 인증으로 반영 가능합니다.</li>
          <li>
            <Link href="/donation/admin">수동 인증 관리 페이지로 이동</Link>
          </li>
        </ul>
      </section>

      <section className="donation-table-wrap" aria-label="후원 수입 내역">
        <div className="section-title-row">
          <h2>후원 수입 내역</h2>
          <span>최근 업데이트 {format(new Date(), 'PPP', { locale: ko })}</span>
        </div>
        <div className="donation-table">
          <div className="donation-table__head">
            <span>날짜</span>
            <span>기부자</span>
            <span>결제 수단</span>
            <span>금액</span>
          </div>
          {incomes.map((item) => (
            <div key={item.id} className="donation-table__row">
              <span>{format(new Date(item.date), 'yyyy.MM.dd')}</span>
              <span>{item.donor}</span>
              <span>{item.method}</span>
              <strong>{formatKrw(item.amount)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="donation-table-wrap" aria-label="기부 집행 내역">
        <div className="section-title-row">
          <h2>기부 집행 내역</h2>
          <span>증빙 URL 항목은 순차 공개</span>
        </div>
        <div className="donation-table">
          <div className="donation-table__head donation-table__head--expense">
            <span>날짜</span>
            <span>집행 내용</span>
            <span>기관</span>
            <span>금액</span>
          </div>
          {expenses.map((item) => (
            <div key={item.id} className="donation-table__row donation-table__row--expense">
              <span>{format(new Date(item.date), 'yyyy.MM.dd')}</span>
              <span>{item.title}</span>
              <span>{item.organization}</span>
              <strong>{formatKrw(item.amount)}</strong>
            </div>
          ))}
        </div>
      </section>

      <Link href="/" className="back-link">
        홈으로 돌아가기
      </Link>
    </div>
  )
}
