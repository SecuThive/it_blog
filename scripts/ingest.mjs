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
        accept: 'text/html,application/xhtml+xml',
      },
    })
    clearTimeout(t)
    if (!res.ok) return null
    const html = await res.text()
    const m = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    )
    if (m?.[1]) return m[1]
    const m2 = html.match(
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    )
    return m2?.[1] || null
  } catch {
    return null
  }
}

async function ensureBucket(bucket) {
  // Best-effort: create if missing.
  const { data: buckets } = await supabase.storage.listBuckets()
  if (buckets?.some((b) => b.name === bucket)) return
  await supabase.storage.createBucket(bucket, { public: true })
}

async function cacheCoverToStorage({ bucket, slug, sourceUrl, coverUrl }) {
  // Prefer stable, non-hotlinked URLs.
  const targetUrl = coverUrl || (await fetchOgImage(sourceUrl))
  if (!targetUrl) return null

  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 15000)
    const res = await fetch(targetUrl, {
      signal: ctrl.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; it_blog_ingest/1.0)',
        accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
        referer: sourceUrl || undefined,
      },
    })
    clearTimeout(t)
    if (!res.ok) return null

    const buf = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.includes('png')
      ? 'png'
      : contentType.includes('webp')
        ? 'webp'
        : contentType.includes('avif')
          ? 'avif'
          : 'jpg'

    const key = `${slug}.${ext}`

    await ensureBucket(bucket)

    const { error } = await supabase.storage
      .from(bucket)
      .upload(key, buf, { contentType, upsert: true, cacheControl: '3600' })

    if (error) return null

    const { data } = supabase.storage.from(bucket).getPublicUrl(key)
    return data?.publicUrl || null
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
    .replace(/-+/g, '-')
    // take first 5 words only to keep URLs short and clean
    .split('-').slice(0, 5).join('-')
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
  if (!t) return `${fallbackCategory} 최신 업데이트`

  // Heuristic headline rewrite (Korean framing, keep product names)
  let head = t
  head = head.replace(/^Apple introduces\s+/i, '')
  head = head.replace(/^Apple announces\s+/i, '')
  head = head.replace(/^Apple unveils\s+/i, '')
  head = head.replace(/^Google announces\s+/i, '')
  head = head.replace(/^Microsoft announces\s+/i, '')

  // Keep it short-ish
  head = head.slice(0, 90)

  return `${head} 정리: 핵심 포인트와 구매 체크리스트`
}

async function buildDetailedKoreanPost(item, feed) {
  const sourceName = feed.name
  const sourceUrl = item.link || ''
  const publishedAt = item.isoDate || item.pubDate || ''
  const hotlinkCover = item.enclosure?.url || null

  const rawTitle = ensureText(item.title || '')
  const title = titleToKorean(rawTitle, feed.category || 'IT')

  const summary = [
    `발표/업데이트: ${rawTitle || '공식 발표'}`,
    '',
    '한 줄 요약: 핵심 변화 포인트를 정리하고, “지금 구매 vs 대기” 판단 체크리스트를 제공합니다.',
    '',
    '추천 대상(빠르게 보기)',
    '- 지금 기기에서 불편함이 명확한 사람(배터리/속도/휴대성)',
    '- 새 학기/업무 일정 등으로 구매 시점이 정해진 사람',
    '',
    '보류 대상(잠깐 대기)',
    '- 한국 가격/출시/프로모션이 확정되기 전이라면 한 번 더 비교',
  ].join('\n')

  const keyPoints = [
    '핵심 포인트(3분 컷)',
    '1) 무엇이 바뀌었나 — “체감”이 생길 변화인지 확인',
    '2) 가격/출시 — 한국 정발/가격/프로모션 확정 여부',
    '3) 업그레이드 가치 — 내 병목(RAM/SSD/배터리/발열) 해결 여부',
    '4) 대체재 — 같은 예산대 후보(이전 세대/경쟁 제품)와 비교',
  ].join('\n')

  const checklist = [
    '구매 체크리스트(체크하고 결론 내리기)',
    '- ☐ 한국 출시일/가격/구성이 확정됐나?',
    '- ☐ AppleCare+/AS 조건이 내 기준에 맞나?',
    '- ☐ 내 사용패턴에서 병목이 뭔지 확실한가? (RAM/SSD/배터리/발열)',
    '- ☐ 옵션 구성(메모리/저장공간)을 과소/과대 선택하지 않았나?',
    '- ☐ 직구 vs 정발 총비용(환율/관부가세/보증)을 계산했나?',
  ].join('\n')

  const prosCons = [
    '**살까 말까(빠른 판단)**',
    '',
    '**추천(사는 쪽)**',
    '- 지금 기기 불편이 명확하고, 당장 교체가 필요한 경우',
    '- 배터리/휴대성/소음/발열 등 “생활 불편”이 큰 경우',
    '',
    '**보류(기다리는 쪽)**',
    '- 한국 가격/출시/프로모션이 아직 불확실한 경우',
    '- 급하지 않아서 4~8주 가격 흐름을 볼 수 있는 경우',
  ].join('\n')

  const koreaChecklist = [
    '한국 사용자 체크포인트',
    '- 정발 여부 / 출시일 / 사전예약 혜택',
    '- AppleCare+ / AS 정책, 수리 기간, 교체 비용',
    '- 충전/허브/외부 모니터 등 주변기기 호환',
    '- 직구 vs 정발: 총비용/보증 차이',
  ].join('\n')

  const faq = [
    'FAQ(짧게)',
    '- 지금 사도 되나요? → 당장 필요하면 구매, 여유가 있으면 한국 조건 확정 후 결정이 안전합니다.',
    '- 업그레이드 가치가 있나요? → CPU보다 RAM/SSD/배터리 상태가 체감에 큰 경우가 많습니다.',
    '- 옵션은 어떻게 고르나요? → “RAM 부족 스트레스”면 메모리, “항상 꽉 참”이면 저장공간 우선.',
  ].join('\n')

  const conclusion = [
    '결론',
    '이번 발표는 “모두에게 체감”이 아니라, 내 병목을 해결하는 사람에게 가치가 큽니다.',
    '댓글로 용도(문서/개발/영상)만 남겨주면 옵션 선택(메모리/저장공간)을 더 구체적으로 추천할게요.',
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
    { heading: '요약', content: summary },
    { heading: '핵심 포인트', content: keyPoints },
    { heading: '구매 체크리스트', content: checklist },
    { heading: '살까 말까', content: prosCons },
    { heading: '한국 사용자 체크포인트', content: koreaChecklist },
    { heading: '관련 악세사리 추천', content: '이 제품과 함께 많이 구매하는 악세사리를 확인해 보세요.' },
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
        '- 내 예산 상한선은? (기기 + 보증 + 액세서리)',
        '- 지금 가장 불편한 점은? (속도/배터리/무게/발열/소음/포트)',
        '- 그 불편함이 새 모델에서 해결되나?',
        '- 한국 정발/AS 조건은 명확한가?',
        '- 저장공간/메모리 옵션은 충분한가? (2~3년 기준)',
        '- 주변기기/포트 구성은 맞나?',
        '- 1~2개월 기다리면 조건이 좋아질 가능성은?',
        '- 중고로 되팔 계획이 있나?',
        '- 지금은 Need인가 Want인가?',
        '- 결론을 한 문장으로 적어보기',
      ].join('\n'),
    })
  }

  return {
    title,
    description: `상세 요약/체크리스트: ${rawTitle || feed.category || 'IT'}`,
    category: feed.category || 'news',
    tags: ['it', 'news', feed.category || 'news', sourceName.replace(/\s+/g, '-')].slice(0, 6),
    hotlinkCover,
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

async function upsertPostAndSections({
  slug,
  title,
  description,
  category,
  tags,
  author,
  featured,
  readMinutes,
  createdAt,
  coverImageUrl,
  sourceUrl,
  sections,
}) {
  // 1) Upsert post by slug (idempotent)
  const { data: postRow, error: postError } = await supabase
    .from('posts')
    .upsert(
      {
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
      },
      { onConflict: 'slug' },
    )
    .select('id')
    .single()

  if (postError) throw postError

  const postId = postRow.id

  // 2) Delete existing sections then re-insert (idempotent)
  const { error: delErr } = await supabase.from('post_sections').delete().eq('post_id', postId)
  if (delErr) throw delErr

  const sectionRows = sections.map((s, idx) => ({
    post_id: postId,
    position: idx + 1,
    heading: s.heading,
    // IMPORTANT: keep real newlines (\n\n) for paragraphs.
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

      const coverImageUrl = await cacheCoverToStorage({
        bucket: 'covers',
        slug,
        sourceUrl: post.sourceUrl,
        coverUrl: post.hotlinkCover,
      })

      // read_minutes heuristic (from your guide)
      const approxChars = post.sections.map((s) => `${s.heading}\n${s.content}`).join('\n\n').length
      const readMinutes = Math.max(3, Math.ceil(Math.min(approxChars, 3000) / 300) + 1)

      await upsertPostAndSections({
        slug,
        title: post.title,
        description: post.description,
        category: post.category,
        tags: post.tags,
        author: '오늘의 IT 블로그',
        featured: false,
        readMinutes,
        createdAt: publishedAt,
        coverImageUrl,
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
