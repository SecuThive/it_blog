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

const TEMPLATE_A_CATEGORIES = new Set(['laptop', 'smartphone', 'tablet', 'desktop', 'wearable', 'audio'])
const TEMPLATE_B_CATEGORIES = new Set(['software', 'ai', 'it-news'])

const ISSUE_PATTERN =
  /issue|issues|problem|bug|outage|incident|security|vulnerab|breach|recall|warning|lawsuit|policy|terms|pricing|price increase|deprecate|sunset|retire|end of life|eol|패치|버그|오류|장애|보안|취약|유출|리콜|주의|정책|약관|가격|인상|중단|은퇴|종료/i

function ensureText(s) {
  return String(s || '').trim()
}

function stripPressPrefix(t) {
  let head = ensureText(t)
  head = head.replace(/^\[[^\]]+\]\s*/g, '')
  head = head.replace(/^Apple introduces\s+/i, '')
  head = head.replace(/^Apple announces\s+/i, '')
  head = head.replace(/^Apple unveils\s+/i, '')
  head = head.replace(/^Google announces\s+/i, '')
  head = head.replace(/^Microsoft announces\s+/i, '')
  head = head.replace(/^LG\s+Electronics\s+introduces\s+/i, '')
  return head
}

function detectTemplate({ category, rawTitle }) {
  if (TEMPLATE_B_CATEGORIES.has(category)) return 'B'
  if (TEMPLATE_A_CATEGORIES.has(category)) {
    return ISSUE_PATTERN.test(rawTitle || '') ? 'B' : 'A'
  }
  return 'B'
}

function titleForTemplateA(rawTitle) {
  const head = stripPressPrefix(rawTitle).slice(0, 90)
  return `${head} 공개 정리: 핵심 포인트와 추천 체크리스트`
}

function titleForTemplateB(rawTitle) {
  const head = stripPressPrefix(rawTitle).slice(0, 90)
  return `${head} 업데이트/이슈 정리: 핵심 변경점과 대응 체크리스트`
}

function getSectionTextByHeading(sections, heading) {
  const s = sections.find((x) => x.heading === heading)
  return s?.content || ''
}

function guessRawTitle(post) {
  // Best-effort: description usually contains original title after colon
  const desc = ensureText(post.description)
  const m = desc.match(/:\s*(.+)$/)
  if (m?.[1]) return m[1].trim()
  // Never return a URL as rawTitle; prefer title if we can't extract.
  return post.title
}

function buildTemplateASections(rawTitle, existing) {
  const accessory = '이 제품과 함께 많이 구매하는 악세사리를 확인해 보세요.'

  const summary =
    getSectionTextByHeading(existing, '요약') ||
    [
      `발표/업데이트: ${rawTitle}`,
      '',
      '한 줄 요약: 핵심 변화 1~2문장으로 빠르게 정리했습니다.',
      '',
      '추천 대상(빠르게 보기)',
      '- 이전 세대 불편이 명확한 사람',
      '- 구매 시점이 정해진 사람',
      '',
      '보류 대상(잠깐 대기)',
      '- 한국 가격/정발 확정 전인 경우',
    ].join('\n')

  const keyPoints =
    getSectionTextByHeading(existing, '핵심 포인트') ||
    [
      '핵심 포인트(3분 컷)',
      '1) 변화 포인트 — 세대 교체에서 "체감"이 생길 부분',
      '2) 성능/배터리/화면/무게 — 내 병목 해결 여부',
      '3) 한국 출시/가격 — 정발/프로모션/구성 확정 여부',
      '4) 경쟁 제품/이전 세대 — 같은 예산대 대체재 비교',
    ].join('\n')

  const checklist =
    getSectionTextByHeading(existing, '구매 체크리스트') ||
    [
      '구매 체크리스트(체크하고 결론 내리기)',
      '- ☐ 한국 출시일/가격/구성이 확정됐나?',
      '- ☐ AS/보증 조건이 내 기준에 맞나? (정발/직구 포함)',
      '- ☐ 내 사용패턴에서 병목이 뭔지 확실한가? (성능/배터리/발열/소음/휴대성)',
      '- ☐ 옵션 구성(메모리/저장공간/화면/통신)을 과소/과대 선택하지 않았나?',
      '- ☐ 직구 vs 정발 총비용(환율/관부가세/보증)을 계산했나?',
    ].join('\n')

  const options =
    getSectionTextByHeading(existing, '옵션/모델 추천') ||
    getSectionTextByHeading(existing, '옵션/모델 추천 가이드') ||
    [
      '옵션/모델 추천 가이드',
      '- 문서/웹/강의·회의 중심 → 휴대성/배터리/무게 우선',
      '- 개발/멀티태스킹 → RAM 여유(최소 16GB 이상) 우선',
      '- 영상/디자인 → 화면 품질 + SSD 1TB 고려',
    ].join('\n')

  const sal =
    getSectionTextByHeading(existing, '살까 말까') ||
    [
      '**살까 말까(빠른 판단)**',
      '',
      '**추천(사는 쪽)**',
      '- 지금 기기 불편이 명확한 경우',
      '- 일정상 바로 필요해서 기다리기 어려운 경우',
      '',
      '**보류(기다리는 쪽)**',
      '- 한국 가격/정발/프로모션이 아직 불확실한 경우',
      '- 실사용 리뷰(발열/소음/배터리) 확인 후 결정하고 싶은 경우',
    ].join('\n')

  const korea =
    getSectionTextByHeading(existing, '한국 사용자 체크포인트') ||
    [
      '한국 사용자 체크포인트',
      '- 정발 여부 / 출시일 / 사전예약 혜택',
      '- AS/보증 정책, 수리 기간, 교체 비용',
      '- 충전/허브/외부 모니터 등 주변기기 호환',
      '- 직구 vs 정발: 총비용/보증 차이',
    ].join('\n')

  const faq =
    getSectionTextByHeading(existing, 'FAQ') ||
    [
      'FAQ(짧게)',
      '- 지금 사도 되나요? → 급하면 구매, 여유가 있으면 한국 조건/실사용 리뷰 확인 후가 안전합니다.',
      '- 업그레이드 가치가 있나요? → 내 병목(배터리/무게/발열/소음/화면)이 해결되는지가 핵심입니다.',
      '- 옵션은 어떻게 고르나요? → RAM 부족 스트레스면 메모리, 항상 꽉 참이면 저장공간 우선.',
    ].join('\n')

  const conclusion =
    getSectionTextByHeading(existing, '결론') ||
    [
      '결론',
      '이번 신제품 발표의 핵심은 “누구에게 체감이 생기느냐”입니다.',
      '한국 가격/정발 조건이 확정되면 판단이 쉬워지니, 조건 공개 전에는 비교 대기가 안전할 수 있어요.',
      '댓글로 용도(문서/개발/영상/게임 등)만 남겨주면 모델/옵션 선택을 더 구체적으로 추천할게요.',
    ].join('\n')

  const sources = getSectionTextByHeading(existing, '출처') || ''

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

function buildTemplateBSections(rawTitle, existing) {
  const summary =
    getSectionTextByHeading(existing, '요약') ||
    [
      `발표/업데이트: ${rawTitle}`,
      '',
      '한 줄 요약: 무엇이 바뀌었고 누가 영향 받는지 1~2문장으로 정리했습니다.',
      '',
      '추천 대상(빠르게 보기)',
      '- 해당 서비스/OS를 사용 중이며 업무 영향이 예상되는 사람',
      '',
      '보류 대상(잠깐 대기)',
      '- 이번 이슈가 일시적이고 후속 공지까지 기다리려는 사람',
    ].join('\n')

  const keyPoints =
    getSectionTextByHeading(existing, '핵심 포인트') ||
    [
      '핵심 포인트(3분 컷)',
      '1) 변경점 요약 — 실제로 달라진 기능/정책/동작',
      '2) 영향 범위 — 어떤 사용자/환경에서 체감되는가',
      '3) 대응 체크리스트 — 지금 해야 할 설정/업데이트/주의사항',
      '4) 일정 — 적용/전환/은퇴(종료) 일정이 있나',
    ].join('\n')

  const impact =
    getSectionTextByHeading(existing, '영향 범위') ||
    [
      '영향 범위(누가 체감하나)',
      '- 일반 사용자: 기능/톤/UX 변화가 "매일 쓰는 흐름"을 바꾸는지',
      '- 팀/조직: 정책/보안/로그/비용 변화가 운영에 영향 있는지',
      '- 개발자: API/모델명/버전/레거시 은퇴 일정이 있는지',
    ].join('\n')

  const checklist =
    getSectionTextByHeading(existing, '대응 체크리스트') ||
    getSectionTextByHeading(existing, '구매 체크리스트') ||
    [
      '대응 체크리스트(체크하고 결론 내리기)',
      '- ☐ 내 계정/기기/팀 워크플로우가 영향 범위에 포함되나?',
      '- ☐ 업데이트/정책 적용 시점(날짜/지역/플랜)이 명확한가?',
      '- ☐ 업무/학습에서 가장 중요한 리스크(중단/보안/품질)는 무엇인가?',
      '- ☐ 대체 방법(이전 버전/대체 도구/우회 설정)이 필요한가?',
      '- ☐ 공식 후속 공지/문서(릴리즈 노트)를 확인했나?',
    ].join('\n')

  const korea =
    getSectionTextByHeading(existing, '한국 사용자 체크포인트') ||
    [
      '한국 사용자 체크포인트',
      '- 한국어 품질/현지화/지원 범위가 명확한가',
      '- 한국 결제/환불/사업자 결제/세금계산서 등 운영 이슈',
      '- 국내 정책/규정(기업 보안, 개인정보 등)과 충돌 가능성',
    ].join('\n')

  const faq =
    getSectionTextByHeading(existing, 'FAQ') ||
    [
      'FAQ(짧게)',
      '- 지금 뭘 먼저 하면 되나요? → 영향 범위 확인 → 업데이트/설정 적용 → 리스크 점검 순서가 안전합니다.',
      '- 한국어/한국 사용자 영향이 있나요? → 현지화/지원 범위 확인이 핵심입니다.',
      '- 후속 업데이트는 어디서 보나요? → 공식 릴리즈 노트/공지 채널을 확인하세요.',
    ].join('\n')

  const conclusion =
    getSectionTextByHeading(existing, '결론') ||
    [
      '결론',
      '이번 업데이트/이슈의 핵심은 “내가 영향받는지”와 “지금 해야 할 대응이 있는지”입니다.',
      '즉각 대응 vs 여유 대응 판단 기준을 먼저 정리하면 판단이 빨라집니다.',
      '댓글로 용도(개인/팀, 사용 제품/플랜)만 남겨주면 영향 범위를 더 구체적으로 짚어줄게요.',
    ].join('\n')

  const sources = getSectionTextByHeading(existing, '출처') || ''

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

function inferTags(title, category) {
  const t = String(title || '')
  const tags = new Set()
  tags.add(category)

  if (/openai|chatgpt|gpt/i.test(t)) tags.add('openai')
  if (/chatgpt/i.test(t)) tags.add('chatgpt')
  const g = t.match(/gpt[-\s]?\d+(?:\.\d+)?/i)?.[0]
  if (g) tags.add(g.toLowerCase().replace(/\s+/g, ''))

  if (/apple|macbook|iphone|ipad|airpods|xcode|ios|macos|watch/i.test(t)) tags.add('apple')
  if (/samsung|galaxy|buds/i.test(t)) tags.add('samsung')
  if (/lg|gram/i.test(t)) tags.add('lg')

  if (tags.size < 4) tags.add('업데이트')
  if (tags.size < 4) tags.add('신제품')

  return Array.from(tags).slice(0, 6)
}

function estimateReadMinutes(sections) {
  const approxChars = sections.map((s) => `${s.heading}\n${s.content}`).join('\n\n').length
  return Math.max(3, Math.ceil(Math.min(approxChars, 3000) / 300) + 1)
}

async function main() {
  // Fetch all posts (paginate)
  const pageSize = 1000
  let from = 0
  const all = []

  while (true) {
    const { data, error } = await supabase
      .from('posts')
      .select('id,slug,title,description,category,tags,author,source_url,cover_image_url,created_at')
      .range(from, from + pageSize - 1)
      .order('id', { ascending: true })

    if (error) throw error
    if (!data?.length) break
    all.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }

  const results = []

  for (const post of all) {
    const { data: sections, error: secErr } = await supabase
      .from('post_sections')
      .select('heading,content,position')
      .eq('post_id', post.id)
      .order('position', { ascending: true })

    if (secErr) throw secErr

    const rawTitle = guessRawTitle(post)
    const template = detectTemplate({ category: post.category, rawTitle })

    const newTitle = template === 'A' ? titleForTemplateA(rawTitle) : titleForTemplateB(rawTitle)

    const safeRawTitle = String(rawTitle || '').replace(/https?:\/\/\S+/g, '').trim() || rawTitle

    const newDescription =
      template === 'A'
        ? `리뷰/체크리스트: ${safeRawTitle}`
        : `정보 정리/체크리스트: ${safeRawTitle}`

    const newSections =
      template === 'A' ? buildTemplateASections(rawTitle, sections) : buildTemplateBSections(rawTitle, sections)

    // Ensure exact section counts
    if (template === 'A' && newSections.length !== 10) {
      throw new Error(`Template A section count mismatch for post ${post.id}`)
    }
    if (template === 'B' && newSections.length !== 8) {
      throw new Error(`Template B section count mismatch for post ${post.id}`)
    }

    const readMinutes = estimateReadMinutes(newSections)
    const newTags = inferTags(newTitle, post.category)

    // Update post row
    const { error: upErr } = await supabase
      .from('posts')
      .update({
        title: newTitle,
        description: newDescription,
        tags: newTags,
        read_minutes: readMinutes,
        author: 'ThiveLab 편집부',
      })
      .eq('id', post.id)

    if (upErr) throw upErr

    // Replace sections
    const { error: delErr } = await supabase.from('post_sections').delete().eq('post_id', post.id)
    if (delErr) throw delErr

    const rows = newSections.map((s, idx) => ({
      post_id: post.id,
      position: idx + 1,
      heading: s.heading,
      content: s.content,
    }))

    const { error: insErr } = await supabase.from('post_sections').insert(rows)
    if (insErr) throw insErr

    results.push({ id: post.id, slug: post.slug, template, category: post.category })
  }

  console.log(JSON.stringify({ ok: true, updated: results.length, results: results.slice(-20) }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
