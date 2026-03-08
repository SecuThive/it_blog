#!/usr/bin/env node

/**
 * Create evergreen (search-first) "filler" guides that drive long-term organic traffic.
 *
 * Design goals:
 * - Korean, value-for-money focus (가성비)
 * - Fits POSTING_GUIDE section headings to avoid broken rendering
 * - Idempotent upsert by slug
 */

import dotenv from 'dotenv'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thivelab.com'

if (!SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
if (!SERVICE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function isoDate(d) {
  try {
    return new Date(d).toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function readMinutesForSections(sections) {
  const approxChars = sections.map((s) => `${s.heading}\n${s.content}`).join('\n\n').length
  return Math.max(3, Math.ceil(Math.min(approxChars, 4000) / 300) + 1)
}

function guideSectionsTemplateA({ title }) {
  const summary = [
    `발표/업데이트: ${title}`,
    '',
    '한 줄 요약: 예산이 빡빡해도 “후회 없는 선택”을 하기 위한 가성비 기준(최신 세대/직구 포함/구매 타이밍)을 한국 사용자 관점으로 정리했습니다.',
    '※ 기준: 최근 18개월 내 출시/리프레시를 우선으로 보되, 특가/가격 메리트가 크면 1세대 전도 “가성비 선택지”로 함께 봅니다.',
    '',
    '추천 대상(빠르게 보기)',
    '- 대학생/사회초년: 과제/회의/문서 위주 + 가끔 사진/영상 편집',
    '- “싼 거 샀다가 다시 사는” 비용을 피하고 싶은 사람',
    '',
    '보류 대상(잠깐 대기)',
    '- 당장 구매가 급하지 않고, 2~4주 내 대형 할인(학기/프로모션) 타이밍을 노릴 수 있는 사람',
  ].join('\n')

  const keyPoints = [
    '핵심 포인트(3분 컷)',
    '1) 최소 스펙 컷 — 이 아래로 내려가면 체감이 급격히 나빠짐',
    '2) 돈을 써야 할 곳/아껴도 되는 곳 — RAM/SSD/화면/배터리 우선순위',
    '3) 신형 vs 전세대 — “전세대 특가”가 진짜 가성비가 되는 조건',
    '4) 직구 포함 — 총비용/AS/반품 난이도까지 계산해서 결론',
  ].join('\n')

  const checklist = [
    '구매 체크리스트(체크하고 결론 내리기)',
    '- ☐ 내 사용패턴 1순위는? (문서/강의/개발/영상/게임)',
    '- ☐ 최소 스펙 컷을 넘기나? (RAM/저장공간/화면/무게/배터리)',
    '- ☐ “전세대 특가”라면 할인폭이 충분한가? (신형 대비 체감/가격)',
    '- ☐ 직구라면 총비용(환율/관부가세/배송) + AS/반품 난이도를 감당할 수 있나?',
    '- ☐ 최저가 타이밍(쿠폰/카드/학기/런칭)을 확인했나?',
  ].join('\n')

  const options = [
    '옵션/모델 추천 가이드',
    '- 문서/웹/강의·회의 중심 → 무게/배터리/키보드 감 우선 (RAM 16GB 권장)',
    '- 개발/멀티태스킹(탭/IDE/협업툴) → RAM 16~32GB, CPU는 중간급이면 충분한 경우 많음',
    '- 영상/디자인 → 화면(색/밝기) + SSD 여유(1TB) + 지속 성능(발열) 리뷰 확인',
  ].join('\n')

  const sal = [
    '**살까 말까(빠른 판단)**',
    '',
    '**추천(사는 쪽)**',
    '- “최소 스펙 컷”을 넘기면서 특가가 떠서, 다음 할인까지 기다릴 이유가 약한 경우',
    '- 지금 쓰는 기기에서 병목(느림/배터리/무게)이 명확한 경우',
    '',
    '**보류(기다리는 쪽)**',
    '- 새 학기/프로모션/신형 발표 직후로 2~4주 내 가격 변동이 예상되는 경우',
    '- 직구 조건(AS/반품)이 불안한데 정발 가격도 아직 덜 내려온 경우',
  ].join('\n')

  const korea = [
    '한국 사용자 체크포인트',
    '- 국내 최저가 체크 포인트: 쿠팡(반품/로켓), 11번가·네이버(쿠폰/카드), 공홈(학생할인/리퍼), 직구(총비용)',
    '- AS/보증 정책(정발/직구), 수리 기간, 교체 비용',
    '- 주변기기 호환(충전기/허브/모니터/한글 키보드 배열 등)',
    '- 직구 vs 정발: 환율·관부가세·배송·반품 난이도까지 포함한 총비용/보증 차이',
  ].join('\n')

  const accessory = '가성비로 세팅할 때 함께 사면 좋은 악세사리를 확인해 보세요.'

  const faq = [
    'FAQ(짧게)',
    '가성비 기준에서 최소 RAM/SSD는 어느 정도가 좋아요?',
    '- 요즘 체감 기준으론 RAM 16GB, SSD 512GB를 “후회 방지 최소선”으로 보는 게 안전합니다.',
    '전세대 모델은 언제 사는 게 가장 유리해요?',
    '- 신형 발표 직후 2~8주 사이(재고/프로모션)나 대형 행사 시즌에 할인폭이 커지는 경우가 많습니다.',
    '직구는 무조건 싸기만 한가요?',
    '- 가격이 싸도 환율/관부가세/AS/반품 난이도까지 합치면 정발이 더 나을 때가 있어, 총비용으로 비교하세요.',
  ].join('\n')

  const conclusion = [
    '결론',
    '가성비는 “싼 가격”이 아니라 “내 용도에서 후회가 적은 가격”입니다.',
    '최소 스펙 컷 + 할인 타이밍 + 직구 리스크(총비용/AS)까지 체크하면, 같은 돈으로 만족도가 크게 달라져요.',
    '댓글로 용도(문서/개발/영상/게임)와 예산 범위만 남기면, 지금 시점의 가성비 구성으로 더 구체적으로 추천해줄게요.',
  ].join('\n')

  const sources = ['---', '출처: ThiveLab 편집부', `원문 링크: ${SITE_URL}`, `발행일(원문): ${isoDate(new Date())}`].join('\n')

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

function guideSectionsTemplateB({ title }) {
  const summary = [
    `발표/업데이트: ${title}`,
    '',
    '한 줄 요약: 구독/업데이트/정책 변화가 많은 IT/AI 서비스에서 “돈 아깝지 않게” 고르는 기준(가성비·리스크·대체재)을 정리했습니다.',
    '',
    '추천 대상(빠르게 보기)',
    '- 유료 구독/업그레이드를 고민 중인데, 체감 대비 비용이 애매한 사람',
    '',
    '보류 대상(잠깐 대기)',
    '- 1~2주 내 정책/가격 변경 소문이 있어 확정 공지를 기다리는 사람',
  ].join('\n')

  const keyPoints = [
    '핵심 포인트(3분 컷)',
    '1) 돈이 드는 지점 — 기능/할당량/제한이 “내 작업”에 영향을 주는가',
    '2) 대체재 — 무료/저가 플랜으로도 해결 가능한가',
    '3) 리스크 — 환불/해지/보안/정책 변경 가능성',
    '4) 결론 — 지금 결제/업그레이드/보류 중 무엇이 합리적인가',
  ].join('\n')

  const impact = [
    '영향 범위(누가 체감하나)',
    '- 일반 사용자: 핵심 기능(검색/요약/자동화)이 일상 흐름을 바꾸는지',
    '- 팀/조직: 계정/결제/데이터/보안 정책이 운영에 영향 있는지',
    '- 개발자/창작자: 사용량 제한(쿼터), 품질, 속도, 워크플로우 통합이 중요한지',
  ].join('\n')

  const checklist = [
    '대응 체크리스트(체크하고 결론 내리기)',
    '- ☐ 내 사용패턴을 3가지로 쪼갰나? (정보탐색/문서/코딩·자동화 등)',
    '- ☐ 무료/저가 플랜에서 막히는 “딱 그 부분”이 뭔가?',
    '- ☐ 월 구독료가 내 시간 절약(또는 품질 향상)을 얼마나 만들어주나?',
    '- ☐ 환불/해지 조건과 정책 변경 리스크를 확인했나?',
  ].join('\n')

  const korea = [
    '한국 사용자 체크포인트',
    '- 결제: 카드/간편결제 지원, 환불/세금계산서/법인 결제 가능 여부',
    '- 개인정보/보안: 입력 데이터 학습 여부, 로그 보관, 팀 설정',
    '- 가격: 환율 변동 시 체감 비용이 바뀌는지(연간 결제 vs 월간)',
  ].join('\n')

  const faq = [
    'FAQ(짧게)',
    '가성비로 구독을 고르는 기준이 뭐예요?',
    '- “무료로 안 되는 딱 한 가지”가 월 구독료만큼 가치가 있는지로 판단하면 실패가 줄어요.',
    '연간 결제가 더 이득인가요?',
    '- 오래 쓸 확신이 있을 때만 이득입니다. 불확실하면 월간으로 검증 후 연간으로 전환하세요.',
  ].join('\n')

  const conclusion = [
    '결론',
    '구독/업그레이드는 “최고 성능”보다 “내 작업에서 막히는 지점 해결”이 먼저입니다.',
    '무료/저가로 가능한 부분을 분리하고, 돈이 필요한 지점에만 지출하면 가성비가 크게 좋아져요.',
  ].join('\n')

  const sources = ['---', '출처: ThiveLab 편집부', `원문 링크: ${SITE_URL}`, `발행일(원문): ${isoDate(new Date())}`].join('\n')

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
  const { data: postRow, error: postError } = await sb
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

  const { error: delErr } = await sb.from('post_sections').delete().eq('post_id', postId)
  if (delErr) throw delErr

  const sectionRows = sections.map((s, idx) => ({
    post_id: postId,
    position: idx + 1,
    heading: s.heading,
    content: s.content,
  }))

  const { error: sectionError } = await sb.from('post_sections').insert(sectionRows)
  if (sectionError) throw sectionError

  return postId
}

function makeGuides(dateStr) {
  const date = dateStr || new Date().toISOString().slice(0, 10)

  /**
   * NOTE: Titles are SEO-first. The validator checks only section headings + sources/FAQ formats.
   */
  return [
    {
      category: 'laptop',
      title: `가성비 노트북 고르는 법(최신 기준) ${date}: 최소 스펙 컷과 추천 조합`,
      slug: `value-laptop-guide-${date}`,
      tags: ['가성비', '노트북', '업그레이드', '학생', '직구'],
      template: 'A',
    },
    {
      category: 'smartphone',
      title: `가성비 스마트폰 고르는 법(최신 기준) ${date}: 성능·카메라·배터리 우선순위`,
      slug: `value-phone-guide-${date}`,
      tags: ['가성비', '스마트폰', '카메라', '배터리', '직구'],
      template: 'A',
    },
    {
      category: 'tablet',
      title: `가성비 태블릿 고르는 법(최신 기준) ${date}: 필기·강의·업무용 체크리스트`,
      slug: `value-tablet-guide-${date}`,
      tags: ['가성비', '태블릿', '필기', '학생', '직구'],
      template: 'A',
    },
    {
      category: 'it-news',
      title: `직구 vs 정발 가성비 비교 ${date}: 총비용(환율·관부가세·AS) 계산법`,
      slug: `parallel-import-vs-kr-${date}`,
      tags: ['가성비', '직구', '정발', 'AS', '구매팁'],
      template: 'B',
    },
    {
      category: 'ai',
      title: `AI 구독 가성비 가이드 ${date}: ChatGPT/Claude/Gemini 플랜 고르는 법`,
      slug: `ai-subscription-value-${date}`,
      tags: ['ai', '가성비', '구독', 'chatgpt', '업무'],
      template: 'B',
    },
  ]
}

async function main() {
  const date = process.env.DATE || new Date().toISOString().slice(0, 10)
  const limit = Number.parseInt(process.env.MAX_GUIDES || '5', 10) || 5

  const guides = makeGuides(date).slice(0, limit)

  const createdPostIds = []

  for (const g of guides) {
    const sections = g.template === 'A' ? guideSectionsTemplateA({ title: g.title }) : guideSectionsTemplateB({ title: g.title })
    const readMinutes = readMinutesForSections(sections)

    const postId = await upsertPostAndSections({
      slug: g.slug,
      title: g.title,
      description: `가성비 가이드: ${g.title}`,
      category: g.category,
      tags: g.tags.slice(0, 6),
      author: 'ThiveLab 편집부',
      featured: false,
      readMinutes,
      createdAt: isoDate(new Date()),
      coverImageUrl: null,
      sourceUrl: SITE_URL,
      sections,
    })

    createdPostIds.push(postId)
  }

  console.log(JSON.stringify({ ok: true, created: guides.length, createdPostIds, date }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
