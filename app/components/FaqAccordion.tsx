'use client'

import { useMemo, useState } from 'react'

type QA = { q: string; a: string }

function parseFaqMarkdown(text: string): QA[] {
  // Expected format:
  // **Question?**\n- Answer...
  // or
  // Question?\n- Answer...
  const lines = text.split('\n').map((l) => l.trim())
  const qas: QA[] = []

  let currentQ: string | null = null
  let currentA: string[] = []

  const flush = () => {
    if (currentQ && currentA.length) {
      qas.push({ q: currentQ, a: currentA.join('\n').trim() })
    }
    currentQ = null
    currentA = []
  }

  for (const line of lines) {
    if (!line) continue

    const isQ =
      (line.startsWith('**') && line.endsWith('**') && line.length > 4) ||
      line.endsWith('?') ||
      /^\d+\)/.test(line)

    if (isQ && !line.startsWith('-')) {
      flush()
      currentQ = line.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^\d+\)\s*/, '').trim()
      continue
    }

    // Answer lines
    const aLine = line.replace(/^[-•]\s*/, '').trim()
    if (!currentQ) {
      // If no question yet, treat first line as question.
      currentQ = aLine
      continue
    }
    currentA.push(aLine)
  }

  flush()
  return qas
}

export default function FaqAccordion({ text }: { text: string }) {
  const items = useMemo(() => parseFaqMarkdown(text), [text])
  const [open, setOpen] = useState<Record<number, boolean>>({})

  if (!items.length) return null

  return (
    <div className="faq">
      {items.map((it, idx) => {
        const isOpen = Boolean(open[idx])
        return (
          <div key={idx} className="faq__item">
            <button
              type="button"
              className="faq__q"
              aria-expanded={isOpen}
              onClick={() => setOpen((prev) => ({ ...prev, [idx]: !prev[idx] }))}
            >
              <span>{it.q}</span>
              <span className="faq__chev">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen ? <div className="faq__a">{it.a}</div> : null}
          </div>
        )
      })}
    </div>
  )
}
