'use client'

import { useState } from 'react'

type Props = { title: string; url: string }

export default function ShareButtons({ title, url }: Props) {
  const [copied, setCopied] = useState(false)

  function shareKakao() {
    // Using KakaoStory share (KakaoTalk sharing requires app key/template).
    const storyUrl = `https://story.kakao.com/share?url=${encodeURIComponent(url)}`
    window.open(storyUrl, '_blank', 'width=500,height=600')
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

      <button className="share-btn share-btn--kakao" onClick={shareKakao} aria-label="카카오스토리 공유">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.618 5.082 4.073 6.533L5.055 21l4.763-2.583C10.245 18.473 11.113 18.6 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/>
        </svg>
        카카오
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
