'use client'

import { FormEvent, useState } from 'react'

export default function DonationAdminForm() {
  const [adminPassword, setAdminPassword] = useState('')
  const [intentId, setIntentId] = useState('')
  const [providerTxId, setProviderTxId] = useState('')
  const [amount, setAmount] = useState(0)
  const [donorName, setDonorName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setDone('')
    setLoading(true)

    try {
      const response = await fetch('/api/donation/admin-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPassword,
          intentId,
          providerTxId,
          donorName,
          amount,
          message,
          depositedAt: new Date().toISOString(),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error ?? '인증 처리 실패')
      }

      setDone(data?.duplicated ? '이미 반영된 거래입니다.' : '기부 내역이 반영되었습니다.')
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="donation-panel donation-admin" aria-label="관리자 수동 인증">
      <h2>관리자 수동 인증</h2>
      <form className="donation-form" onSubmit={onSubmit}>
        <input
          type="password"
          placeholder="관리자 비밀번호"
          value={adminPassword}
          onChange={(event) => setAdminPassword(event.target.value)}
          required
        />
        <input
          type="text"
          placeholder="기부 요청번호(intentId)"
          value={intentId}
          onChange={(event) => setIntentId(event.target.value)}
        />
        <input
          type="text"
          placeholder="거래 ID(providerTxId)"
          value={providerTxId}
          onChange={(event) => setProviderTxId(event.target.value)}
          required
        />
        <input
          type="number"
          placeholder="입금 금액"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
          min={1}
          required
        />
        <input
          type="text"
          placeholder="입금자명(선택)"
          value={donorName}
          onChange={(event) => setDonorName(event.target.value)}
        />
        <textarea
          placeholder="관리 메모(선택)"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
        />

        {error ? <p className="donation-form__error">{error}</p> : null}
        {done ? <p className="donation-form__done">{done}</p> : null}

        <button type="submit" disabled={loading}>
          {loading ? '처리 중...' : '수동 인증 반영'}
        </button>
      </form>
    </section>
  )
}
