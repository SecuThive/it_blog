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
  const approxChars = text.length
  return Math.max(3, Math.ceil(Math.min(approxChars, 3000) / 300) + 1)
}

async function getPublishedIso(url) {
  const html = await (await fetch(url)).text()
  const m =
    html.match(/\"datePublished\"\s*:\s*\"([^\"]+)\"/i) ||
    html.match(/property=\"article:published_time\"[^>]+content=\"([^\"]+)\"/i)
  if (m?.[1]) return new Date(m[1]).toISOString()
  return new Date().toISOString()
}

async function main() {
  const sourceName = 'OpenAI News'
  const sourceUrl = 'https://openai.com/index/gpt-5-3-instant/'

  const publishedIso = await getPublishedIso(sourceUrl)
  const dateOnly = new Date(publishedIso).toISOString().slice(0, 10)

  const slug = `gpt-5-3-instant-${dateOnly}`
  const title = 'GPT-5.3 Instant 정리: 핵심 포인트와 구매 체크리스트'
  const description = '상세 요약/체크리스트: GPT-5.3 Instant: Smoother, more useful everyday conversations'

  const sections = [
    {
      heading: '요약',
      content: [
        '발표/업데이트: GPT-5.3 Instant: Smoother, more useful everyday conversations',
        '',
        '한 줄 요약: GPT‑5.3 Instant는 대화 톤/흐름을 더 자연스럽게 만들고, 웹 기반 답변 품질을 개선하며, 불필요한 거절·과잉 경고를 줄이는 방향의 업데이트입니다.',
        '',
        '추천 대상(빠르게 보기)',
        '- ChatGPT를 매일 쓰는데 답변이 과하게 조심스럽거나 대화 흐름이 끊긴다고 느끼는 사람',
        '- 웹 검색을 섞어 쓰면서 “링크 나열”이 아니라 맥락 정리 중심 답변을 원하는 사람',
        '',
        '보류 대상(잠깐 대기)',
        '- 한국어 톤이 중요한데 자연스러움이 최우선인 사람(비영어권 톤 개선은 진행 중이라고 명시)',
      ].join('\n'),
    },
    {
      heading: '핵심 포인트',
      content: [
        '핵심 포인트(3분 컷)',
        '1) 불필요한 거절 감소 — 안전하게 답할 수 있는 질문은 더 직접적으로 답변',
        '2) 과도한 훈계/방어적 서문 완화 — “대화 흐름”을 끊는 표현을 줄이는 톤 조정',
        '3) 웹 기반 답변 개선 — 검색 결과를 단순 요약하기보다 지식/추론으로 맥락을 붙여 핵심을 앞에 배치',
        '4) 환각 감소 주장 — 내부 평가에서 환각률 감소 수치를 제시(웹 사용/미사용 모두 감소)',
        '5) 제공 정책 — ChatGPT 전 사용자 제공 + API 모델 ‘gpt-5.3-chat-latest’, GPT‑5.2 Instant는 2026-06-03 은퇴 예정(레거시 제공 기간 안내)',
      ].join('\n'),
    },
    {
      heading: '구매 체크리스트',
      content: [
        '구매 체크리스트(체크하고 결론 내리기)',
        '- ☐ 내 불만이 “거절/톤/웹 답변 품질” 중 어디였는지 명확한가?',
        '- ☐ 최신 뉴스/가격/출시 같은 웹 기반 질문을 자주 하나?',
        '- ☐ 중요한 용도(의학/법/재무)는 여전히 출처 확인·교차검증이 필요하다는 점에 동의하나?',
        '- ☐ API/자동화 워크플로우가 있다면 모델 전환 후 톤/길이/정확도가 유지되는지 테스트했나?',
        '- ☐ 레거시 모델 은퇴 일정(2026-06-03) 전에 전환 계획이 있나?',
      ].join('\n'),
    },
    {
      heading: '살까 말까',
      content: [
        '**살까 말까(빠른 판단)**',
        '',
        '**추천(써보는 쪽)**',
        '- 일상 대화에서 “불필요한 거절/길고 조심스러운 서론” 때문에 생산성이 떨어졌던 경우',
        '- 웹 기반 질문을 자주 하고, 더 압축된 결론/정리형 답변을 원했던 경우',
        '',
        '**보류(조금 더 지켜보는 쪽)**',
        '- 한국어 톤/자연스러움이 최우선이라 업데이트 체감을 직접 확인하고 싶은 경우',
        '- 고위험 의사결정에 바로 의존하려는 경우(안전/검증 프로세스가 우선)',
      ].join('\n'),
    },
    {
      heading: '한국 사용자 체크포인트',
      content: [
        '한국 사용자 체크포인트',
        '- 한국어 톤은 아직 개선 과제로 언급됨 → 본인 작업(메일/보고서/블로그/고객응대) 프롬프트로 샘플 테스트 권장',
        '- 기업/팀 사용 시: 모델 업데이트로 문체가 달라질 수 있어 템플릿/가이드라인 재점검 필요',
        '- API 사용자는 ‘gpt-5.3-chat-latest’ 전환 후 비용/품질/안정성 모니터링 필요',
        '- 레거시 모델 은퇴 일정(2026-06-03) 기준으로 자동화 워크플로우 점검',
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
        '- 지금 써도 되나요? → 일상 Q&A/업무 초안/요약 위주라면 바로 테스트해볼 만합니다. 다만 중요한 결정은 출처 확인이 필요합니다.',
        '- 업그레이드 가치가 있나요? → 기존에 “거절이 잦다/서론이 길다/웹 답변이 산만하다”가 불만이면 가치가 큽니다.',
        '- 한국어도 좋아졌나요? → 개선이 진행 중이라고 언급되어, 본인 작업 예시로 비교 테스트가 가장 확실합니다.',
        '- GPT‑5.2 Instant는 언제까지? → 유료 사용자 기준 레거시로 유지 후 2026-06-03 은퇴 예정이라고 안내됐습니다.',
      ].join('\n'),
    },
    {
      heading: '결론',
      content: [
        '결론',
        'GPT‑5.3 Instant는 “대화가 더 매끈해지는 체감”을 목표로 톤/거절/웹 답변 품질을 다듬은 업데이트입니다.',
        'ChatGPT를 자주 쓰는 한국 사용자라면, 같은 질문을 놓고 답변 흐름이 얼마나 자연스러워졌는지부터 빠르게 테스트해보는 게 좋습니다.',
        '댓글로 용도(문서/개발/영상/게임 등)만 남겨주면 어떤 기능/사용법이 체감될지 더 구체적으로 추천할게요.',
      ].join('\n'),
    },
    {
      heading: '출처',
      content: [
        '---',
        `출처: ${sourceName}`,
        `원문 링크: ${sourceUrl}`,
        `발행일(원문): ${publishedIso}`,
      ].join('\n'),
    },
  ]

  const coverImageUrl = await fetchOgImage(sourceUrl)

  const combined = sections.map((s) => `${s.heading}\n${s.content}`).join('\n\n')
  const readMinutes = estimateReadMinutes(combined)

  const postId = await upsertPostAndSections({
    slug,
    title,
    description,
    category: 'ai',
    tags: ['openai', 'gpt-5.3', 'chatgpt', 'ai', '업데이트', '환각'],
    author: 'ThiveLab 편집부',
    featured: false,
    readMinutes,
    createdAt: publishedIso,
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
