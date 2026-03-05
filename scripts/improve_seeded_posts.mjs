#!/usr/bin/env node

import dotenv from 'dotenv'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
if (!SERVICE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function ensureText(s) {
  return String(s || '').replace(/\s+/g, ' ').trim()
}

function stripTags(html) {
  return ensureText(
    String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
}

async function fetchHtml(url) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 15000)
  const res = await fetch(url, {
    signal: ctrl.signal,
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      referer: 'https://www.google.com/',
    },
  })
  clearTimeout(t)
  if (!res.ok) return null
  return await res.text()
}

function extractMeta(html, key) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i',
  )
  const m = String(html).match(re)
  return m?.[1] ? ensureText(m[1]) : null
}

function extractTitle(html) {
  const m = String(html).match(/<title>([^<]+)<\/title>/i)
  return m?.[1] ? ensureText(m[1]) : null
}

function extractFirstParagraphs(html, max = 3) {
  const ps = []
  const re = /<p[^>]*>([\s\S]*?)<\/p>/gi
  let m
  while ((m = re.exec(String(html))) && ps.length < max) {
    const t = stripTags(m[1])
    if (!t) continue
    // Skip boilerplate
    if (/cookies|subscribe|sign up|로그인|쿠키|개인정보/i.test(t)) continue
    ps.push(t)
  }
  return ps
}

function kTitle(raw, category) {
  const t = ensureText(raw)
  // Keep product names; remove bracketed prefixes like [Galaxy Unpacked 2026]
  const cleaned = t.replace(/^\[[^\]]+\]\s*/g, '').slice(0, 90)

  // SEO-ish Korean framing per category
  if (category === 'ai') return `${cleaned} 정리: 핵심 변화와 써먹는 체크리스트`
  if (category === 'software') return `${cleaned} 업데이트 정리: 핵심 변경점과 체크리스트`
  if (category === 'it-news') return `${cleaned} 정리: 업계 영향과 체크포인트`

  return `${cleaned} 정리: 핵심 포인트와 체크리스트`
}

function buildSections({ rawTitle, category, paragraphs, sourceName, sourceUrl, publishedIso }) {
  const p1 = paragraphs?.[0] ? `\n\n추가 요약: ${paragraphs[0]}` : ''

  const summary = [
    `발표/업데이트: ${rawTitle}`,
    '',
    `한 줄 요약: 이번 소식에서 “한국 사용자 기준으로 체감되는 변화”와 체크포인트를 빠르게 정리했습니다.${p1}`,
    '',
    '추천 대상(빠르게 보기)',
    '- 해당 제품/서비스를 이미 쓰고 있고, 이번 변경점이 내 사용패턴에 영향이 있는 사람',
    '- 출시/업데이트 일정 때문에 구매·업그레이드·전환 타이밍을 고민하는 사람',
    '',
    '보류 대상(잠깐 대기)',
    '- 한국 출시/가격/정책이 확정되지 않아 최종 판단이 어려운 사람(확정 후 비교 추천)',
  ].join('\n')

  const keyPoints = [
    '핵심 포인트(3분 컷)',
    '1) 무엇이 바뀌었나 — “체감”이 생길 변화인지 확인',
    '2) 한국 출시/가격/정책 — 정발/프로모션/구독 조건 체크',
    '3) 업그레이드/전환 가치 — 내 병목(성능/배터리/호환/정확도) 해결 여부',
    '4) 경쟁/대체재 — 같은 예산대(또는 이전 세대)와 비교 포인트',
  ].join('\n')

  const checklist = [
    '구매 체크리스트(체크하고 결론 내리기)',
    '- ☐ 한국 출시일/가격/구성이 확정됐나?',
    '- ☐ AS/보증/정책(정발/직구/계정/요금제)이 내 기준에 맞나?',
    '- ☐ 내 사용패턴에서 병목이 뭔지 확실한가? (성능/배터리/발열/호환/정확도)',
    '- ☐ 옵션/플랜/세대 선택을 과소/과대하지 않았나?',
    '- ☐ 대체재(이전 세대/경쟁 제품)와 비교했나?',
  ].join('\n')

  const sal = [
    '**살까 말까(빠른 판단)**',
    '',
    '**추천(하는 쪽)**',
    '- 지금 쓰는 기기/서비스에서 불편이 명확하고, 이번 변화가 그 지점을 건드리는 경우',
    '- 일정상 바로 필요해서 기다리기 어려운 경우',
    '',
    '**보류(기다리는 쪽)**',
    '- 한국 가격/출시/정책/실사용 리뷰가 아직 불확실한 경우',
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
    '- 업그레이드 가치가 있나요? → 스펙보다 내 병목(배터리/발열/호환/정확도)이 해결되는지가 핵심입니다.',
    '- 옵션은 어떻게 고르나요? → 자주 막히는 자원(RAM/저장공간/요금제/플랜)을 먼저 넉넉히 잡는 게 후회가 적습니다.',
  ].join('\n')

  const conclusion = [
    '결론',
    '이번 소식은 “모두에게 무조건 좋은 업그레이드”라기보다, 내 병목을 건드리는 사람에게 가치가 큽니다.',
    '한국 출시/가격/정책이 확정되면 판단이 더 쉬워지니, 조건 공개 전에는 비교 대기가 안전할 수 있어요.',
    '댓글로 용도(문서/개발/영상/게임 등)만 남겨주면 선택을 더 구체적으로 추천할게요.',
  ].join('\n')

  const sources = ['---', `출처: ${sourceName}`, `원문 링크: ${sourceUrl}`, `발행일(원문): ${publishedIso}`].join('\n')

  return [
    { heading: '요약', content: summary },
    { heading: '핵심 포인트', content: keyPoints },
    { heading: '구매 체크리스트', content: checklist },
    { heading: '살까 말까', content: sal },
    { heading: '한국 사용자 체크포인트', content: korea },
    { heading: '관련 악세사리 추천', content: accessory },
    { heading: 'FAQ', content: faq },
    { heading: '결론', content: conclusion },
    { heading: '출처', content: sources },
  ]
}

async function ensureBucket(bucket) {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (buckets?.some((b) => b.name === bucket)) return
  await supabase.storage.createBucket(bucket, { public: true })
}

async function cacheCoverToStorage({ bucket, slug, sourceUrl, coverUrl }) {
  const targetUrl = coverUrl
  if (!targetUrl) return null

  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 15000)
    const res = await fetch(targetUrl, {
      signal: ctrl.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; thivelab_improve/1.0)',
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
      .upload(key, buf, { contentType, upsert: true, cacheControl: '86400' })

    if (error) return null

    const { data } = supabase.storage.from(bucket).getPublicUrl(key)
    return data?.publicUrl || null
  } catch {
    return null
  }
}

async function upsertSections(postId, sections) {
  const { error: delErr } = await supabase.from('post_sections').delete().eq('post_id', postId)
  if (delErr) throw delErr

  const rows = sections.map((s, idx) => ({
    post_id: postId,
    position: idx + 1,
    heading: s.heading,
    content: s.content,
  }))

  const { error: insErr } = await supabase.from('post_sections').insert(rows)
  if (insErr) throw insErr
}

async function main() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id,slug,title,description,category,tags,source_url,cover_image_url,created_at')
    .in('id', [30, 31, 32, 33, 34, 35, 36, 37, 38])
    .order('id')

  if (error) throw error

  const out = []

  for (const p of posts) {
    const sourceUrl = p.source_url
    if (!sourceUrl) {
      out.push({ id: p.id, ok: false, reason: 'missing source_url' })
      continue
    }

    const html = await fetchHtml(sourceUrl)

    const ogTitle = (html && (extractMeta(html, 'og:title') || extractTitle(html))) || p.title
    const ogDesc = (html && (extractMeta(html, 'og:description') || extractMeta(html, 'description'))) || p.description
    const ogImage = html ? extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image') : null

    const publishedIso =
      (() => {
        if (html) {
          const m =
            html.match(/\"datePublished\"\s*:\s*\"([^\"]+)\"/i) ||
            html.match(/property=\"article:published_time\"[^>]+content=\"([^\"]+)\"/i)
          if (m?.[1]) return new Date(m[1]).toISOString()
        }
        return new Date(p.created_at || new Date()).toISOString()
      })()

    const paragraphs = html ? extractFirstParagraphs(html, 3) : []

    const newTitle = kTitle(ogTitle, p.category)
    const newDesc = `상세 요약/체크리스트: ${ensureText(ogDesc || ogTitle || '')}`.slice(0, 160)

    const sections = buildSections({
      rawTitle: ensureText(ogTitle) || ensureText(p.title),
      category: p.category,
      paragraphs,
      sourceName: inferSourceName(sourceUrl),
      sourceUrl,
      publishedIso,
    })

    const coverPublic = await cacheCoverToStorage({
      bucket: 'covers',
      slug: p.slug,
      sourceUrl,
      coverUrl: ogImage,
    })

    const approxChars = sections.map((s) => `${s.heading}\n${s.content}`).join('\n\n').length
    const readMinutes = Math.max(3, Math.ceil(Math.min(approxChars, 3000) / 300) + 1)

    const tags = inferTags(newTitle, p.category)

    const { error: upErr } = await supabase
      .from('posts')
      .update({
        title: newTitle,
        description: newDesc,
        tags,
        read_minutes: readMinutes,
        cover_image_url: coverPublic || p.cover_image_url || null,
        created_at: publishedIso,
      })
      .eq('id', p.id)

    if (upErr) throw upErr

    await upsertSections(p.id, sections)

    out.push({ id: p.id, ok: true, title: newTitle, cover: Boolean(coverPublic) })

    await sleep(350)
  }

  console.log(JSON.stringify({ ok: true, updated: out.length, out }, null, 2))
}

function inferSourceName(url) {
  if (/apple\.com\/newsroom/i.test(url)) return 'Apple Newsroom'
  if (/openai\.com\/index/i.test(url) || /openai\.com\/news/i.test(url)) return 'OpenAI News'
  if (/news\.samsung\.com/i.test(url)) return 'Samsung Global Newsroom'
  if (/prnewswire\.com/i.test(url)) return 'PR Newswire'
  return 'Source'
}

function inferTags(title, category) {
  const t = String(title || '')
  const tags = new Set()

  // category is always a tag
  tags.add(category)

  if (/openai|chatgpt|gpt/i.test(t)) tags.add('openai')
  if (/chatgpt/i.test(t)) tags.add('chatgpt')
  const g = t.match(/gpt[-\s]?\d+(?:\.\d+)?/i)?.[0]
  if (g) tags.add(g.toLowerCase().replace(/\s+/g, ''))

  if (/apple|macbook|iphone|ipad|airpods|xcode|ios|macos|watchos/i.test(t)) tags.add('apple')
  if (/samsung|galaxy|buds/i.test(t)) tags.add('samsung')

  if (/macbook|laptop|notebook|\bgram\b|그램/i.test(t)) tags.add('노트북')
  if (/iphone|smartphone|스마트폰/i.test(t)) tags.add('스마트폰')
  if (/ipad|tablet|태블릿/i.test(t)) tags.add('태블릿')
  if (/watch|wearable|웨어러블/i.test(t)) tags.add('웨어러블')
  if (/buds|airpods|audio|헤드폰|이어폰|스피커/i.test(t)) tags.add('오디오')

  if (/update|업데이트/i.test(t)) tags.add('업데이트')

  return Array.from(tags).slice(0, 6)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
