'use client'

import { FormEvent, useEffect, useState } from 'react'

type Comment = {
  id: string
  nickname: string
  content: string
  created_at: string
}

type CommentSectionProps = {
  slug: string
}

export default function CommentSection({ slug }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [nickname, setNickname] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/comments?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setComments(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const trimmedNickname = nickname.trim()
    const trimmedContent = content.trim()

    if (trimmedNickname.length < 2) {
      setError('닉네임은 2글자 이상 입력해 주세요.')
      return
    }
    if (trimmedContent.length < 3) {
      setError('댓글은 3글자 이상 입력해 주세요.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, nickname: trimmedNickname, content: trimmedContent }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? '댓글 등록에 실패했습니다.')
        return
      }

      setComments((prev) => [data, ...prev])
      setNickname('')
      setContent('')
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="comment-box" aria-label="댓글">
      <div className="comment-box__header">
        <h3>댓글 {loading ? '...' : `${comments.length}개`}</h3>
        <p>의견을 남겨주시면 더 좋은 글을 만드는 데 큰 도움이 됩니다.</p>
      </div>

      <form className="comment-form" onSubmit={onSubmit}>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          type="text"
          placeholder="닉네임"
          maxLength={20}
          disabled={submitting}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 입력해 주세요"
          rows={4}
          maxLength={300}
          disabled={submitting}
        />
        {error ? <p className="comment-form__error">{error}</p> : null}
        <button type="submit" disabled={submitting}>
          {submitting ? '등록 중...' : '댓글 등록'}
        </button>
      </form>

      <ul className="comment-list">
        {loading ? (
          <li className="comment-empty">댓글을 불러오는 중입니다...</li>
        ) : comments.length === 0 ? (
          <li className="comment-empty">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</li>
        ) : (
          comments.map((comment) => (
            <li key={comment.id} className="comment-item">
              <div className="comment-item__top">
                <strong>{comment.nickname}</strong>
                <time dateTime={comment.created_at}>
                  {new Date(comment.created_at).toLocaleString('ko-KR')}
                </time>
              </div>
              <p>{comment.content}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
