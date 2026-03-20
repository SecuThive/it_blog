'use client'

import { useState } from 'react'
import Link from 'next/link'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export default function ContactForm() {
  const [state, setState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('submitting')
    setErrorMsg('')

    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      subject: (form.elements.namedItem('subject') as HTMLSelectElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        setErrorMsg(json.error ?? '오류가 발생했습니다.')
        setState('error')
        return
      }
      setState('success')
      form.reset()
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="contact-form-success">
        <p className="contact-form-success__icon">✅</p>
        <h3>문의가 접수되었습니다</h3>
        <p>보통 2–3 영업일 내에 입력하신 이메일로 답변드립니다.</p>
        <button
          type="button"
          className="contact-form__submit"
          onClick={() => setState('idle')}
        >
          새 문의 작성
        </button>
      </div>
    )
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="contact-form__row">
        <div className="contact-form__field">
          <label htmlFor="cf-name">이름 *</label>
          <input
            id="cf-name"
            name="name"
            type="text"
            placeholder="홍길동"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            disabled={state === 'submitting'}
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
            maxLength={200}
            autoComplete="email"
            disabled={state === 'submitting'}
          />
        </div>
      </div>
      <div className="contact-form__field">
        <label htmlFor="cf-subject">문의 유형</label>
        <select id="cf-subject" name="subject" disabled={state === 'submitting'}>
          <option value="">선택해주세요</option>
          <option value="correction">오류·정보 수정 제보</option>
          <option value="sponsorship">협찬·제품 제공 제안</option>
          <option value="business">비즈니스·제휴 문의</option>
          <option value="privacy">개인정보 관련 요청</option>
          <option value="other">기타</option>
        </select>
      </div>
      <div className="contact-form__field">
        <label htmlFor="cf-message">문의 내용 * <span style={{ fontWeight: 400, color: 'var(--text-muted, #888)' }}>(10–2000자)</span></label>
        <textarea
          id="cf-message"
          name="message"
          rows={6}
          placeholder="문의하실 내용을 자세히 작성해 주세요."
          required
          minLength={10}
          maxLength={2000}
          disabled={state === 'submitting'}
        />
      </div>

      {state === 'error' && errorMsg && (
        <p className="contact-form__error" role="alert">{errorMsg}</p>
      )}

      <p className="contact-form__notice">
        제출하시면 <Link href="/privacy">개인정보처리방침</Link>에 동의하는 것으로 간주합니다.
      </p>
      <button
        type="submit"
        className="contact-form__submit"
        disabled={state === 'submitting'}
      >
        {state === 'submitting' ? '전송 중…' : '문의 보내기'}
      </button>
    </form>
  )
}
