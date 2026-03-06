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

// 제목 키워드로 카테고리 자동 감지
const KEYWORD_MAP = [
  { pattern: /macbook|mac\s*book|notebook|laptop|노트북|그램|\bgram\b|갤럭시\s*북|galaxy\s*book|vivobook|zenbook|thinkpad|m\d+\s*(pro|max)\b/i, slug: 'laptop' },
  { pattern: /iphone|galaxy\s*s|galaxy\s*z|pixel\s*\d|스마트폰|smartphone|android\s*phone/i, slug: 'smartphone' },
  { pattern: /ipad|galaxy\s*tab|태블릿|tablet/i, slug: 'tablet' },
  { pattern: /imac|mac\s*mini|mac\s*pro|mac\s*studio|desktop|데스크탑/i, slug: 'desktop' },
  { pattern: /apple\s*watch|galaxy\s*watch|웨어러블|wearable|watch\s*\d|fitbit/i, slug: 'wearable' },
  { pattern: /airpods|earbuds|headphone|이어폰|헤드폰|스피커|speaker|audio|buds/i, slug: 'audio' },
  { pattern: /macos|windows|ios\s*\d|android\s*\d|소프트웨어|software|os\s*update|앱\s*업데이트/i, slug: 'software' },
  { pattern: /\bai\b|chatgpt|claude|gemini|llm|gpt|copilot|인공지능|머신러닝|딥러닝/i, slug: 'ai' },
]

function detectCategory(title) {
  for (const { pattern, slug } of KEYWORD_MAP) {
    if (pattern.test(title)) return slug
  }
  return 'it-news'
}

function inferTags(title, category) {
  const t = String(title || '')

  // Minimal, safe tags (4~6) per guide. Prefer product/brand/category keywords.
  const tags = new Set()

  // Brand/product hints
  if (/\blg\b|\bgram\b|그램/i.test(t)) {
    tags.add('lg')
    tags.add('gram')
    tags.add('노트북')
  }
  if (/apple|macbook|ipad|iphone|airpods/i.test(t)) tags.add('apple')
  if (/galaxy|samsung|갤럭시/i.test(t)) tags.add('samsung')
  if (/m\d+/i.test(t)) tags.add(t.match(/m\d+/i)?.[0].toLowerCase())
  if (/rtx\s*\d+/i.test(t)) tags.add(t.match(/rtx\s*\d+/i)?.[0].toLowerCase().replace(/\s+/g, ''))

  // Category tag
  tags.add(category)

  // Fallbacks
  if (tags.size < 4) tags.add('업데이트')
  if (tags.size < 4) tags.add('신제품')

  return Array.from(tags).filter(Boolean).slice(0, 6)
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

function stripPressPrefix(t) {
  let head = ensureText(t)
  if (!head) return ''
  head = head.replace(/^\[[^\]]+\]\s*/g, '')
  head = head.replace(/^Apple introduces\s+/i, '')
  head = head.replace(/^Apple announces\s+/i, '')
  head = head.replace(/^Apple unveils\s+/i, '')
  head = head.replace(/^Google announces\s+/i, '')
  head = head.replace(/^Microsoft announces\s+/i, '')
  head = head.replace(/^LG\s+Electronics\s+introduces\s+/i, '')
  return head.slice(0, 95)
}

function detectPostTemplate({ category, rawTitle }) {
  // Template A: review-style (product launch/announcement) for device categories
  // Template B: info-style (news/update/issue) for software/ai/it-news
  const deviceCats = new Set(['laptop', 'smartphone', 'tablet', 'desktop', 'wearable', 'audio'])
  const infoCats = new Set(['software', 'ai', 'it-news'])

  const t = String(rawTitle || '')

  const issuePattern =
    /issue|issues|problem|bug|outage|incident|security|vulnerab|breach|recall|warning|lawsuit|policy|terms|pricing|price increase|deprecate|sunset|retire|end of life|eol|패치|버그|오류|장애|보안|취약|유출|리콜|주의|정책|약관|가격|인상|중단|은퇴|종료/i
  const launchPattern =
    /introduces|announces|unveils|launches|debut|reveals|new\s+|lineup|available|pre[-\s]?order|release|출시|공개|발표|라인업|사전예약|예약/i

  // Explicit info categories
  if (infoCats.has(category)) return 'B'

  // Product categories: issues/updates should go to Template B
  if (deviceCats.has(category)) {
    if (issuePattern.test(t)) return 'B'
    if (launchPattern.test(t)) return 'A'
    // default: announcement-ish
    return 'A'
  }

  // Fallback
  return issuePattern.test(t) ? 'B' : 'A'
}

function titleForTemplateA(rawTitle, category) {
  const head = stripPressPrefix(rawTitle) || category
  return `${head} 공개 정리: 핵심 포인트와 추천 체크리스트`
}

function titleForTemplateB(rawTitle, category) {
  const head = stripPressPrefix(rawTitle) || category
  return `${head} 업데이트/이슈 정리: 핵심 변경점과 대응 체크리스트`
}

function buildSectionsTemplateA({ rawTitle, category, sourceName, sourceUrl, publishedAt }) {
  const summary = [
    `발표/업데이트: ${rawTitle || '공식 발표'}`,
    '',
    '한 줄 요약: 신제품/신규 라인업 발표 기준으로 핵심 변화와 “지금 살지/기다릴지” 판단 포인트를 한국 사용자 관점에서 정리합니다.',
    '',
    '추천 대상(빠르게 보기)',
    '- 이전 세대에서 불편(배터리/무게/성능/발열)이 명확한 사람',
    '- 출시/학기/업무 일정 때문에 구매 시점이 정해진 사람',
    '',
    '보류 대상(잠깐 대기)',
    '- 한국 가격/정발 구성/프로모션이 확정되기 전이라면 조건 공개 후 비교가 안전',
  ].join('\n')

  const keyPoints = [
    '핵심 포인트(3분 컷)',
    '1) 변화 포인트 — 세대 교체에서 “체감”이 생길 부분',
    '2) 성능/배터리/화면/무게 — 내 사용패턴의 병목 해결 여부',
    '3) 한국 출시/가격 — 정발/프로모션/구성 확정 여부',
    '4) 경쟁 제품/이전 세대 — 같은 예산대 대체재 비교',
  ].join('\n')

  const checklist = [
    '구매 체크리스트(체크하고 결론 내리기)',
    '- ☐ 한국 출시일/가격/구성이 확정됐나?',
    '- ☐ AS/보증 조건이 내 기준에 맞나? (정발/직구 포함)',
    '- ☐ 내 사용패턴에서 병목이 뭔지 확실한가? (성능/배터리/발열/소음/휴대성)',
    '- ☐ 옵션 구성(메모리/저장공간/화면/통신)을 과소/과대 선택하지 않았나?',
    '- ☐ 직구 vs 정발 총비용(환율/관부가세/보증)을 계산했나?',
  ].join('\n')

  const options = [
    '옵션/모델 추천 가이드',
    '- 문서/웹/강의·회의 중심 → 휴대성/배터리/무게 우선',
    '- 개발/멀티태스킹(탭/IDE/협업툴) → RAM 여유(최소 16GB 이상) 우선',
    '- 영상/디자인 → 화면 품질 + SSD 1TB 고려, 발열/지속 성능 리뷰 확인',
  ].join('\n')

  const prosCons = [
    '**살까 말까(빠른 판단)**',
    '',
    '**추천(사는 쪽)**',
    '- 지금 기기 불편이 명확하고, 이번 발표가 그 지점을 해결하는 경우',
    '- 일정상 바로 필요해서 기다리기 어려운 경우',
    '',
    '**보류(기다리는 쪽)**',
    '- 한국 가격/정발/프로모션이 아직 불확실한 경우',
    '- 실사용 리뷰(발열/소음/배터리) 확인 후 결정하고 싶은 경우',
  ].join('\n')

  const koreaChecklist = [
    '한국 사용자 체크포인트',
    '- 정발 여부 / 출시일 / 사전예약 혜택',
    '- AS/보증 정책, 수리 기간, 교체 비용(가능하면 공식 안내 확인)',
    '- 충전/허브/외부 모니터 등 주변기기 호환',
    '- 직구 vs 정발: 총비용/보증 차이',
  ].join('\n')

  const accessory = '이 제품과 함께 많이 구매하는 악세사리를 확인해 보세요.'

  // IMPORTANT: FAQ is rendered as accordion.
  // Format should be: `질문?` on its own line, followed by one or more answer lines like `- 답변...`.
  const faq = [
    'FAQ(짧게)',
    '지금 사도 되나요?',
    '- 급하면 구매, 여유가 있으면 한국 조건/실사용 리뷰 확인 후가 안전합니다.',
    '업그레이드 가치가 있나요?',
    '- 스펙보다 내 병목(배터리/무게/발열/소음/화면)이 해결되는지가 핵심입니다.',
    '옵션은 어떻게 고르나요?',
    '- RAM 부족 스트레스면 메모리, 항상 꽉 차면 저장공간 우선으로 잡으세요.',
  ].join('\n')

  const conclusion = [
    '결론',
    '이번 신제품 발표의 핵심은 “누구에게 체감이 생기느냐”입니다.',
    '한국 가격/정발 조건이 확정되면 판단이 쉬워지니, 조건 공개 전에는 비교 대기가 안전할 수 있어요.',
    '댓글로 용도(문서/개발/영상/게임 등)만 남겨주면 모델/옵션 선택을 더 구체적으로 추천할게요.',
  ].join('\n')

  const sources = [
    '---',
    `출처: ${sourceName}`,
    sourceUrl ? `원문 링크: ${sourceUrl}` : null,
    publishedAt ? `발행일(원문): ${publishedAt}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return [
    { heading: '요약', content: summary },
    { heading: '핵심 포인트', content: keyPoints },
    { heading: '구매 체크리스트', content: checklist },
    { heading: '옵션/모델 추천', content: options },
    { heading: '살까 말까', content: prosCons },
    { heading: '한국 사용자 체크포인트', content: koreaChecklist },
    { heading: '관련 악세사리 추천', content: accessory },
    { heading: 'FAQ', content: faq },
    { heading: '결론', content: conclusion },
    { heading: '출처', content: sources },
  ]
}

function buildSectionsTemplateB({ rawTitle, category, sourceName, sourceUrl, publishedAt }) {
  const summary = [
    `발표/업데이트: ${rawTitle || '업데이트'}`,
    '',
    '한 줄 요약: 이번 업데이트/이슈에서 “무엇이 바뀌었고”, “누가 영향 받으며”, “지금 뭘 해야 하는지”를 한국 사용자 관점으로 정리합니다.',
    '',
    '추천 대상(빠르게 보기)',
    '- 해당 서비스/OS/툴을 현재 쓰고 있고 변경점이 업무/학습 흐름에 영향을 주는 사람',
    '- 정책/가격/보안 이슈처럼 “대응이 필요한 뉴스”를 빠르게 파악하고 싶은 사람',
    '',
    '보류 대상(잠깐 대기)',
    '- 이번 이슈가 일시적이고 원문 업데이트가 이어질 가능성이 높아, 후속 공지까지 보고 판단하려는 사람',
  ].join('\n')

  const keyPoints = [
    '핵심 포인트(3분 컷)',
    '1) 변경점 요약 — 실제로 달라진 기능/정책/동작',
    '2) 영향 범위 — 어떤 사용자/환경에서 체감되는가',
    '3) 대응 체크리스트 — 지금 해야 할 설정/업데이트/주의사항',
    '4) 일정 — 적용/전환/은퇴(종료) 일정이 있나',
  ].join('\n')

  const checklist = [
    '대응 체크리스트(체크하고 결론 내리기)',
    '- ☐ 내 계정/기기/팀 워크플로우가 영향 범위에 포함되나?',
    '- ☐ 업데이트/정책 적용 시점(날짜/지역/플랜)이 명확한가?',
    '- ☐ 업무/학습에서 가장 중요한 리스크(중단/보안/품질)는 무엇인가?',
    '- ☐ 대체 방법(이전 버전/대체 도구/우회 설정)이 필요한가?',
    '- ☐ 공식 후속 공지/문서(시스템 카드/릴리즈 노트)를 확인했나?',
  ].join('\n')

  const impact = [
    '영향 범위(누가 체감하나)',
    '- 일반 사용자: 기능/톤/UX 변화가 “매일 쓰는 흐름”을 바꾸는지',
    '- 팀/조직: 정책/보안/로그/비용 변화가 운영에 영향 있는지',
    '- 개발자: API/모델명/버전/레거시 은퇴 일정이 있는지',
  ].join('\n')

  const koreaChecklist = [
    '한국 사용자 체크포인트',
    '- 한국어 품질/현지화/지원 범위가 명확한가',
    '- 한국 결제/환불/사업자 결제/세금계산서 등 운영 이슈',
    '- 국내 정책/규정(기업 보안, 개인정보 등)과 충돌 가능성',
  ].join('\n')

  const faq = [
    'FAQ(짧게)',
    '- 지금 뭘 먼저 하면 되나요? → 영향 범위 확인 → 업데이트/설정 적용 → 리스크(보안/업무 중단) 점검 순서가 안전합니다.',
    '- 한국어/한국 사용자 영향이 있나요? → 현지화/지원 범위가 핵심이라, 공지의 지역/언어 조건을 확인하세요.',
    '- 후속 업데이트는 어디서 보나요? → 원문 링크와 공식 릴리즈 노트/공지 채널을 즐겨찾기해두는 게 좋습니다.',
  ].join('\n')

  const conclusion = [
    '결론',
    '이번 업데이트/이슈의 핵심은 “내가 영향받는지”와 “지금 해야 할 대응이 있는지”입니다.',
    '바로 적용/전환이 필요한지, 후속 공지까지 기다려도 되는지부터 정리하면 판단이 빨라집니다.',
    '댓글로 용도(개인/팀, 사용 제품/플랜)만 남겨주면 영향 범위를 더 구체적으로 짚어줄게요.',
  ].join('\n')

  const sources = [
    '---',
    `출처: ${sourceName}`,
    sourceUrl ? `원문 링크: ${sourceUrl}` : null,
    publishedAt ? `발행일(원문): ${publishedAt}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return [
    { heading: '요약', content: summary },
    { heading: '핵심 포인트', content: keyPoints },
    { heading: '영향 범위', content: impact },
    { heading: '대응 체크리스트', content: checklist },
    { heading: '한국 사용자 체크포인트', content: koreaChecklist },
    { heading: 'FAQ', content: faq },
    { heading: '결론', content: conclusion },
    { heading: '출처', content: sources },
  ]
}

async function buildDetailedKoreanPost(item, feed) {
  const sourceName = feed.name
  const sourceUrl = item.link || ''
  const publishedAt = item.isoDate || item.pubDate || ''
  const hotlinkCover = item.enclosure?.url || null

  const rawTitle = ensureText(item.title || '')
  const category = detectCategory(rawTitle)
  const template = detectPostTemplate({ category, rawTitle })

  const title = template === 'A' ? titleForTemplateA(rawTitle, category) : titleForTemplateB(rawTitle, category)
  const sections =
    template === 'A'
      ? buildSectionsTemplateA({ rawTitle, category, sourceName, sourceUrl, publishedAt })
      : buildSectionsTemplateB({ rawTitle, category, sourceName, sourceUrl, publishedAt })

  return {
    title,
    description: `상세 요약/체크리스트: ${rawTitle || category || 'IT'}`,
    category,
    tags: inferTags(rawTitle || title, category),
    hotlinkCover,
    sourceUrl,
    sections,
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
  const maxPosts = Number.parseInt(process.env.MAX_POSTS || '2', 10) || 2

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
        author: 'ThiveLab 편집부',
        featured: false,
        readMinutes,
        createdAt: publishedAt,
        coverImageUrl,
        sourceUrl: post.sourceUrl,
        sections: post.sections,
      })

      await markIngested({ sourceId, url, title: item.title || 'Untitled', publishedAt })

      createdCount += 1
      if (createdCount >= maxPosts) break
    }

    if (createdCount >= maxPosts) break
  }

  console.log(JSON.stringify({ ok: true, createdCount }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
