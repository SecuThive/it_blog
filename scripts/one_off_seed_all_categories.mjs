#!/usr/bin/env node

import dotenv from 'dotenv'
import path from 'node:path'
import Parser from 'rss-parser'
import { createClient } from '@supabase/supabase-js'

// Run from repo root
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
if (!SERVICE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const parser = new Parser({ timeout: 20000 })

const CATEGORIES = /** @type {const} */ ([
  'laptop',
  'smartphone',
  'tablet',
  'desktop',
  'wearable',
  'audio',
  'software',
  'ai',
  'it-news',
])

const SOURCES = [
  { name: 'OpenAI News', url: 'https://openai.com/news/rss.xml' },
  { name: 'Apple Newsroom', url: 'https://www.apple.com/newsroom/rss-feed.rss' },
  { name: 'Samsung Global Newsroom', url: 'https://news.samsung.com/global/feed' },
  { name: 'Google Blog', url: 'https://blog.google/rss/' },
  { name: 'Microsoft Blog', url: 'https://blogs.microsoft.com/feed/' },
]

const CATEGORY_PATTERNS = {
  laptop: /macbook|mac\s*book|notebook|laptop|\bgram\b|그램|galaxy\s*book|thinkpad|zenbook|vivobook|xps|spectre/i,
  smartphone: /iphone|galaxy\s*s|galaxy\s*z|pixel|smartphone|스마트폰|android\s*phone/i,
  tablet: /ipad|galaxy\s*tab|tablet|태블릿/i,
  desktop: /imac|mac\s*mini|mac\s*studio|mac\s*pro|desktop|데스크탑|workstation/i,
  wearable: /watch|apple\s*watch|galaxy\s*watch|fitbit|wearable|웨어러블|band/i,
  audio: /airpods|buds|earbuds|headphone|이어폰|헤드폰|speaker|스피커|audio/i,
  software: /macos|windows|ios\b|ipad(os)?|android\b|software|소프트웨어|update|업데이트/i,
  ai: /\bai\b|chatgpt|openai|claude|gemini|copilot|llm|gpt/i,
  'it-news': /.*/,
}

function ensureText(s) {
  return String(s || '').replace(/\s+/g, ' ').trim()
}

function toSlugWords(input) {
  return ensureText(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .split('-')
    .filter(Boolean)
    .slice(0, 5)
    .join('-')
}

function isoDate(d) {
  try {
    return new Date(d).toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function seoTitleFromRaw(rawTitle) {
  // Avoid “구매” framing; keep it shareable + SEO.
  // Keep product names in English as-is.
  const t = ensureText(rawTitle)
  if (!t) return 'AI 업데이트 소식 총정리'
  return `${t} 총정리: 핵심 변경점과 체크리스트`
}

function buildSections({ rawTitle, keyBullets, category, sourceName, sourceUrl, publishedIso }) {
  const summary = [
    `발표/업데이트: ${rawTitle}`,
    '',
    '한 줄 요약: 이번 소식에서 “사용자 체감이 생기는 변화”와 한국 사용자 관점 체크포인트를 빠르게 정리합니다.',
    '',
    '추천 대상(빠르게 보기)',
    '- 해당 제품/서비스를 이미 쓰고 있고, 변경점이 내 사용패턴에 영향 있는 사람',
    '- 업데이트/출시 일정 때문에 구매·업그레이드 타이밍을 고민 중인 사람',
    '',
    '보류 대상(잠깐 대기)',
    '- 한국 출시/가격/정책이 확정되지 않아 최종 판단이 어려운 사람(확정 후 비교 추천)',
  ].join('\n')

  const keyPoints = ['핵심 포인트(3분 컷)', ...keyBullets.map((b, i) => `${i + 1}) ${b}`)].join('\n')

  const checklist = [
    '구매 체크리스트(체크하고 결론 내리기)',
    '- ☐ 한국 출시일/가격/구성이 확정됐나?',
    '- ☐ AS/보증/정책(정발/직구/계정/요금제)이 내 기준에 맞나?',
    '- ☐ 내 사용패턴에서 병목이 뭔지 확실한가? (성능/배터리/발열/호환/정확도)',
    '- ☐ 옵션/플랜/세대 선택을 과소/과대하지 않았나?',
    '- ☐ 대체재(이전 세대/경쟁 제품)와 비교했나?',
  ].join('\n')

  const sal까 = [
    '**살까 말까(빠른 판단)**',
    '',
    '**추천(하는 쪽)**',
    '- 지금 쓰는 기기/서비스에서 불편이 명확하고, 이번 변화가 그 지점을 건드리는 경우',
    '- 일정상 바로 필요해서 기다리기 어려운 경우',
    '',
    '**보류(기다리는 쪽)**',
    '- 한국 가격/출시/정책/리뷰가 아직 불확실한 경우',
    '- 급하지 않아서 2~6주 시장 반응(가격/버그/리뷰)을 볼 수 있는 경우',
  ].join('\n')

  const korea = [
    '한국 사용자 체크포인트',
    '- 정발 여부 / 출시일 / 사전예약 혜택',
    '- 한국 AS/보증/환불·구독 정책(가능하면 공식 안내 확인)',
    '- 충전/허브/통신사/결제 등 국내 사용 환경 호환',
    '- 직구 vs 정발: 총비용/보증 차이',
  ].join('\n')

  const accessory = '이 제품과 함께 많이 구매하는 악세사리를 확인해 보세요.'

  const faq = [
    'FAQ(짧게)',
    '- 지금 사도 되나요? → “내 불편”이 이번 변경점으로 해결되면 추천, 아니면 한국 조건/리뷰 확정 후가 안전합니다.',
    '- 업그레이드 가치가 있나요? → CPU/스펙보다 내 병목(배터리/발열/호환/정확도)이 해결되는지가 핵심입니다.',
    '- 옵션은 어떻게 고르나요? → 자주 막히는 자원(RAM/저장공간/요금제/플랜)을 먼저 넉넉히 잡는 게 후회가 적습니다.',
  ].join('\n')

  const conclusion = [
    '결론',
    '이번 소식의 핵심은 “체감되는 변화가 누구에게 생기느냐”입니다.',
    '내 사용패턴의 병목이 연결되는지부터 체크하면 판단이 빨라집니다.',
    '댓글로 용도(문서/개발/영상/게임 등)만 남겨주면 선택을 더 구체적으로 추천할게요.',
  ].join('\n')

  const sources = ['---', `출처: ${sourceName}`, `원문 링크: ${sourceUrl}`, `발행일(원문): ${publishedIso}`].join('\n')

  return [
    { heading: '요약', content: summary },
    { heading: '핵심 포인트', content: keyPoints },
    { heading: '구매 체크리스트', content: checklist },
    { heading: '살까 말까', content: sal까 },
    { heading: '한국 사용자 체크포인트', content: korea },
    { heading: '관련 악세사리 추천', content: accessory },
    { heading: 'FAQ', content: faq },
    { heading: '결론', content: conclusion },
    { heading: '출처', content: sources },
  ]
}

async function upsertPostAndSections({ slug, title, description, category, tags, createdAt, sourceUrl, sections }) {
  const approxChars = sections.map((s) => `${s.heading}\n${s.content}`).join('\n\n').length
  const readMinutes = Math.max(3, Math.ceil(Math.min(approxChars, 3000) / 300) + 1)

  const { data: postRow, error: postError } = await supabase
    .from('posts')
    .upsert(
      {
        slug,
        title,
        description,
        category,
        tags,
        author: 'ThiveLab 편집부',
        featured: false,
        read_minutes: readMinutes,
        created_at: createdAt,
        source_url: sourceUrl,
      },
      { onConflict: 'slug' },
    )
    .select('id')
    .single()

  if (postError) throw postError

  const postId = postRow.id

  const { error: delErr } = await supabase.from('post_sections').delete().eq('post_id', postId)
  if (delErr) throw delErr

  const sectionRows = sections.map((s, idx) => ({ post_id: postId, position: idx + 1, heading: s.heading, content: s.content }))
  const { error: insErr } = await supabase.from('post_sections').insert(sectionRows)
  if (insErr) throw insErr

  return postId
}

async function main() {
  // Fetch feeds once
  const feedData = []
  for (const src of SOURCES) {
    const feed = await parser.parseURL(src.url)
    feedData.push({ src, feed })
  }

  const results = []

  for (const category of CATEGORIES) {
    const pattern = CATEGORY_PATTERNS[category]

    let chosen = null

    for (const { src, feed } of feedData) {
      const items = (feed.items || []).slice(0, 30)
      for (const it of items) {
        const rawTitle = ensureText(it.title)
        const link = it.link
        if (!link) continue

        if (!pattern.test(rawTitle)) continue

        // Skip if already exists by source_url
        const { data: existing } = await supabase.from('posts').select('id').eq('source_url', link).maybeSingle()
        if (existing) continue

        chosen = {
          sourceName: src.name,
          rawTitle,
          link,
          publishedIso: isoDate(it.isoDate || it.pubDate || new Date()),
        }
        break
      }
      if (chosen) break
    }

    if (!chosen) {
      results.push({ category, ok: false, reason: 'No matching item found in available feeds' })
      continue
    }

    const dateOnly = new Date(chosen.publishedIso).toISOString().slice(0, 10)
    const baseSlug = toSlugWords(chosen.rawTitle) || toSlugWords(chosen.link)
    const slug = `${baseSlug}-${dateOnly}`

    const title = seoTitleFromRaw(chosen.rawTitle)
    const description = `상세 요약/체크리스트: ${chosen.rawTitle}`

    const keyBullets = [
      '무엇이 바뀌었나 — “체감”이 생길 변화인지 먼저 확인',
      '한국 출시/가격/정책 — 정발/프로모션/구독 조건이 핵심',
      '업그레이드/전환 가치 — 내 병목(성능/호환/정확도) 해결 여부',
      '대체재 비교 — 같은 예산/시간축에서 다른 선택지와 비교',
    ]

    const sections = buildSections({
      rawTitle: chosen.rawTitle,
      keyBullets,
      category,
      sourceName: chosen.sourceName,
      sourceUrl: chosen.link,
      publishedIso: chosen.publishedIso,
    })

    const tags = Array.from(
      new Set(
        [
          category,
          category === 'ai' ? 'chatgpt' : null,
          /openai|gpt|chatgpt/i.test(chosen.rawTitle) ? 'openai' : null,
          /apple|mac|iphone|ipad|airpods/i.test(chosen.rawTitle) ? 'apple' : null,
          /samsung|galaxy/i.test(chosen.rawTitle) ? 'samsung' : null,
        ].filter(Boolean),
      ),
    ).slice(0, 6)

    const postId = await upsertPostAndSections({
      slug,
      title,
      description,
      category,
      tags,
      createdAt: chosen.publishedIso,
      sourceUrl: chosen.link,
      sections,
    })

    results.push({ category, ok: true, postId, slug, sourceUrl: chosen.link })
  }

  console.log(JSON.stringify({ ok: true, results }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
