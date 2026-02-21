import type { Metadata } from 'next'
import Link from 'next/link'
import DonationStatusChecker from '../../components/DonationStatusChecker'

export const metadata: Metadata = {
  title: '기부 인증 상태 조회 | 오늘의 IT 블로그',
  description: '기부 요청번호로 입금 인증 상태를 조회합니다.',
}

type VerifyPageProps = {
  searchParams: Promise<{ intentId?: string }>
}

export default async function DonationVerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams
  const initialIntentId = params?.intentId ?? ''

  return (
    <div className="container donation-page">
      <header className="donation-hero">
        <p>Donation Verification</p>
        <h1>기부 인증 상태 조회</h1>
        <p>기부 신청 후 받은 요청번호(intentId)로 입금 확인 상태를 조회할 수 있습니다.</p>
      </header>

      <DonationStatusChecker initialIntentId={initialIntentId} />

      <Link href="/donation" className="back-link">
        기부 공개 페이지로 돌아가기
      </Link>
    </div>
  )
}
