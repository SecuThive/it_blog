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

const SUFFIX_A = '공개 정리: 핵심 포인트와 추천 체크리스트'
const SUFFIX_B = '업데이트/이슈 정리: 핵심 변경점과 대응 체크리스트'

function ensureText(s) {
  return String(s || '').replace(/\s+/g, ' ').trim()
}

function removeUrlLike(text) {
  return ensureText(text)
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\bwww\.[^\s]+/gi, '')
    .replace(/\([^\)]*https?:\/\/[^\)]*\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripTemplateSuffixes(t) {
  let s = ensureText(t)
  // remove repeated suffixes if present
  s = s.replace(new RegExp(`${SUFFIX_A}\s*${SUFFIX_A}`, 'g'), SUFFIX_A)
  s = s.replace(new RegExp(`${SUFFIX_B}\s*${SUFFIX_B}`, 'g'), SUFFIX_B)

  // remove any embedded suffix to rebuild cleanly
  s = s.replace(new RegExp(`\s*${SUFFIX_A}\s*`, 'g'), ' ')
  s = s.replace(new RegExp(`\s*${SUFFIX_B}\s*`, 'g'), ' ')

  return ensureText(s)
}

function stripPressPrefix(raw) {
  let s = ensureText(raw)
  s = s.replace(/^\[[^\]]+\]\s*/g, '')
  s = s.replace(/^PRESS RELEASE\s*/i, '')
  s = s.replace(/^Apple introduces\s+/i, '')
  s = s.replace(/^Apple announces\s+/i, '')
  s = s.replace(/^Apple unveils\s+/i, '')
  s = s.replace(/^Apple debuts\s+/i, '')
  s = s.replace(/^A new preprint\s*/i, '')
  return s
}

function toSeoHead({ title, description, category, sourceUrl }) {
  // Prefer Korean-ish head derived from title/description.
  let base = stripTemplateSuffixes(removeUrlLike(title))

  if (!base || base.length < 8) {
    base = stripTemplateSuffixes(removeUrlLike(description))
  }

  base = stripPressPrefix(base)

  // Hard cap to keep readable
  base = base.replace(/^[-:–—]+\s*/g, '')
  base = base.replace(/\s*[-:–—]+\s*$/g, '')
  base = ensureText(base).slice(0, 70)

  // If still English-heavy and category is known, add Korean framing.
  const hasHangul = /[가-힣]/.test(base)
  if (!hasHangul) {
    // If it's still English-heavy, keep it but avoid awkward prefixes.
    // Prefer turning it into a short headline rather than a long pasted sentence.
    base = base
      .replace(/^Apple today (announced|unveiled|introduced|revealed)\s+/i, '')
      .replace(/^Apple (announced|unveiled|introduced|revealed)\s+/i, '')
      .replace(/^Samsung Electronics (unveiled|announced|introduced)\s+/i, '')
      .slice(0, 60)

    // Add a minimal Korean frame for readability
    const map = {
      laptop: '노트북',
      smartphone: '스마트폰',
      tablet: '태블릿',
      desktop: '데스크탑',
      wearable: '웨어러블',
      audio: '오디오',
      software: '소프트웨어',
      ai: 'AI',
      'it-news': 'IT',
    }
    const prefix = map[category] || 'IT'
    base = `${prefix}: ${base}`.slice(0, 70)
  }

  // Remove dangling "with" etc.
  base = base.replace(/\bwith\s*$/i, '').trim()

  return base
}

function desiredTemplate({ category, title, description }) {
  const t = ensureText(title + ' ' + description)
  const issuePattern =
    /issue|issues|problem|bug|outage|incident|security|vulnerab|breach|recall|warning|lawsuit|policy|terms|pricing|price increase|deprecate|sunset|retire|end of life|eol|패치|버그|오류|장애|보안|취약|유출|리콜|주의|정책|약관|가격|인상|중단|은퇴|종료/i

  if (TEMPLATE_B_CATEGORIES.has(category)) return 'B'
  if (TEMPLATE_A_CATEGORIES.has(category)) return issuePattern.test(t) ? 'B' : 'A'
  return 'B'
}

function buildTitle({ category, title, description, sourceUrl }) {
  const template = desiredTemplate({ category, title, description })
  const head = toSeoHead({ title, description, category, sourceUrl })
  return template === 'A' ? `${head} ${SUFFIX_A}` : `${head} ${SUFFIX_B}`
}

async function main() {
  const pageSize = 1000
  let from = 0
  const posts = []

  while (true) {
    const { data, error } = await sb
      .from('posts')
      .select('id,slug,title,description,category,source_url')
      .range(from, from + pageSize - 1)
      .order('id', { ascending: true })

    if (error) throw error
    if (!data?.length) break
    posts.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }

  const updates = []
  for (const p of posts) {
    const newTitle = buildTitle({
      category: p.category,
      title: p.title,
      description: p.description,
      sourceUrl: p.source_url,
    })

    // If title contains URL or obvious mangling, prioritize update.
    const needs =
      /https?:\/\//i.test(p.title) ||
      p.title.includes(SUFFIX_A) && p.title.indexOf(SUFFIX_A) !== p.title.lastIndexOf(SUFFIX_A) ||
      p.title.includes(SUFFIX_B) && p.title.indexOf(SUFFIX_B) !== p.title.lastIndexOf(SUFFIX_B) ||
      ensureText(p.title) !== ensureText(newTitle)

    if (needs) updates.push({ id: p.id, slug: p.slug, old: p.title, title: newTitle })
  }

  for (const u of updates) {
    const { error } = await sb.from('posts').update({ title: u.title }).eq('id', u.id)
    if (error) throw error
  }

  console.log(JSON.stringify({ ok: true, updated: updates.length, sample: updates.slice(0, 10) }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
