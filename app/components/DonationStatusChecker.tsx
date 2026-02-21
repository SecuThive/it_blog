'use client'

import { FormEvent, useState } from 'react'

type DonationStatus = {
  id: string
  donorMasked: string
  amountLabel: string
  status: 'pending' | 'paid' | 'cancelled'
  depositorHint?: string
  createdAt: string
  paidAt?: string | null
}

type Props = {
  initialIntentId?: string
}

const statusLabel: Record<DonationStatus['status'], string> = {
  pending: '입금 대기',
  paid: '입금 확인 완료',
  cancelled: '취소됨',
}

const statusClass: Record<DonationStatus['status'], string> = {
  pending: 'is-pending',
  paid: 'is-paid',
  cancelled: 'is-cancelled',
}

export default function DonationStatusChecker({ initialIntentId = '' }: Props) {
  const [intentId, setIntentId] = useState(initialIntentId)
  const [status, setStatus] = useState<DonationStatus | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchStatus = async (event?: FormEvent) => {
    event?.preventDefault()
    const trimmed = intentId.trim()
    if (!trimmed) {
      setError('기부 요청번호를 입력해 주세요.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/donation-intents/${trimmed}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error ?? '상태 조회 실패')
      }

      setStatus(data)
    } catch (e) {
      setStatus(null)
      setError(e instanceof Error ? e.message : '상태 조회 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="donation-panel donation-verify" aria-label="기부 인증 상태 조회">
      <h2>기부 인증 상태 조회</h2>
      <form className="donation-verify__form" onSubmit={fetchStatus}>
        <input
          type="text"
          placeholder="기부 요청번호(intentId)"
          value={intentId}
          onChange={(event) => setIntentId(event.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? '조회 중...' : '상태 확인'}
        </button>
      </form>

      {error ? <p className="donation-form__error">{error}</p> : null}

      {status ? (
        <div className="donation-status-card">
          <p>
            <span>상태</span>
            <strong className={`donation-status-badge ${statusClass[status.status]}`}>
              {statusLabel[status.status]}
            </strong>
          </p>
          <p>
            <span>기부자</span>
            <strong>{status.donorMasked}</strong>
          </p>
          <p>
            <span>금액</span>
            <strong>{status.amountLabel}</strong>
          </p>
          <p>
            <span>요청 시각</span>
            <strong>{new Date(status.createdAt).toLocaleString('ko-KR')}</strong>
          </p>
          {status.paidAt ? (
            <p>
              <span>입금 확인 시각</span>
              <strong>{new Date(status.paidAt).toLocaleString('ko-KR')}</strong>
            </p>
          ) : null}
          {status.depositorHint ? (
            <p>
              <span>입금자명 힌트</span>
              <strong>{status.depositorHint}</strong>
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
