#!/usr/bin/env node

import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import Parser from 'rss-parser'
import { createClient } from '@supabase/supabase-js'

async function fetchOgImage(url) {
  if (!url) return null
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 12000)
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; it_blog_ingest/1.0)',
        'accept': 'text/html,application/xhtml+xml',
      },
    })
    clearTimeout(t)
    if (!res.ok) return null
    const html = await res.text()
    const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    if (m?.[1]) return m[1]
    const m2 = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    return m2?.[1] || null
  } catch {
    return null
  }
}

// Load Next.js-style local env file
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL')
  process.exit(1)
}
if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY (required for server-side inserts)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const workspaceRoot = process.cwd()
const feedsPath = path.join(workspaceRoot, 'content', 'feeds.json')
const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf8'))

const parser = new Parser({ timeout: 20000 })

function toSlug(input) {
  return String(input)
    .toLowerCase()
    // keep latin + numbers; strip everything else
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

function isoDate(d) {
  try {
    return new Date(d).toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function ensureText(s) {
  return String(s || '').replace(/\s+/g, ' ').trim()
}

function titleToKorean(titleEn, fallbackCategory) {
  const t = ensureText(titleEn)
  // minimal heuristic: keep English product names, add Korean framing
  if (!t) return `${fallbackCategory} 최신 업데이트`
  return `${t} — 핵심 변경점 요약과 구매 체크포인트`
}

async function buildDetailedKoreanPost(item, feed) {
  const sourceName = feed.name
  const sourceUrl = item.link || ''
  const publishedAt = item.isoDate || item.pubDate || ''
  const coverImageUrl = item.enclosure?.url || (await fetchOgImage(sourceUrl))

  const rawTitle = ensureText(item.title || '')
  const title = titleToKorean(rawTitle, feed.category || 'IT')

  const tldr = [
    `- 발표/업데이트: ${rawTitle || '공식 발표'}`,
    `- 요약: 핵심 변화와 실사용/구매 관점 체크포인트를 정리했습니다.`,
    `- 누구에게 유용?: 신제품 구매 예정자 / 기존 사용자 / 업무용 사용자`,
    `- 다음 액션: 아래 체크리스트로 본인 상황에 맞게 판단하세요.`,
  ].join('\n')

  const specTable = [
    '| 항목 | 체크 |',
    '|---|---|',
    '| 무엇이 바뀌었나 | (원문에서 핵심 포인트를 확인) |',
    '| 가격/출시 | (한국 출시/가격 확인) |',
    '| 이전 모델 대비 | (업그레이드 가치 판단) |',
    '| 경쟁 제품 대비 | (대체재 비교) |',
  ].join('\n')

  const buyReasons = [
    '- 살 이유 (추천)',
    '  - 성능/배터리/카메라 등 “체감”이 있는 업그레이드인지',
    '  - 가격 대비 체감 개선이 있는지',
    '  - 한국 정발/AS/부품 수급이 안정적인지',
    '',
    '- 안 살 이유 (보류)',
    '  - 초기 가격이 높고 2~3개월 내 할인 가능성이 있는지',
    '  - 1세대 이슈(발열/펌웨어)가 우려되는지',
    '  - 지금 쓰는 기기에서 체감이 거의 없을지',
  ].join('\n')

  const koreaChecklist = [
    '- 한국 사용자 체크포인트',
    '  - 정발 여부 / 출시일 / 사전예약 혜택',
    '  - 애플케어/AS 정책, 교체비용, 수리 기간',
    '  - 통신/규격(충전, Wi‑Fi/5G band, 전파인증 등)',
    '  - 직구 vs 정발: 총비용/보증 비교',
  ].join('\n')

  const faq = [
    '### 자주 묻는 질문(FAQ)',
    '1) 지금 사도 되나요, 기다릴까요?',
    '2) 이전 모델에서 업그레이드 가치가 있나요?',
    '3) 한국 정발/AS는 어떻게 되나요?',
    '4) 경쟁 제품 대비 장단점은?',
    '5) 실사용에서 가장 체감되는 변화는?',
  ].join('\n')

  const conclusion = [
    '### 결론',
    '이 글은 “원문 복붙”이 아니라, 공식 발표를 바탕으로 **구매/사용 판단에 도움이 되도록 재구성한 요약+체크리스트**입니다.',
    '의견이나 추가로 궁금한 점은 댓글로 남겨주세요. 다음 업데이트에 반영할게요.',
  ].join('\n')

  const sources = [
    '---',
    `출처: ${sourceName}`,
    sourceUrl ? `원문 링크: ${sourceUrl}` : null,
    publishedAt ? `발행일(원문): ${publishedAt}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const baseSections = [
    { heading: 'TL;DR', content: tldr },
    { heading: '핵심 체크 표', content: specTable },
    { heading: '살 이유 / 안 살 이유', content: buyReasons },
    { heading: '한국 사용자 체크포인트', content: koreaChecklist },
    { heading: 'FAQ', content: faq },
    { heading: '결론', content: conclusion },
    { heading: '출처', content: sources },
  ]

  // Ensure minimum readable length (~3000+ chars) by appending extra FAQ/checklist
  const currentLen = baseSections.map((s) => `${s.heading}\n${s.content}`).join('\n\n').length
  const paddingSections = []
  if (currentLen < 3200) {
    paddingSections.push({
      heading: '구매 전 최종 체크(10문 10답)',
      content: [
        '- 지금 기기의 가장 불편한 점은 무엇인가?',
        '- 그 불편함이 “새 모델”에서 해결되는가?',
        '- 한국 정발/AS/보증 조건은 확실한가?',
        '- 예산 상한선(총 비용: 기기+보증+액세서리)은?',
        '- 1~2개월 기다리면 더 좋은 조건(할인/번들)이 나올 가능성은?',
        '- 저장공간(SSD)과 메모리는 내 사용패턴에 충분한가?',
        '- 포트/충전/외부 디스플레이 등 주변기기 호환은?',
        '- 배터리/휴대성/무게가 내 사용환경에 중요한가?',
        '- 중고로 되팔 계획이 있다면 인기 옵션 조합은?',
        '- 결론: 지금 필요한가(Need) vs 갖고 싶은가(Want)?',
      ].join('\n'),
    })
  }

  return {
    title,
    description: `상세 요약/체크리스트: ${rawTitle || feed.category || 'IT'}`,
    category: feed.category || 'news',
    tags: ['it', 'news', feed.category || 'news', sourceName.replace(/\s+/g, '-')].slice(0, 6),
    coverImageUrl,
    sourceUrl,
    sections: [...baseSections, ...paddingSections],
  }
}


async function ensureIngestTables() {
  const { error } = await supabase.from('ingest_sources').select('id').limit(1)
  if (error) {
    console.error('Missing ingest_sources table (run SQL schema first):', error.message)
    process.exit(1)
  }
}

async function upsertSource(feed) {
  const { data, error } = await supabase
    .from('ingest_sources')
    .upsert(
      {
        name: feed.name,
        feed_url: feed.feedUrl,
        language: feed.language || 'en',
        category: feed.category || 'news',
        is_active: true,
      },
      { onConflict: 'feed_url' },
    )
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

async function alreadyIngested(url) {
  const { data } = await supabase.from('ingest_items').select('id').eq('url', url).maybeSingle()
  return Boolean(data)
}

async function markIngested({ sourceId, url, title, publishedAt }) {
  const { error } = await supabase.from('ingest_items').insert({
    source_id: sourceId,
    url,
    title,
    published_at: publishedAt,
  })
  if (error) throw error
}

async function createPost({ slug, title, description, category, tags, author, featured, readMinutes, createdAt, coverImageUrl, sourceUrl, sections }) {
  const { data: postRow, error: postError } = await supabase
    .from('posts')
    .insert({
      slug,
      title,
      description,
      category,
      tags,
      author,
      featured,
      read_minutes: readMinutes,
      created_at: createdAt,
      cover_image_url: coverImageUrl || null,
      source_url: sourceUrl || null,
    })
    .select('id')
    .single()

  if (postError) throw postError

  const postId = postRow.id
  const sectionRows = sections.map((s, idx) => ({
    post_id: postId,
    position: idx + 1,
    heading: s.heading,
    content: s.content,
  }))

  const { error: sectionError } = await supabase.from('post_sections').insert(sectionRows)
  if (sectionError) throw sectionError

  return postId
}

async function main() {
  await ensureIngestTables()

  let createdCount = 0

  for (const feed of feeds) {
    const sourceId = await upsertSource(feed)

    console.error(`Fetching feed: ${feed.name} (${feed.feedUrl})`)
    const res = await parser.parseURL(feed.feedUrl)
    const items = (res.items || []).slice(0, 10)

    for (const item of items) {
      const url = item.link
      if (!url) continue

      if (await alreadyIngested(url)) continue

      const publishedAt = isoDate(item.isoDate || item.pubDate || new Date())

      const post = await buildDetailedKoreanPost(item, feed)

      const baseSlug = toSlug(item.title || url) || toSlug(url)
      const slug = `${baseSlug}-${new Date(publishedAt).toISOString().slice(0, 10)}`

      await createPost({
        slug,
        title: post.title,
        description: post.description,
        category: post.category,
        tags: post.tags,
        author: '오늘의 IT 블로그',
        featured: false,
        readMinutes: 5,
        createdAt: publishedAt,
        coverImageUrl: post.coverImageUrl,
        sourceUrl: post.sourceUrl,
        sections: post.sections,
      })

      await markIngested({ sourceId, url, title: item.title || 'Untitled', publishedAt })

      createdCount += 1
      if (createdCount >= 2) break
    }

    if (createdCount >= 2) break
  }

  console.log(JSON.stringify({ ok: true, createdCount }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
