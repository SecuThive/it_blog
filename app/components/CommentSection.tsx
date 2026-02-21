'use client'

import { FormEvent, useMemo, useState } from 'react'

type Comment = {
  id: string
  nickname: string
  content: string
  createdAt: string
}

type CommentSectionProps = {
  slug: string
}

const getStorageKey = (slug: string) => `comments:${slug}`

const readComments = (storageKey: string): Comment[] => {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = localStorage.getItem(storageKey)
  if (!raw) {
    return []
  }

  try {
    return JSON.parse(raw) as Comment[]
  } catch {
    return []
  }
}

export default function CommentSection({ slug }: CommentSectionProps) {
  const storageKey = useMemo(() => getStorageKey(slug), [slug])
  const [comments, setComments] = useState<Comment[]>(() => readComments(storageKey))
  const [nickname, setNickname] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  const saveComments = (nextComments: Comment[]) => {
    setComments(nextComments)
    localStorage.setItem(storageKey, JSON.stringify(nextComments))
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

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

    const nextComments: Comment[] = [
      {
        id: crypto.randomUUID(),
        nickname: trimmedNickname,
        content: trimmedContent,
        createdAt: new Date().toISOString(),
      },
      ...comments,
    ]

    saveComments(nextComments)
    setNickname('')
    setContent('')
    setError('')
  }

  return (
    <section className="comment-box" aria-label="댓글">
      <div className="comment-box__header">
        <h3>댓글 {comments.length}개</h3>
        <p>의견을 남겨주시면 더 좋은 글을 만드는 데 큰 도움이 됩니다.</p>
      </div>

      <form className="comment-form" onSubmit={onSubmit}>
        <input
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          type="text"
          placeholder="닉네임"
          maxLength={20}
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="댓글을 입력해 주세요"
          rows={4}
          maxLength={300}
        />
        {error ? <p className="comment-form__error">{error}</p> : null}
        <button type="submit">댓글 등록</button>
      </form>

      <ul className="comment-list">
        {comments.length === 0 ? (
          <li className="comment-empty">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</li>
        ) : (
          comments.map((comment) => (
            <li key={comment.id} className="comment-item">
              <div className="comment-item__top">
                <strong>{comment.nickname}</strong>
                <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString('ko-KR')}</time>
              </div>
              <p>{comment.content}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
