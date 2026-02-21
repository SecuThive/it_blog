'use client'

import { FormEvent, useState } from 'react'

type IntentResponse = {
  success: boolean
  intentId: string
  depositorNameRule: string
  virtualAccount: {
    bankName: string
    accountNumber: string
    accountHolder: string
  }
  amount: number
  message: string
}

export default function DonationIntentForm() {
  const [donorName, setDonorName] = useState('')
  const [amount, setAmount] = useState(10000)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IntentResponse | null>(null)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/donation-intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donorName, amount, message }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error ?? '기부 요청 생성 실패')
      }

      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '요청 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="donation-panel donation-flow" aria-label="기부 신청">
      <h2>기부 신청</h2>
      <form className="donation-form" onSubmit={onSubmit}>
        <input
          type="text"
          placeholder="입금자명 (2글자 이상)"
          value={donorName}
          onChange={(event) => setDonorName(event.target.value)}
          maxLength={20}
          required
        />

        <div className="donation-amounts">
          {[10000, 30000, 50000].map((value) => (
            <button
              key={value}
              type="button"
              className={amount === value ? 'is-active' : ''}
              onClick={() => setAmount(value)}
            >
              {value.toLocaleString('ko-KR')}원
            </button>
          ))}
        </div>

        <input
          type="number"
          min={1000}
          step={1000}
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
          required
        />

        <textarea
          placeholder="응원 메시지 (선택)"
          rows={3}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={120}
        />

        {error ? <p className="donation-form__error">{error}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? '요청 생성 중...' : '가상계좌 안내 받기'}
        </button>
      </form>

      {result ? (
        <div className="donation-result">
          <h3>입금 안내</h3>
          <p>기부 요청번호: {result.intentId}</p>
          <p>은행: {result.virtualAccount.bankName}</p>
          <p>계좌번호: {result.virtualAccount.accountNumber}</p>
          <p>예금주: {result.virtualAccount.accountHolder}</p>
          <p>입금 금액: {result.amount.toLocaleString('ko-KR')}원</p>
          <p>입금자명 규칙: {result.depositorNameRule}</p>
          <p>{result.message}</p>
          <a href={`/donation/verify?intentId=${result.intentId}`}>인증 상태 확인하기</a>
        </div>
      ) : null}
    </section>
  )
}
