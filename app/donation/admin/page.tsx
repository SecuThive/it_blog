import type { Metadata } from 'next'
import Link from 'next/link'
import DonationAdminForm from '../../components/DonationAdminForm'

export const metadata: Metadata = {
  title: '기부 수동 인증 관리 | 오늘의 IT 블로그',
  description: '웹훅 실패 시 운영자가 기부 내역을 수동 인증합니다.',
}

export default function DonationAdminPage() {
  return (
    <div className="container donation-page">
      <header className="donation-hero">
        <p>Donation Admin</p>
        <h1>기부 수동 인증 관리</h1>
        <p>웹훅 누락이나 예외 상황에서 운영자가 기부 입금을 수동 반영하는 페이지입니다.</p>
      </header>

      <DonationAdminForm />

      <Link href="/donation" className="back-link">
        기부 공개 페이지로 돌아가기
      </Link>
    </div>
  )
}
