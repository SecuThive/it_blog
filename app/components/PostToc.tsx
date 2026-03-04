'use client'

import { useEffect, useState } from 'react'

type Section = { heading: string }

function cleanHeading(heading: string) {
  return heading.replace(/\(SEO[^)]*\)/gi, '').trim()
}

export default function PostToc({
  sections,
  readMinutes,
}: {
  sections: Section[]
  readMinutes: number
}) {
  const [activeIdx, setActiveIdx] = useState<number>(0)

  useEffect(() => {
    const els = sections
      .map((_, i) => document.getElementById(`section-${i}`))
      .filter(Boolean) as HTMLElement[]

    if (!els.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        // 화면 위쪽에 진입한 섹션 중 가장 마지막(아래) 것을 active로
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => parseInt(e.target.id.replace('section-', ''), 10))
          .filter((n) => !isNaN(n))

        if (visible.length > 0) {
          setActiveIdx(Math.max(...visible))
        }
      },
      { rootMargin: '-8% 0px -82% 0px', threshold: 0 },
    )

    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [sections])

  if (!sections.length) return null

  return (
    <aside className="post-toc animate-up">
      <div className="post-toc__inner">
        <p className="post-toc__label">목차</p>
        <nav>
          <ol className="post-toc__list">
            {sections.map((section, idx) => (
              <li
                key={idx}
                className={`post-toc__item${activeIdx === idx ? ' is-active' : ''}`}
              >
                <a
                  href={`#section-${idx}`}
                  onClick={() => setActiveIdx(idx)}
                >
                  <span className="post-toc__num">{idx + 1}</span>
                  <span>{cleanHeading(section.heading)}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="post-toc__footer">
          <span>{readMinutes}분 읽기</span>
        </div>
      </div>
    </aside>
  )
}
