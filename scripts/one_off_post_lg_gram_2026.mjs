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

async function fetchOgImage(url) {
  if (!url) return null
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 12000)
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; it_blog_one_off/1.0)',
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

  const { error: delErr } = await supabase.from('post_sections').delete().eq('post_id', postId)
  if (delErr) throw delErr

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

function estimateReadMinutes(text) {
  // Very rough heuristic similar to ingest.mjs
  const approxChars = text.length
  return Math.max(3, Math.ceil(Math.min(approxChars, 3000) / 300) + 1)
}

async function main() {
  const sourceName = 'PR Newswire'
  const sourceUrl =
    'https://www.prnewswire.com/news-releases/lg-electronics-introduces-2026-lg-gram-lineup-elevated-by-aerominum-302651560.html'

  // Pull a publish date from page JSON-LD/meta
  const html = await (await fetch(sourceUrl)).text()
  const dateMatch =
    html.match(/\"datePublished\"\s*:\s*\"([^\"]+)\"/i) ||
    html.match(/property=\"article:published_time\"[^>]+content=\"([^\"]+)\"/i)
  const publishedIso = dateMatch?.[1] || new Date().toISOString()

  const dateOnly = new Date(publishedIso).toISOString().slice(0, 10)

  const slug = `lg-gram-2026-${dateOnly}`
  const title = '2026 LG gram 라인업 정리: 핵심 포인트와 구매 체크리스트'
  const description =
    '상세 요약/체크리스트: LG ELECTRONICS INTRODUCES 2026 LG GRAM LINEUP ELEVATED BY AEROMINUM'

  /** @type {Array<{heading:string,content:string}>} */
  const sections = [
    {
      heading: '요약',
      content: [
        '발표/업데이트: LG ELECTRONICS INTRODUCES 2026 LG GRAM LINEUP ELEVATED BY AEROMINUM',
        '',
        '한 줄 요약: 2026 LG gram은 신규 경량 소재(Aerominum)로 “가볍지만 튼튼한” 방향을 강화했고, 온디바이스+클라우드 기반의 듀얼 AI로 생산성 기능을 전면에 내세웠습니다.',
        '',
        '추천 대상(빠르게 보기)',
        '- 휴대성(무게/내구성) 때문에 노트북을 자주 바꾸는 사람',
        '- Copilot+ PC/온디바이스 AI 등 “업무 자동화” 흐름을 노트북에서 바로 쓰고 싶은 사람',
        '',
        '보류 대상(잠깐 대기)',
        '- 한국 정발/가격/구성이 확정되기 전이라면 조건 공개 후 비교',
      ].join('\n'),
    },
    {
      heading: '핵심 포인트',
      content: [
        '핵심 포인트(3분 컷)',
        '1) Aerominum 소재 도입 — 무게를 줄이면서 스크래치 저항/내구성을 강화(군용 등급 기준 충족 언급)',
        '2) 듀얼 AI(온디바이스 + 클라우드) — 오프라인에서도 동작하는 gram chat On-Device AI + Copilot+ PC 지원을 강조',
        '3) 생태계 연결(gram Link) — Android/iOS/webOS(LG TV/모니터/프로젝터)까지 파일 공유/미러링/전송을 “허브”처럼 지원',
        '4) 분실 대응 보안(ThinQ) — 원격 잠금/데이터 삭제 기능으로 분실 리스크 대응',
        '5) 모델 하이라이트 — 17형 RTX 5050(8GB GDDR7) 탑재 ‘그램 Pro 17’과 16형 OLED ‘그램 Pro 16’ 등으로 성격을 분화',
      ].join('\n'),
    },
    {
      heading: '구매 체크리스트',
      content: [
        '구매 체크리스트(체크하고 결론 내리기)',
        '- ☐ 한국 출시일/가격/구성이 확정됐나?',
        '- ☐ LG 그램 Care/보증(파손 보장 등) 조건이 내 기준에 맞나?',
        '- ☐ 내 사용패턴에서 병목이 뭔지 확실한가? (RAM/SSD/배터리/발열)',
        '- ☐ 16형(OLED) vs 17형(LCD+RTX) 중 “화면/휴대성/성능” 우선순위를 정했나?',
        '- ☐ 직구 vs 정발 총비용(환율/관부가세/보증)을 계산했나?',
      ].join('\n'),
    },
    {
      heading: '살까 말까',
      content: [
        '**살까 말까(빠른 판단)**',
        '',
        '**추천(사는 쪽)**',
        '- 이동이 잦고 “가벼움 + 내구성”을 동시에 챙기고 싶은 경우(Aerominum 포인트가 맞는 사람)',
        '- 온디바이스 AI/생태계 연결(폰·TV·모니터) 활용도가 높은 경우',
        '',
        '**보류(기다리는 쪽)**',
        '- 한국 정발 가격/구성/사전예약 혜택이 아직 불확실한 경우',
        '- 게이밍/3D/렌더링이 메인인데 RTX 5050급 성능이 충분할지 검증이 필요한 경우(실측 리뷰 대기)',
      ].join('\n'),
    },
    {
      heading: '한국 사용자 체크포인트',
      content: [
        '한국 사용자 체크포인트',
        '- 정발 여부 / 출시일 / 사전예약 혜택(그램 Care 포함 여부)',
        '- 국내 AS 정책(파손 보장/픽업/수리 기간)과 교체 비용',
        '- USB-C PD/허브/외부 모니터(해상도·주사율) 호환성',
        '- 직구 vs 정발: 총비용/키보드 배열/보증 차이',
      ].join('\n'),
    },
    {
      heading: '관련 악세사리 추천',
      content: '이 제품과 함께 많이 구매하는 악세사리를 확인해 보세요.',
    },
    {
      heading: 'FAQ',
      content: [
        'FAQ(짧게)',
        '- 지금 사도 되나요? → 한국 정발 가격/구성 확정 전이면 보류가 안전하고, 지금 노트북 교체가 급하면 “구매 이유(무게/배터리/화면/성능)”가 명확할 때만 추천합니다.',
        '- 업그레이드 가치가 있나요? → 이전 세대 대비 체감은 (1) 무게/내구성(Aerominum), (2) AI 기능 활용, (3) 화면(16형 OLED)에서 갈립니다. 내 병목이 어디인지 먼저 확인하세요.',
        '- 16형 vs 17형은 뭘 고르나요? → 휴대성과 선명한 화질/명암이면 16형 OLED 쪽, 큰 화면 + RTX로 그래픽 작업/게임도 염두면 17형 RTX 모델 쪽이 맞습니다.',
        '- RTX 5050은 어떤 포지션인가요? → “최상급 게이밍”보단 콘텐츠 작업/가벼운 게임까지 폭넓게 커버하는 실사용형에 가깝습니다. 실제 성능/발열은 리뷰 확인이 필수입니다.',
      ].join('\n'),
    },
    {
      heading: '결론',
      content: [
        '결론',
        '2026 LG gram은 “초경량”에 그치지 않고 소재(Aerominum)·AI·연결성까지 묶어 휴대 생산성을 강화한 라인업입니다.',
        '한국 가격/정발 조건만 확정되면 구매 판단이 훨씬 쉬워질 타입이라, 조건 공개 전에는 비교 대기가 안전합니다.',
        '댓글로 용도(문서/개발/영상/게임)만 남겨주면 16형/17형과 옵션(RAM/SSD) 선택을 더 구체적으로 추천할게요.',
      ].join('\n'),
    },
    {
      heading: '출처',
      content: [
        '---',
        `출처: ${sourceName}`,
        `원문 링크: ${sourceUrl}`,
        `발행일(원문): ${new Date(publishedIso).toISOString()}`,
      ].join('\n'),
    },
  ]

  const combined = [
    `# ${title}`,
    `\n${description}\n`,
    ...sections.map((s) => `## ${s.heading}\n${s.content}`),
  ].join('\n\n')

  const readMinutes = estimateReadMinutes(combined)
  const coverImageUrl = await fetchOgImage(sourceUrl)

  const tags = ['lg-gram', 'lg', '노트북', 'ces-2026', '듀얼-ai', 'rtx-5050']

  const postId = await upsertPostAndSections({
    slug,
    title,
    description,
    category: 'pc',
    tags,
    author: 'ThiveLab 편집부',
    featured: false,
    readMinutes,
    createdAt: new Date(publishedIso).toISOString(),
    coverImageUrl,
    sourceUrl,
    sections,
  })

  console.log(JSON.stringify({ ok: true, postId, slug }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
