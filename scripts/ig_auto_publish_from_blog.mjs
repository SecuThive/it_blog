#!/usr/bin/env node

/**
 * Fully automated Instagram publishing from latest blog posts.
 *
 * Policy (recommended): if anything fails, SKIP (do not publish) and log.
 *
 * Requirements:
 * - Supabase env in .env.local (service role)
 * - IG_TOKEN_PATH points to access token file
 * - IG_BUSINESS_ID set
 * - Python venv .venv-ig with cairosvg installed (created earlier)
 */

import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thivelab.com'

const IG_BUSINESS_ID = process.env.IG_BUSINESS_ID
const IG_TOKEN_PATH = process.env.IG_TOKEN_PATH

if (!SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
if (!SERVICE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
if (!IG_BUSINESS_ID) throw new Error('Missing IG_BUSINESS_ID')
if (!IG_TOKEN_PATH) throw new Error('Missing IG_TOKEN_PATH')

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const ledgerPath = path.join(process.cwd(), 'content', 'ig_post_ledger.jsonl')
const workDir = path.join(process.cwd(), 'content', 'ig_auto')

function nowIso() {
  return new Date().toISOString()
}

function readLedgerSlugs() {
  try {
    const txt = fs.readFileSync(ledgerPath, 'utf8')
    const slugs = new Set()
    for (const line of txt.split('\n')) {
      const t = line.trim()
      if (!t) continue
      try {
        const j = JSON.parse(t)
        if (j?.slug) slugs.add(String(j.slug))
      } catch {}
    }
    return slugs
  } catch {
    return new Set()
  }
}

function appendLedger(entry) {
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true })
  fs.appendFileSync(ledgerPath, JSON.stringify(entry) + '\n')
}

function safeText(s) {
  return String(s || '').replace(/\s+/g, ' ').trim()
}

function wrapLines(text, maxChars = 16) {
  const words = safeText(text).split(' ')
  const lines = []
  let cur = ''
  for (const w of words) {
    const nxt = cur ? `${cur} ${w}` : w
    if (nxt.length > maxChars && cur) {
      lines.push(cur)
      cur = w
    } else {
      cur = nxt
    }
  }
  if (cur) lines.push(cur)
  return lines.slice(0, 3)
}

function svgSlide({ page, title, subtitle, bullets }) {
  const tLines = wrapLines(title, 14)
  const titleSvg = tLines
    .map((l, i) => `<text x="120" y="${360 + i * 92}" font-size="78" font-weight="900" fill="rgba(255,255,255,0.92)">${escapeXml(l)}</text>`)
    .join('')

  const subtitleSvg = subtitle
    ? `<text x="120" y="${360 + tLines.length * 92 + 42}" font-size="34" font-weight="700" fill="rgba(234,240,255,0.70)">${escapeXml(subtitle)}</text>`
    : ''

  const bulletSvg = (bullets || []).slice(0, 5).map((b, idx) => {
    const y = 720 + idx * 72
    return `<text x="140" y="${y}" font-size="34" font-weight="650" fill="rgba(234,240,255,0.82)">• ${escapeXml(b)}</text>`
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1080" y2="1350" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0B1220"/>
      <stop offset="1" stop-color="#0A1328"/>
    </linearGradient>
    <linearGradient id="accent" x1="120" y1="180" x2="960" y2="1170" gradientUnits="userSpaceOnUse">
      <stop stop-color="#7C3AED"/>
      <stop offset="1" stop-color="#22D3EE"/>
    </linearGradient>
  </defs>

  <rect width="1080" height="1350" fill="url(#bg)"/>
  <circle cx="900" cy="260" r="320" fill="#22D3EE" opacity="0.12"/>
  <circle cx="240" cy="1100" r="340" fill="#7C3AED" opacity="0.14"/>

  <text x="120" y="140" font-size="28" font-weight="750" fill="rgba(234,240,255,0.72)">ThiveLab · 가성비 IT 구매가이드</text>
  <text x="960" y="140" text-anchor="end" font-size="28" font-weight="850" fill="rgba(234,240,255,0.72)">${page}/5</text>

  <rect x="100" y="240" width="880" height="980" rx="48" fill="rgba(15,23,42,0.68)" stroke="rgba(255,255,255,0.10)" stroke-width="2"/>
  <path d="M140 640H940" stroke="url(#accent)" stroke-width="10" stroke-linecap="round" opacity="0.65"/>

  ${titleSvg}
  ${subtitleSvg}
  ${bulletSvg}

  <text x="120" y="1290" font-size="26" font-weight="650" fill="rgba(234,240,255,0.62)">저장해두고 필요할 때 보세요</text>
</svg>`
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function convertPngToJpg(pngFiles, jpgFiles) {
  for (let i = 0; i < pngFiles.length; i++) {
    const png = pngFiles[i]
    const jpg = jpgFiles[i]
    const r = spawnSync('sips', ['-s', 'format', 'jpeg', png, '--out', jpg], { encoding: 'utf8' })
    if (r.status !== 0) throw new Error(`sips jpeg convert failed: ${r.stderr || r.stdout}`)
  }
}

async function uploadToStorage(localFiles, prefix) {
  // Uses Supabase service role.
  const bucket = 'ig'

  const { data: buckets } = await sb.storage.listBuckets()
  if (!buckets?.some((b) => b.name === bucket)) {
    await sb.storage.createBucket(bucket, { public: true })
  }

  const urls = []
  for (const file of localFiles) {
    const buf = fs.readFileSync(file)
    const key = `${prefix}/${path.basename(file)}`
    const ext = path.extname(file).toLowerCase()
    const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png'

    const { error } = await sb.storage.from(bucket).upload(key, buf, {
      contentType,
      upsert: true,
      cacheControl: '3600',
    })
    if (error) throw error
    const { data } = sb.storage.from(bucket).getPublicUrl(key)
    urls.push(data.publicUrl)
  }
  return urls
}

async function fetchJsonWithTimeout(url, opts = {}, timeoutMs = 12000) {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...opts, signal: ac.signal })
    const json = await res.json().catch(() => ({}))
    return { res, json }
  } finally {
    clearTimeout(t)
  }
}

async function graphPost(pathname, token, params) {
  const url = new URL(`https://graph.facebook.com/v19.0${pathname}`)
  url.searchParams.set('access_token', token)

  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) body.set(k, String(v))

  const { res, json } = await fetchJsonWithTimeout(url, { method: 'POST', body }, 20000)
  if (!res.ok) {
    const msg = json?.error?.message || res.statusText
    throw new Error(`${res.status} ${msg}`)
  }
  return json
}

async function graphGet(pathname, token, params = {}) {
  const url = new URL(`https://graph.facebook.com/v19.0${pathname}`)
  url.searchParams.set('access_token', token)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))

  const { res, json } = await fetchJsonWithTimeout(url, { method: 'GET' }, 20000)
  if (!res.ok) {
    const msg = json?.error?.message || res.statusText
    throw new Error(`${res.status} ${msg}`)
  }
  return json
}

async function assertPublicImageUrlsOk(urls) {
  for (const u of urls) {
    // HEAD is sometimes blocked; use GET with Range when possible.
    const url = new URL(u)
    const { res } = await fetchJsonWithTimeout(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-2000' },
    })
    if (!res.ok) throw new Error(`Image URL not accessible (${res.status}): ${u}`)
  }
}

async function verifyPublishedMedia(token, mediaId) {
  // Best-effort verification. Not all fields are accessible depending on permissions.
  const data = await graphGet(`/${mediaId}`, token, {
    fields: 'id,media_type,media_product_type,permalink,timestamp,username',
  })
  if (!data?.id) throw new Error('Published media verify failed: missing id')
  return data
}

async function publishCarousel({ igId, token, imageUrls, caption }) {
  if (!Array.isArray(imageUrls) || imageUrls.length < 2) throw new Error('Need >=2 images for carousel')

  // Pre-flight: ensure URLs are publicly reachable (prevents broken uploads).
  await assertPublicImageUrlsOk(imageUrls)

  // 1) children
  const childIds = []
  for (const u of imageUrls) {
    const child = await graphPost(`/${igId}/media`, token, { image_url: u, is_carousel_item: 'true' })
    childIds.push(child.id)
  }

  // 2) carousel container
  const carousel = await graphPost(`/${igId}/media`, token, {
    media_type: 'CAROUSEL',
    children: childIds.join(','),
    caption: truncateCaption(caption, 2200),
  })

  // 3) publish
  const published = await graphPost(`/${igId}/media_publish`, token, { creation_id: carousel.id })
  const mediaId = published.id

  // Post-flight: verify publish succeeded.
  const verified = await verifyPublishedMedia(token, mediaId)

  return { childIds, creationId: carousel.id, mediaId, verified }
}

async function pickNextPost() {
  const already = readLedgerSlugs()

  // Prefer value-for-money guides first
  const { data, error } = await sb
    .from('posts')
    .select('id,slug,title,category,tags,created_at')
    .contains('tags', ['가성비'])
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error

  const rows = data || []

  // Score: prefer evergreen guides (가이드/고르는 법/계산법), then recency.
  function score(p) {
    const title = safeText(p.title)
    const isGuide = /(가이드|고르는\s*법|계산법|체크리스트)/.test(title)
    const t = new Date(p.created_at || 0).getTime()
    return (isGuide ? 10 : 0) + t / 1e13
  }

  const sorted = rows
    .filter((p) => p?.slug && !already.has(p.slug))
    .sort((a, b) => score(b) - score(a))

  return sorted[0] || null
}

function normalizeCaption(text) {
  // Keep newlines, normalize odd whitespace.
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .trim()
}

function truncateCaption(text, max = 2200) {
  const t = normalizeCaption(text)
  if (t.length <= max) return t
  return `${t.slice(0, Math.max(0, max - 1)).trim()}…`
}

function buildCaption(post) {
  const title = safeText(post.title)
  const url = `${SITE_URL}/post/${post.slug}`

  // CTA question for comments
  const question = '댓글로 용도(문서/개발/영상) + 예산(만원) 남겨주면 가성비로 추천해줄게요.'

  const base = `${title}\n\n🔎 자세히 보기: ${url}\n\n${question}\n\n#가성비 #구매팁 #ThiveLab`
  return truncateCaption(base, 2200)
}

function buildSlidesForPost(post) {
  const head = safeText(post.title)
  const kind = String(post.category || '')

  const slide1 = svgSlide({
    page: 1,
    title: head,
    subtitle: '핵심만 1분 컷',
    bullets: ['오늘의 결론만 빠르게', '체크리스트로 판단', '저장해두고 필요할 때 보기'],
  })

  const slide2 = svgSlide({
    page: 2,
    title: '체크 1: 기준',
    subtitle: '가성비는 “싼 가격”이 아니라 “후회 없는 가격”',
    bullets: ['내 병목(속도/배터리/무게)을 먼저 정하기', '최소 컷 아래로 내려가지 않기'],
  })

  const slide3 = svgSlide({
    page: 3,
    title: '체크 2: 비교',
    subtitle: '같은 돈이면 우선순위를 바꾸기',
    bullets: ['RAM/SSD/배터리/무게 우선', 'CPU/스펙 과투자 주의'],
  })

  const slide4 = svgSlide({
    page: 4,
    title: kind === 'ai' ? '체크 3: 구독' : '체크 3: 직구/정발',
    subtitle: '총비용/정책/AS 리스크까지',
    bullets: kind === 'ai'
      ? ['무료로 안 되는 1가지를 명확히', '대체재 있으면 결제 보류', '환불/정책/데이터 확인']
      : ['환율·관부가세·배송 포함', 'AS/반품 난이도 확인', '애매하면 정발이 안전'],
  })

  const slide5 = svgSlide({
    page: 5,
    title: '한 줄 결론',
    subtitle: '저장해두고 살 때 참고',
    bullets: ['오늘 결론만 기억하면 실패가 줄어요', '댓글로 용도/예산 남기면 추천해줄게요'],
  })

  return [slide1, slide2, slide3, slide4, slide5]
}

function convertSvgsToPng(svgPaths, outPngPaths) {
  const venvDir = path.join(process.cwd(), '.venv-ig')
  const py = path.join(venvDir, 'bin', 'python')
  if (!fs.existsSync(py)) {
    throw new Error('Missing .venv-ig python. Create it and install cairosvg.')
  }

  for (let i = 0; i < svgPaths.length; i++) {
    const svg = svgPaths[i]
    const png = outPngPaths[i]
    const code = `import cairosvg; cairosvg.svg2png(url='${svg.replace(/'/g, "\\'")}', write_to='${png.replace(/'/g, "\\'")}', output_width=1080, output_height=1350)`
    const r = spawnSync(py, ['-c', code], { encoding: 'utf8' })
    if (r.status !== 0) {
      throw new Error(`cairosvg failed: ${r.stderr || r.stdout}`)
    }
  }
}

async function main() {
  fs.mkdirSync(workDir, { recursive: true })

  const token = fs.readFileSync(IG_TOKEN_PATH, 'utf8').trim()
  if (!token) throw new Error('Empty IG token')

  const dryRun = String(process.env.DRY_RUN || '').toLowerCase() === 'true'

  const post = await pickNextPost()
  if (!post) {
    console.log(JSON.stringify({ ok: true, skipped: true, reason: 'no-new-post' }))
    return
  }

  const stamp = nowIso().replace(/[:.]/g, '-')
  const prefix = `ig-auto/${stamp}-${post.slug}`

  const slides = buildSlidesForPost(post)
  const svgFiles = slides.map((_, idx) => path.join(workDir, `${post.slug}-s${idx + 1}.svg`))
  const pngFiles = slides.map((_, idx) => path.join(workDir, `${post.slug}-s${idx + 1}.png`))
  const jpgFiles = slides.map((_, idx) => path.join(workDir, `${post.slug}-s${idx + 1}.jpg`))

  for (let i = 0; i < slides.length; i++) fs.writeFileSync(svgFiles[i], slides[i])

  convertSvgsToPng(svgFiles, pngFiles)
  convertPngToJpg(pngFiles, jpgFiles)

  const imageUrls = await uploadToStorage(jpgFiles, prefix)
  const caption = buildCaption(post)

  if (dryRun) {
    console.log(JSON.stringify({ ok: true, dryRun: true, slug: post.slug, imageUrlsCount: imageUrls.length }, null, 2))
    return
  }

  const published = await publishCarousel({ igId: IG_BUSINESS_ID, token, imageUrls, caption })

  appendLedger({
    at: nowIso(),
    slug: post.slug,
    title: post.title,
    category: post.category,
    mediaId: published.mediaId,
    creationId: published.creationId,
    permalink: published.verified?.permalink,
    imageUrls,
  })

  console.log(JSON.stringify({ ok: true, published, slug: post.slug }, null, 2))
}

main().catch((e) => {
  // Recommended policy: skip on error (do not retry aggressively)
  console.error(e)
  process.exit(1)
})
