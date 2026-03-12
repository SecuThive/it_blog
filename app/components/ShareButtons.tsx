'use client'

import { useState } from 'react'

type Props = { title: string; url: string }

export default function ShareButtons({ title, url }: Props) {
  const [copied, setCopied] = useState(false)

  function shareFacebook() {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank', 'width=580,height=400'
    )
  }

  function shareX() {
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      '_blank', 'width=550,height=420'
    )
  }

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="share-buttons" aria-label="공유하기">
      <span className="share-buttons__label">공유</span>

      <button className="share-btn share-btn--facebook" onClick={shareFacebook} aria-label="Facebook 공유">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
        </svg>
        Facebook
      </button>

      <button className="share-btn share-btn--x" onClick={shareX} aria-label="X(트위터) 공유">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        X
      </button>

      <button className="share-btn share-btn--copy" onClick={copyLink} aria-label="링크 복사">
        {copied ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            복사됨!
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            링크 복사
          </>
        )}
      </button>
    </div>
  )
}
