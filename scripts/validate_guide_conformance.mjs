#!/usr/bin/env node

import dotenv from 'dotenv'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
if (!SERVICE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEMPLATE_A_CATEGORIES = new Set(['laptop', 'smartphone', 'tablet', 'desktop', 'wearable', 'audio'])
const TEMPLATE_B_CATEGORIES = new Set(['software', 'ai', 'it-news'])

const A_HEADINGS = [
  '요약',
  '핵심 포인트',
  '구매 체크리스트',
  '옵션/모델 추천',
  '살까 말까',
  '한국 사용자 체크포인트',
  '관련 악세사리 추천',
  'FAQ',
  '결론',
  '출처',
]

const B_HEADINGS = ['요약', '핵심 포인트', '영향 범위', '대응 체크리스트', '한국 사용자 체크포인트', 'FAQ', '결론', '출처']

function detectTemplate(post, sections) {
  // Per guide: category-based; device categories can switch to B if issue keywords,
  // but here we validate by required headings.
  if (TEMPLATE_B_CATEGORIES.has(post.category)) return 'B'
  if (TEMPLATE_A_CATEGORIES.has(post.category)) {
    // If it has B-only headings, treat as B.
    const heads = new Set(sections.map((s) => s.heading))
    if (heads.has('영향 범위') || heads.has('대응 체크리스트')) return 'B'
    return 'A'
  }
  return 'B'
}

function checkSourcesFormat(content) {
  const t = String(content || '')
  return /---\s*[\s\S]*출처:\s*/.test(t) && /원문 링크:\s*https?:\/\//.test(t) && /발행일\(원문\):\s*\d{4}-\d{2}-\d{2}T/.test(t)
}

function checkFaqAccordion(content) {
  const lines = String(content || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (!lines.length) return false
  if (!/^FAQ\(짧게\)/.test(lines[0])) return false

  // Require at least 1 question line and 1 answer bullet.
  let hasQ = false
  let hasA = false
  for (const l of lines.slice(1)) {
    if (!l.startsWith('-') && l.endsWith('?')) hasQ = true
    if (l.startsWith('-')) hasA = true
  }
  return hasQ && hasA
}

async function main() {
  const { data: posts, error } = await sb.from('posts').select('id,slug,category,title,description,source_url,created_at').order('id')
  if (error) throw error

  const ids = posts.map((p) => p.id)
  const { data: secs, error: e2 } = await sb
    .from('post_sections')
    .select('post_id,heading,position,content')
    .in('post_id', ids)
    .order('post_id', { ascending: true })
    .order('position', { ascending: true })
  if (e2) throw e2

  const byPost = new Map()
  for (const s of secs) {
    if (!byPost.has(s.post_id)) byPost.set(s.post_id, [])
    byPost.get(s.post_id).push(s)
  }

  const issues = []

  for (const p of posts) {
    const sections = byPost.get(p.id) || []
    const template = detectTemplate(p, sections)
    const expected = template === 'A' ? A_HEADINGS : B_HEADINGS

    const headings = sections.map((s) => s.heading)

    const countOk = headings.length === expected.length
    const orderOk = countOk && expected.every((h, i) => headings[i] === h)

    const src = sections.find((s) => s.heading === '출처')
    const srcOk = src ? checkSourcesFormat(src.content) : false

    const faq = sections.find((s) => s.heading === 'FAQ')
    const faqOk = faq ? checkFaqAccordion(faq.content) : false

    const descHasUrl = /https?:\/\//i.test(String(p.description || ''))

    if (!countOk || !orderOk || !srcOk || !faqOk || descHasUrl) {
      issues.push({
        id: p.id,
        slug: p.slug,
        category: p.category,
        template,
        count: headings.length,
        expectedCount: expected.length,
        orderOk,
        srcOk,
        faqOk,
        descHasUrl,
      })
    }
  }

  console.log(JSON.stringify({ ok: true, total: posts.length, issues: issues.length, sample: issues.slice(0, 50) }, null, 2))
  process.exit(issues.length ? 2 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
