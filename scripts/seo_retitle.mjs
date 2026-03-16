/**
 * API 키 없이 source_url + 섹션 내용 기반으로 SEO 한국어 제목 생성
 *
 * 실행: node scripts/seo_retitle.mjs [--dry-run]
 */

import dotenv from 'dotenv'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DRY_RUN = process.argv.includes('--dry-run')

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

// ── 유틸 ────────────────────────────────────────────────────────────
function hasHangul(s) { return /[가-힣]/.test(s) }
function isEnglishHeavy(s) {
  if (!s) return false
  const ko = (s.match(/[가-힣]/g) || []).length
  const en = (s.match(/[a-zA-Z]/g) || []).length
  // 한국어 단어(연속 2자 이상)가 2개 이상이면 의도된 혼용 제목 → 유지
  const koWords = (s.match(/[가-힣]{2,}/g) || []).length
  if (koWords >= 2) return false
  // 한국어가 충분히 있으면 (10자 이상) 유지
  if (ko >= 10) return false
  return en > ko * 2 && en > 10
}
function isTruncated(s) { return /\s[a-zA-Z]{1,3}$/.test(s.trim()) }
function isDescPolluted(s) {
  if (!s) return false
  return /^(상세 요약\/체크리스트:|리뷰\/체크리스트:|정보 정리\/체크리스트:)/.test(s) || isEnglishHeavy(s)
}
function needs(post) {
  return isEnglishHeavy(post.title) || isTruncated(post.title) || isDescPolluted(post.description)
}
function clean(s) { return String(s || '').replace(/\s+/g, ' ').trim() }

// ── source URL에서 OG title 가져오기 ────────────────────────────────
async function fetchOgTitle(url) {
  if (!url) return null
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 10000)
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'user-agent': 'Mozilla/5.0', accept: 'text/html' },
    })
    clearTimeout(t)
    if (!res.ok) return null
    const html = await res.text()
    const m1 = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    if (m1?.[1]) return clean(m1[1])
    const m2 = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    return m2?.[1] ? clean(m2[1].split('|')[0].split('-')[0]) : null
  } catch { return null }
}

// ── 제품명/키워드 감지 ────────────────────────────────────────────────
const PRODUCT_RULES = [
  { re: /macbook\s*(neo|air|pro|m\d)/i,  ko: (m) => `MacBook ${m[1]?.toUpperCase() || ''} 정리` },
  { re: /macbook/i,                       ko: () => 'MacBook 신제품 정리' },
  { re: /iphone\s*(\d+\w*)/i,            ko: (m) => `iPhone ${m[1]} 출시 정리` },
  { re: /iphone/i,                        ko: () => 'iPhone 신제품 정리' },
  { re: /ipad\s*(air|pro|mini)?/i,        ko: (m) => `iPad ${m[1] || '신제품'} 정리` },
  { re: /mac\s*mini/i,                    ko: () => 'Mac mini 업데이트 정리' },
  { re: /mac\s*studio/i,                  ko: () => 'Mac Studio 업데이트 정리' },
  { re: /apple\s*watch/i,                 ko: () => 'Apple Watch 신제품 정리' },
  { re: /airpods/i,                       ko: () => 'AirPods 신제품 정리' },
  { re: /studio\s*display/i,              ko: () => 'Studio Display 공개 정리' },
  { re: /xcode\s*([\d.]+)/i,             ko: (m) => `Xcode ${m[1]} 업데이트 정리` },
  { re: /galaxy\s*buds\s*([\w]+)/i,       ko: (m) => `Galaxy Buds${m[1]} 출시 정리` },
  { re: /galaxy\s*book\s*([\w]+)/i,       ko: (m) => `Galaxy Book${m[1]} 출시 정리` },
  { re: /galaxy\s*s\s*([\d]+)/i,          ko: (m) => `Galaxy S${m[1]} 정리` },
  { re: /pixel\s*(\d+\w*)/i,             ko: (m) => `Pixel ${m[1]} 출시 정리` },
  { re: /gpt[\s-]*([\d.]+)/i,            ko: (m) => `GPT-${m[1]} 업데이트 정리` },
  { re: /gemini\s*(embedding\s*\d+)/i,    ko: (m) => `Gemini ${m[1]} 출시 정리` },
  { re: /gemini\s*(\d+[\w.]*)/i,         ko: (m) => `Gemini ${m[1]} 업데이트 정리` },
  { re: /gemini\s+(?:for\s+)?education/i, ko: () => 'Gemini 교육 서비스 정리' },
  { re: /gemini\s+in\s+(?:google\s+)?sheets/i, ko: () => 'Google Sheets Gemini AI 기능 정리' },
  { re: /gemini\s+in\s+(?:google\s+)?docs/i,   ko: () => 'Google Docs Gemini AI 기능 정리' },
  { re: /gemini\s+in\s+([\w\s,]+)/i,     ko: (m) => `Google Workspace Gemini AI 정리` },
  { re: /\bgemini\b/i,                    ko: () => 'Gemini AI 업데이트 정리' },
  { re: /copilot/i,                       ko: () => 'Microsoft Copilot 업데이트 정리' },
  { re: /maia\s*(\d+)/i,                  ko: (m) => `Microsoft Maia ${m[1]} 정리` },
  { re: /lg\s*gram/i,                     ko: () => 'LG gram 2026 출시 정리' },
  { re: /google\s*i\/o/i,                 ko: () => 'Google I/O 2026 일정 정리' },
  { re: /apple\s*tv/i,                    ko: () => 'Apple TV 콘텐츠 업데이트 정리' },
  { re: /speciesnet/i,                    ko: () => 'SpeciesNet AI 공개 정리' },
  { re: /wiz\b/i,                         ko: () => 'Google Wiz 인수 정리' },
  { re: /google\s*play/i,                 ko: () => 'Google Play 업데이트 정리' },
  { re: /chrome/i,                        ko: () => 'Chrome AI 기능 업데이트 정리' },
  { re: /google\s*(maps|맵)/i,            ko: () => 'Google Maps AI 업데이트 정리' },
  { re: /google\s*(earth|지구)/i,         ko: () => 'Google Earth AI 업데이트 정리' },
  { re: /google\s*sheets?/i,              ko: () => 'Google Sheets AI 기능 정리' },
  { re: /google\s*docs?/i,               ko: () => 'Google Docs AI 기능 정리' },
  { re: /google\s*search|ai\s*mode/i,    ko: () => 'Google 검색 AI Mode 정리' },
]

// ── 카테고리·키워드 기반 한국어 제목 생성 ────────────────────────────
const SOURCE_FRAMING = {
  'apple.com/newsroom': (title) => {
    for (const { re, ko } of PRODUCT_RULES) {
      const m = title.match(re)
      if (m) return ko(m)
    }
    return `Apple 공식 발표 정리: ${title.slice(0, 30)}`
  },
  'news.samsung.com': (title) => {
    for (const { re, ko } of PRODUCT_RULES) {
      const m = title.match(re)
      if (m) return ko(m)
    }
    return `삼성 공식 발표 정리: ${title.slice(0, 30)}`
  },
  'openai.com': (title) => {
    for (const { re, ko } of PRODUCT_RULES) {
      const m = title.match(re)
      if (m) return ko(m)
    }
    return `OpenAI 업데이트 정리: ${title.slice(0, 30)}`
  },
  'blog.google': (title) => {
    for (const { re, ko } of PRODUCT_RULES) {
      const m = title.match(re)
      if (m) return ko(m)
    }
    // topic extraction
    const t = title.replace(/^(how|why|what|when|introducing|announcing|new|the)\s+/i, '').trim()
    return `Google 소식 정리: ${t.slice(0, 35)}`
  },
  'blogs.microsoft.com': (title) => {
    for (const { re, ko } of PRODUCT_RULES) {
      const m = title.match(re)
      if (m) return ko(m)
    }
    const t = title.replace(/^(microsoft|introducing|announcing)\s+/i, '').trim()
    return `Microsoft 업데이트 정리: ${t.slice(0, 30)}`
  },
}

function detectSource(url) {
  if (!url) return null
  for (const key of Object.keys(SOURCE_FRAMING)) {
    if (url.includes(key)) return key
  }
  return null
}

function generateKoreanTitle(ogTitle, sourceUrl, category, currentTitle) {
  const fullTitle = clean(ogTitle || currentTitle)
  const sourceKey = detectSource(sourceUrl)

  // 1) 소스별 프레이밍 시도
  if (sourceKey && SOURCE_FRAMING[sourceKey]) {
    const result = SOURCE_FRAMING[sourceKey](fullTitle)
    if (result && hasHangul(result)) return result.slice(0, 70)
  }

  // 2) 제품 규칙 직접 매칭
  for (const { re, ko } of PRODUCT_RULES) {
    const m = fullTitle.match(re)
    if (m) return ko(m).slice(0, 70)
  }

  // 3) 카테고리 기반 폴백
  const CATEGORY_FALLBACK = {
    'laptop':     `노트북 신제품 정리: ${fullTitle.slice(0, 35)}`,
    'smartphone': `스마트폰 소식 정리: ${fullTitle.slice(0, 35)}`,
    'tablet':     `태블릿 신제품 정리: ${fullTitle.slice(0, 35)}`,
    'desktop':    `데스크탑 업데이트 정리: ${fullTitle.slice(0, 30)}`,
    'wearable':   `웨어러블 신제품 정리: ${fullTitle.slice(0, 30)}`,
    'audio':      `오디오 신제품 정리: ${fullTitle.slice(0, 30)}`,
    'software':   `소프트웨어 업데이트 정리: ${fullTitle.slice(0, 28)}`,
    'ai':         `AI 서비스 업데이트 정리: ${fullTitle.slice(0, 28)}`,
    'it-news':    `IT 소식 정리: ${fullTitle.slice(0, 38)}`,
  }
  return (CATEGORY_FALLBACK[category] || `IT 소식 정리: ${fullTitle.slice(0, 38)}`).slice(0, 70)
}

// ── description 생성 ─────────────────────────────────────────────────
function generateDescription(ogTitle, firstSectionContent, category) {
  // 섹션 첫 줄에서 의미있는 문장 추출
  if (firstSectionContent) {
    const lines = firstSectionContent.split('\n').map(l => l.trim()).filter(Boolean)
    const usable = lines.find(l => hasHangul(l) && l.length > 20 && !l.startsWith('-') && !l.startsWith('*') && !l.startsWith('#'))
    if (usable) return usable.slice(0, 120)
  }
  // 폴백: 카테고리 기반
  const desc = {
    'laptop': '새 노트북 발표 핵심 내용과 한국 사용자 관점의 구매 체크포인트를 정리했습니다.',
    'smartphone': '신 스마트폰 발표 내용과 주요 스펙·가격·출시 일정을 정리했습니다.',
    'tablet': '신규 태블릿 발표 핵심 내용과 활용 체크포인트를 정리했습니다.',
    'ai': 'AI 서비스 업데이트의 핵심 변경점과 활용 팁을 정리했습니다.',
    'it-news': '최신 IT 소식의 핵심 내용을 한국 사용자 관점으로 정리했습니다.',
    'software': '소프트웨어 업데이트의 주요 변경점과 대응 방법을 정리했습니다.',
  }
  return desc[category] || '최신 IT 소식을 한국 사용자 관점으로 정리했습니다.'
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── 메인 ─────────────────────────────────────────────────────────────
async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== SEO 제목 재생성 시작 ===\n')

  // 포스트 + 섹션 첫 번째 내용 조회
  const { data: posts } = await sb
    .from('posts')
    .select('id, title, description, category, source_url, tags')
    .order('id', { ascending: true })

  const { data: firstSections } = await sb
    .from('post_sections')
    .select('post_id, content')
    .eq('position', 0)

  const sectionMap = {}
  for (const s of firstSections || []) sectionMap[s.post_id] = s.content

  const targets = (posts || []).filter(needs)
  console.log(`대상: ${targets.length}개 / 전체 ${(posts || []).length}개\n`)

  let success = 0, skip = 0, fail = 0

  for (const post of targets) {
    // source_url에서 OG title 가져오기 (truncation 해결)
    let ogTitle = null
    if (!DRY_RUN && post.source_url) {
      ogTitle = await fetchOgTitle(post.source_url)
      await sleep(300)
    } else if (DRY_RUN) {
      ogTitle = post.title // dry run에서는 현재 제목으로 시뮬레이션
    }

    const newTitle = generateKoreanTitle(ogTitle, post.source_url, post.category, post.title)
    const firstSection = sectionMap[post.id]

    // description: 오염 prefix 제거 후 영어면 교체
    let cleanedDesc = clean(post.description || '')
      .replace(/^(상세 요약\/체크리스트:|리뷰\/체크리스트:|정보 정리\/체크리스트:)\s*/g, '')
      .trim()
    const newDesc = isEnglishHeavy(cleanedDesc)
      ? generateDescription(ogTitle || post.title, firstSection, post.category)
      : cleanedDesc

    const titleChanged = newTitle !== post.title && (isEnglishHeavy(post.title) || isTruncated(post.title))
    const descChanged = newDesc !== post.description

    if (!titleChanged && !descChanged) { skip++; continue }

    console.log(`[${post.id}] ${post.category}`)
    if (titleChanged) {
      console.log(`  제목 전: ${post.title}`)
      console.log(`  제목 후: ${newTitle}`)
    }
    if (descChanged) {
      console.log(`  desc 전: ${post.description?.slice(0, 60)}`)
      console.log(`  desc 후: ${newDesc?.slice(0, 60)}`)
    }
    console.log('')

    if (DRY_RUN) { success++; continue }

    const { error } = await sb
      .from('posts')
      .update({ title: newTitle, description: newDesc })
      .eq('id', post.id)

    if (error) { console.error(`  ❌ 실패: ${error.message}`); fail++ }
    else success++
  }

  console.log(`\n완료: 수정 ${success}개, 변경없음 ${skip}개, 실패 ${fail}개`)
}

main().catch(console.error)
