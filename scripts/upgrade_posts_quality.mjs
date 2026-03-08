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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function ensureText(s) {
  return String(s || '').replace(/\s+/g, ' ').trim()
}

async function fetchText(url) {
  if (!url) return ''
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 15000)
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    })
    clearTimeout(t)
    if (!res.ok) return ''
    const html = await res.text()

    // crude extraction: meta description + first paragraphs
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
    const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]
    const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]

    const p = []
    const re = /<p[^>]*>([\s\S]*?)<\/p>/gi
    let m
    while ((m = re.exec(html)) && p.length < 4) {
      const t2 = ensureText(m[1].replace(/<[^>]+>/g, ' '))
      if (!t2) continue
      if (/cookies|subscribe|sign up|쿠키|개인정보/i.test(t2)) continue
      p.push(t2)
    }

    return [ensureText(ogTitle), ensureText(ogDesc || desc), ...p].filter(Boolean).join('\n')
  } catch {
    return ''
  }
}

function inferSourceName(url) {
  if (/apple\.com\/newsroom/i.test(url)) return 'Apple Newsroom'
  if (/news\.samsung\.com\/kr/i.test(url)) return '삼성전자 뉴스룸'
  if (/news\.samsung\.com\/global/i.test(url)) return 'Samsung Global Newsroom'
  if (/openai\.com\/(index|news)/i.test(url)) return 'OpenAI'
  if (/blog\.google\//i.test(url)) return 'Google Blog'
  if (/blogs\.microsoft\.com/i.test(url)) return 'Microsoft Blog'
  return '출처'
}

function templateForCategory(category) {
  if (TEMPLATE_B_CATEGORIES.has(category)) return 'B'
  if (TEMPLATE_A_CATEGORIES.has(category)) return 'A'
  return 'B'
}

function kSummaryLine(rawTitle, extracted) {
  // use extracted desc if available; otherwise generic
  const lines = extracted.split('\n').map((l) => l.trim()).filter(Boolean)
  const hint = lines.find((l) => l.length > 40) || ''
  if (!hint) return '핵심 변화(성능/가격/일정/정책)를 한국 사용자 관점으로 짧게 정리했습니다.'
  // Keep as Korean framing
  return `원문 기준 핵심은 “${hint.slice(0, 80)}${hint.length > 80 ? '…' : ''}”입니다. 이를 한국 사용자 관점으로 정리했습니다.`
}

function buildSectionsA({ rawTitle, extracted, sourceName, sourceUrl, publishedIso }) {
  const summary = [
    `발표/업데이트: ${rawTitle}`,
    '',
    `한 줄 요약: ${kSummaryLine(rawTitle, extracted)}`,
    '※ 기준: 최근 18개월 내 출시/리프레시를 우선으로 보되, 특가/가격 메리트가 크면 1세대 전도 “가성비 선택지”로 함께 봅니다.',
    '',
    '추천 대상(빠르게 보기)',
    '- 이전 세대 불편이 명확한 사람(배터리/무게/성능/발열)',
    '- 구매 시점이 정해진 사람(학기/입사/출장/프로젝트)',
    '',
    '보류 대상(잠깐 대기)',
    '- 한국 가격/정발 구성/프로모션 확정 전이라면 조건 공개 후 비교',
  ].join('\n')

  const keyPoints = [
    '핵심 포인트(3분 컷)',
    '1) 변화 포인트 — 이번 발표에서 달라진 핵심만 먼저 확인',
    '2) 성능/배터리/화면/무게 — 내 사용패턴 병목이 해결되는지',
    '3) 한국 출시/가격 — 정발/교육가/프로모션 확정 여부',
    '4) 경쟁 제품/이전 세대 — 같은 예산대에서 대체재 비교',
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
    '- 개발/멀티태스킹 → RAM 여유(최소 16GB 이상) 우선',
    '- 영상/디자인 → 화면 품질 + SSD 1TB 고려(지속 성능 리뷰 확인)',
  ].join('\n')

  const sal = [
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

  const korea = [
    '한국 사용자 체크포인트',
    '- 정발 여부 / 출시일 / 사전예약 혜택(학생/카드/쿠폰 포함)',
    '- 국내 최저가 체크 포인트: 쿠팡(반품/로켓), 11번가·네이버(쿠폰/카드), 공홈(학생할인/리퍼), 직구(총비용)',
    '- AS/보증 정책(정발/직구), 수리 기간, 교체 비용',
    '- 충전/허브/외부 모니터 등 주변기기 호환',
    '- 직구 vs 정발: 환율·관부가세·배송·반품 난이도까지 포함한 총비용/보증 차이',
  ].join('\n')

  const accessory = '이 제품과 함께 많이 구매하는 악세사리를 확인해 보세요.'

  const faq = [
    'FAQ(짧게)',
    '지금 사도 되나요?',
    '- 급하면 구매, 여유가 있으면 한국 조건(가격/프로모션) 확정 후가 안전합니다.',
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

  const sources = ['---', `출처: ${sourceName}`, `원문 링크: ${sourceUrl}`, `발행일(원문): ${publishedIso}`].join('\n')

  return [
    { heading: '요약', content: summary },
    { heading: '핵심 포인트', content: keyPoints },
    { heading: '구매 체크리스트', content: checklist },
    { heading: '옵션/모델 추천', content: options },
    { heading: '살까 말까', content: sal },
    { heading: '한국 사용자 체크포인트', content: korea },
    { heading: '관련 악세사리 추천', content: accessory },
    { heading: 'FAQ', content: faq },
    { heading: '결론', content: conclusion },
    { heading: '출처', content: sources },
  ]
}

function buildSectionsB({ rawTitle, extracted, sourceName, sourceUrl, publishedIso }) {
  const summary = [
    `발표/업데이트: ${rawTitle}`,
    '',
    `한 줄 요약: ${kSummaryLine(rawTitle, extracted)}`,
    '',
    '추천 대상(빠르게 보기)',
    '- 해당 서비스/OS/이슈가 내 업무/학습 흐름에 영향을 주는 사람',
    '',
    '보류 대상(잠깐 대기)',
    '- 후속 공지/릴리즈 노트 업데이트를 보고 판단하려는 사람',
  ].join('\n')

  const keyPoints = [
    '핵심 포인트(3분 컷)',
    '1) 변경점 요약 — 실제로 달라진 기능/정책/동작',
    '2) 영향 범위 — 어떤 사용자/환경에서 체감되는가',
    '3) 대응 체크리스트 — 지금 해야 할 설정/업데이트/주의사항',
    '4) 일정 — 적용/전환/은퇴(종료) 일정이 있나',
  ].join('\n')

  const impact = [
    '영향 범위(누가 체감하나)',
    '- 일반 사용자: 기능/톤/UX 변화가 “매일 쓰는 흐름”을 바꾸는지',
    '- 팀/조직: 정책/보안/로그/비용 변화가 운영에 영향 있는지',
    '- 개발자: API/모델명/버전/레거시 은퇴 일정이 있는지',
  ].join('\n')

  const checklist = [
    '대응 체크리스트(체크하고 결론 내리기)',
    '- ☐ 내 계정/기기/팀 워크플로우가 영향 범위에 포함되나?',
    '- ☐ 업데이트/정책 적용 시점(날짜/지역/플랜)이 명확한가?',
    '- ☐ 업무/학습에서 가장 중요한 리스크(중단/보안/품질)는 무엇인가?',
    '- ☐ 대체 방법(이전 버전/대체 도구/우회 설정)이 필요한가?',
    '- ☐ 공식 후속 공지/문서(릴리즈 노트)를 확인했나?',
  ].join('\n')

  const korea = [
    '한국 사용자 체크포인트',
    '- 한국어 품질/현지화/지원 범위가 명확한가',
    '- 한국 결제/환불/사업자 결제/세금계산서 등 운영 이슈',
    '- 국내 정책/규정(기업 보안, 개인정보 등)과 충돌 가능성',
  ].join('\n')

  const faq = [
    'FAQ(짧게)',
    '지금 뭘 먼저 하면 되나요?',
    '- 영향 범위 확인 → 업데이트/설정 적용 → 리스크 점검 순서가 안전합니다.',
    '한국어/한국 사용자 영향이 있나요?',
    '- 현지화/지원 범위가 핵심이라, 공지의 지역/언어 조건을 확인하세요.',
    '후속 업데이트는 어디서 보나요?',
    '- 원문 링크와 공식 릴리즈 노트/공지 채널을 즐겨찾기해두는 게 좋습니다.',
  ].join('\n')

  const conclusion = [
    '결론',
    '이번 업데이트/이슈의 핵심은 “내가 영향받는지”와 “지금 해야 할 대응이 있는지”입니다.',
    '즉각 대응 vs 여유 대응 판단 기준을 먼저 정리하면 판단이 빨라집니다.',
    '댓글로 용도(개인/팀, 사용 제품/플랜)만 남겨주면 영향 범위를 더 구체적으로 짚어줄게요.',
  ].join('\n')

  const sources = ['---', `출처: ${sourceName}`, `원문 링크: ${sourceUrl}`, `발행일(원문): ${publishedIso}`].join('\n')

  return [
    { heading: '요약', content: summary },
    { heading: '핵심 포인트', content: keyPoints },
    { heading: '영향 범위', content: impact },
    { heading: '대응 체크리스트', content: checklist },
    { heading: '한국 사용자 체크포인트', content: korea },
    { heading: 'FAQ', content: faq },
    { heading: '결론', content: conclusion },
    { heading: '출처', content: sources },
  ]
}

function inferDescription(template, rawTitle) {
  const base = ensureText(rawTitle).slice(0, 120)
  return template === 'A' ? `리뷰/체크리스트: ${base}` : `정보 정리/체크리스트: ${base}`
}

async function main() {
  const postIdsEnv = String(process.env.POST_IDS || '').trim()
  const onlyIds = postIdsEnv
    ? postIdsEnv
        .split(',')
        .map((x) => Number.parseInt(x.trim(), 10))
        .filter((n) => Number.isFinite(n))
    : null

  let q = sb
    .from('posts')
    .select('id,slug,title,description,category,source_url,created_at')
    .order('id', { ascending: true })

  if (onlyIds?.length) q = q.in('id', onlyIds)

  const { data: posts, error } = await q

  if (error) throw error

  let updated = 0

  for (const p of posts) {
    const template = templateForCategory(p.category)
    const sourceUrl = p.source_url
    const extracted = await fetchText(sourceUrl)

    // Raw title: prefer og:title; fallback to current title stripped.
    const rawTitle = ensureText(extracted.split('\n')[0]) || ensureText(p.title)

    const sourceName = inferSourceName(sourceUrl)
    const publishedIso = new Date(p.created_at || new Date()).toISOString()

    const sections =
      template === 'A'
        ? buildSectionsA({ rawTitle, extracted, sourceName, sourceUrl, publishedIso })
        : buildSectionsB({ rawTitle, extracted, sourceName, sourceUrl, publishedIso })

    const description = inferDescription(template, rawTitle)

    // Update posts.description (keep title as-is; titles handled by cleanup_titles_seo)
    const { error: upPostErr } = await sb
      .from('posts')
      .update({ description, author: 'ThiveLab 편집부' })
      .eq('id', p.id)
    if (upPostErr) throw upPostErr

    // Replace sections
    const { error: delErr } = await sb.from('post_sections').delete().eq('post_id', p.id)
    if (delErr) throw delErr

    const rows = sections.map((s, idx) => ({ post_id: p.id, position: idx + 1, heading: s.heading, content: s.content }))
    const { error: insErr } = await sb.from('post_sections').insert(rows)
    if (insErr) throw insErr

    updated += 1
    await sleep(500)
  }

  console.log(JSON.stringify({ ok: true, total: posts.length, updated }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
