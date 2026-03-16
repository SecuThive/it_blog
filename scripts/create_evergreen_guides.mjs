#!/usr/bin/env node

/**
 * Create evergreen (search-first) guide posts.
 * Each guide has topic-specific, unique content — not shared boilerplate.
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

function isoNow() {
  return new Date().toISOString()
}

function readMinutes(sections) {
  const chars = sections.map((s) => `${s.heading}\n${s.content}`).join('\n\n').length
  return Math.max(5, Math.ceil(chars / 350))
}

// ─────────────────────────────────────────────
// 1. 가성비 노트북 가이드
// ─────────────────────────────────────────────
function sectionsNotebook(date) {
  return [
    {
      heading: '이 가이드를 읽어야 하는 이유',
      content: [
        `발행일 기준(${date}) 최신 노트북 시장을 반영한 가성비 가이드입니다.`,
        '',
        '2025~2026년 노트북 시장은 Intel Core Ultra(Arrow Lake), AMD Ryzen AI 9, Qualcomm Snapdragon X Elite, 그리고 Apple M4 계열이 혼재합니다. 단순 GHz·코어 수 비교가 무의미해진 환경에서 "실사용 체감"과 "한국 구매 환경(가격·AS·직구)"을 기준으로 정리했습니다.',
        '',
        '추천 대상',
        '- 졸업·입학·취업 시즌에 첫 노트북 또는 교체를 고민 중인 분',
        '- "싸게 샀다가 1~2년 뒤 다시 사는" 비용을 피하고 싶은 분',
        '- 직구가 실제로 이득인지 궁금한 분',
      ].join('\n'),
    },
    {
      heading: '2026 최소 스펙 컷 — 이 아래는 사지 마세요',
      content: [
        '아래 기준을 충족하지 못하면 1~2년 내에 체감이 급격히 나빠집니다.',
        '',
        '| 항목 | 최소 기준 | 권장 기준 |',
        '|------|-----------|-----------|',
        '| RAM | 16GB | 16~32GB |',
        '| 저장공간 | 512GB SSD | 1TB SSD |',
        '| 화면 해상도 | FHD(1920×1200 권장) | 2.5K 이상 |',
        '| 화면 밝기 | 300nit | 400nit 이상 |',
        '| 배터리(실사용) | 8시간 | 10시간 이상 |',
        '| 무게(이동형) | 1.6kg 이하 | 1.4kg 이하 |',
        '',
        '⚠️ RAM 8GB 모델: 크롬 탭 10개+메신저+문서 동시 사용 시 이미 버벅입니다. 2026년 기준 RAM 8GB는 추천하지 않습니다.',
      ].join('\n'),
    },
    {
      heading: '예산별 추천 모델 (2026 한국 기준)',
      content: [
        '▶ 60만원 이하 — 가성비 최대, 기본 작업 전용',
        '- 레노버 IdeaPad Slim 5 (Ryzen 5 7530U, RAM 16GB, 512GB): 문서·웹·강의 충분. 무거운 작업은 무리.',
        '- 에이수스 Vivobook 15 (Core i5 13세대, RAM 16GB): 가격 대비 화면 품질 양호.',
        '- 아서 Aspire Go 15: 입문용, 장기 사용은 불안.',
        '',
        '▶ 80~130만원 — 대부분의 직장인·학생에게 최적',
        '- 삼성 갤럭시 북5 (Core Ultra 5 125H, RAM 16GB): 얇고 가볍고 삼성 AS 우수.',
        '- LG 그램 14/16 (Core Ultra 7, RAM 16~32GB): 국내 최장 배터리·AS 우수. 화면은 아쉬움.',
        '- 레노버 ThinkPad E16 Gen 2 (AMD): 키보드 감촉 우수, 직장인 업무용.',
        '',
        '▶ 130만원 이상 — 영상·디자인·개발자',
        '- Apple MacBook Air M4 (16GB, 512GB): 배터리 12~15시간, 에너지 효율 압도적. Apple 생태계 전제.',
        '- LG 그램 Pro 16/17 (Core Ultra 9): 대화면 고해상도, 국내 AS 최고.',
        '- Dell XPS 13 Plus: 디자인·화면 최상위, AS는 국내 제한적.',
      ].join('\n'),
    },
    {
      heading: '용도별 핵심 체크포인트',
      content: [
        '▶ 문서·웹·강의·회의 (대부분의 학생·직장인)',
        '- 무게 1.5kg 이하 + 배터리 10시간+ + RAM 16GB → 이 셋이 기준',
        '- CPU 성능보다 발열 관리(팬 소음)가 회의실에서 더 중요',
        '',
        '▶ 개발·프로그래밍',
        '- RAM 32GB 강력 권장 (가상화·Docker·멀티IDE 동시 사용)',
        '- SSD 1TB, 화면 비율 16:10 이상(코드 가독성)',
        '- macOS 개발 환경 선호 시 MacBook Pro M4 고려',
        '',
        '▶ 영상 편집·디자인',
        '- Apple M4 계열: 전력 효율과 ProRes 가속으로 영상 편집 우위',
        '- Windows: RTX 4060 이상 전용 GPU 탑재 모델 (발열·소음 리뷰 필수)',
        '- 화면: Adobe RGB 90% 이상 또는 DCI-P3 90% 이상 확인',
        '',
        '▶ 게임',
        '- 게이밍 노트북은 동급 성능 데스크탑 대비 40~60% 비쌈',
        '- 이동이 필수가 아니라면 미니 PC(인텔 NUC, Minisforum) + 모니터가 가성비 압도',
        '- 필요하다면 ASUS ROG/TUF, MSI Katana (RTX 4060 기준) 추천',
      ].join('\n'),
    },
    {
      heading: '직구 vs 정발 — 노트북 실질 계산',
      content: [
        '▶ 직구가 유리한 경우',
        '- Apple MacBook: 미국 교육 할인($150 상당) + 관부가세 포함해도 국내가 대비 5~15% 저렴',
        '- 해외 전용 모델(특정 스펙 구성)이 국내 미출시인 경우',
        '',
        '▶ 정발이 유리한 경우',
        '- Samsung·LG·ASUS 국내 출시 모델: AS 기간·비용 차이가 절감액을 상쇄',
        '- 관부가세 계산: 물품가격(USD) × 환율 × 1.08(관세) × 1.1(부가세) — 150달러 이하 면세',
        '',
        '▶ 직구 총비용 예시 (MacBook Air M4 13인치 / 미국 $1,099)',
        '- 환율 1,400원 기준: 약 153만원',
        '- 관부가세: 약 26만원 (물품가 × 0.18)',
        '- 배송료: 약 3~5만원',
        '- 총비용: 약 182~185만원 vs 국내 정가 209만원 → 약 25만원 절감',
        '',
        '💡 Apple 리퍼브(공홈): 신품 대비 10~15% 저렴 + 1년 보증 동일. 직구보다 쉬운 첫 번째 선택지.',
      ].join('\n'),
    },
    {
      heading: '구매 체크리스트 (출력해서 사용)',
      content: [
        '□ RAM이 16GB 이상인가?',
        '□ SSD가 512GB 이상인가? (1TB 권장)',
        '□ 배터리 실사용 리뷰(유튜브/커뮤니티)를 확인했는가?',
        '□ 무게가 이동 패턴에 맞는가? (매일 이동: 1.4kg 이하)',
        '□ 화면 밝기가 300nit 이상인가? (야외/밝은 환경 사용 시 400nit+)',
        '□ 직구 시 관부가세 포함 총비용을 계산했는가?',
        '□ AS 센터 위치와 보증 기간을 확인했는가?',
        '□ 리퍼브/이월상품 옵션을 확인했는가? (공홈 리퍼 = 신품 보증)',
        '□ 카드 무이자 할부/포인트 적립을 활용할 수 있는가?',
        '□ 최저가 타이밍(학기 시작 전, 블프, 연말 재고 정리)을 고려했는가?',
      ].join('\n'),
    },
    {
      heading: 'FAQ — 자주 묻는 질문',
      content: [
        'Q. 맥북과 Windows 노트북 중 뭐가 더 가성비인가요?',
        'A. 3~4년 사용 시 Apple M4 계열은 배터리·성능·잔존가치 면에서 우위입니다. 단, macOS 생태계(아이폰·아이패드 연동)를 쓰지 않는다면 LG 그램이나 Samsung 갤럭시 북이 더 실용적입니다.',
        '',
        'Q. RAM은 나중에 업그레이드할 수 있나요?',
        'A. 2024년 이후 출시된 대부분의 얇은 노트북(Apple 포함)은 RAM이 메인보드에 납땜되어 있습니다. 구매 시 최소 16GB를 선택하세요.',
        '',
        'Q. SSD 교체는 가능한가요?',
        'A. MacBook M 시리즈, Samsung 갤럭시 북 일부는 SSD 교체 불가입니다. Dell XPS, Lenovo ThinkPad 계열은 교체 가능한 경우가 많습니다.',
        '',
        'Q. 리퍼브(리퍼) 제품은 안심하고 살 수 있나요?',
        'A. Apple Refurbished(공홈), Samsung 리뉴드(공홈), LG 리퍼 등 공식 채널은 신품과 동일한 보증을 제공하며 10~20% 저렴합니다. 비공식 중고 리퍼는 보증 여부를 반드시 확인하세요.',
        '',
        'Q. 학생 할인은 어디서 받을 수 있나요?',
        'A. Apple 교육 스토어(재학증명서 필요), Samsung 대학생 혜택(멤버십), Microsoft Surface for Students. 보통 5~15% 추가 할인입니다.',
      ].join('\n'),
    },
    {
      heading: '결론 — 후회 없는 구매를 위한 한 문장',
      content: [
        'RAM 16GB + SSD 512GB(가능하면 1TB)를 최소 기준으로 잡고, 배터리 실사용 리뷰를 유튜브·커뮤니티에서 반드시 확인한 뒤 구매하세요.',
        '',
        '가격이 비슷하다면 AS가 편한 국내 브랜드(LG·Samsung)를, 생산성과 배터리가 최우선이라면 MacBook Air M4를 추천합니다.',
        '',
        '추가 질문이나 용도·예산별 맞춤 추천이 필요하다면 댓글로 남겨주세요.',
      ].join('\n'),
    },
    {
      heading: '출처',
      content: ['---', '출처: ThiveLab 편집부', `참고: ${SITE_URL}`, `최초 발행: ${isoNow().slice(0, 10)}`].join('\n'),
    },
  ]
}

// ─────────────────────────────────────────────
// 2. 가성비 스마트폰 가이드
// ─────────────────────────────────────────────
function sectionsSmartphone(date) {
  return [
    {
      heading: '이 가이드를 읽어야 하는 이유',
      content: [
        `발행일 기준(${date}) 최신 스마트폰 시장을 반영한 가성비 구매 가이드입니다.`,
        '',
        '2026년 스마트폰 시장은 Galaxy S25 시리즈, iPhone 16 시리즈, Pixel 9 시리즈가 플래그십을 차지하고, 갤럭시 A56·Pixel 9a 등 중급기가 성능 격차를 좁히고 있습니다. 통신사 공시지원금·자급제 가격 차이가 30~50만원에 달하는 경우도 있어 "어디서 사느냐"가 실질 가성비를 결정하는 시장입니다.',
        '',
        '추천 대상',
        '- 2년 이상 된 스마트폰을 교체하려는 분',
        '- 카메라·배터리·성능 중 무엇을 우선해야 할지 모르는 분',
        '- 자급제 vs 통신사 구매 중 어느 쪽이 유리한지 궁금한 분',
      ].join('\n'),
    },
    {
      heading: '안드로이드 vs iOS — 선택 기준',
      content: [
        '▶ iOS(iPhone)를 선택해야 하는 경우',
        '- 맥북·아이패드·애플워치 생태계를 이미 사용 중인 경우',
        '- 장기 OS 업데이트 지원 중요시 (iPhone 최소 5년 보장)',
        '- 앱 퀄리티·보안 업데이트 속도를 중시하는 경우',
        '',
        '▶ 안드로이드(Galaxy·Pixel 등)를 선택해야 하는 경우',
        '- 가격 대비 스펙(RAM·저장공간·화면크기)이 중요한 경우',
        '- USB-C 범용 충전, 다양한 악세사리 호환성이 필요한 경우',
        '- 파일 관리, 커스텀 설정, 특정 앱(네이버·카카오 제휴 기능) 활용',
        '',
        '⚠️ 한국 사용자 주의: 통신사 전용 모델은 잠금 해제·해외 로밍 제한이 있을 수 있습니다. 자급제 구매 후 알뜰폰 USIM을 권장합니다.',
      ].join('\n'),
    },
    {
      heading: '예산별 추천 모델 (2026 한국 기준)',
      content: [
        '▶ 40만원 이하 — 가성비 최대',
        '- 삼성 Galaxy A55 5G: 120Hz AMOLED, IP67, 배터리 5,000mAh. 이 가격대 최강자.',
        '- 삼성 Galaxy A35 5G: A55보다 한 단계 아래, 30만원대 입문용.',
        '- Motorola Edge 50 Pro: 국내 유통 한정. 카메라 경쟁력 있음.',
        '',
        '▶ 60~90만원 — 플래그십급 체감',
        '- Google Pixel 9a: 카메라 AI 기능(Pixel Magic Eraser, Best Take) + 7년 업데이트.',
        '- 삼성 Galaxy S24 FE: 갤럭시 AI 기능 + Exynos 2500 성능 + 방수.',
        '- iPhone 15 (이월): 배터리 부족이 약점이나 iOS 생태계·AS 우수.',
        '',
        '▶ 100만원 이상 — 플래그십',
        '- 삼성 Galaxy S25 (256GB): Snapdragon 8 Elite, AI 기능 풀세트, 발열 개선.',
        '- Apple iPhone 16 (256GB): A18 칩, 카메라 컨트롤 버튼, 5년+ 업데이트.',
        '- Google Pixel 9 Pro: 카메라 최강, 순정 안드로이드, 빠른 업데이트.',
      ].join('\n'),
    },
    {
      heading: '카메라·배터리·성능 우선순위 가이드',
      content: [
        '▶ 카메라가 1순위인 경우',
        '1위: Galaxy S25 Ultra (200MP, 10배 광학줌)',
        '2위: iPhone 16 Pro (48MP, 5배줌, 영상 품질)',
        '3위: Google Pixel 9 Pro (AI 보정 강점, 야간 사진)',
        '중가: Galaxy A55 (카메라 성능 이 가격대 최고)',
        '',
        '▶ 배터리가 1순위인 경우',
        '1위: Galaxy S25+ / S25 Ultra (5,000~5,900mAh + 고속 충전)',
        '2위: Galaxy A55 (5,000mAh, 25W 충전)',
        '⚠️ iPhone은 용량 자체는 작지만 효율이 높아 실사용 시간은 준수',
        '',
        '▶ 게임·성능이 1순위인 경우',
        '- Snapdragon 8 Elite 탑재: Galaxy S25 시리즈, ASUS ROG Phone 8',
        '- A18 Pro 탑재: iPhone 16 Pro / Pro Max (GPU 성능 업계 최고)',
        '- 발열 관리: iPhone > Pixel > Galaxy (장시간 게임 기준)',
      ].join('\n'),
    },
    {
      heading: '통신사 vs 자급제 — 실질 비용 비교',
      content: [
        '▶ 통신사 구매가 유리한 경우',
        '- 공시지원금이 20만원 이상 책정된 신규 요금제 개통 시',
        '- 기기변경 + 24~36개월 할부 + 통신비 절감 프로모션 조합',
        '',
        '▶ 자급제가 유리한 경우',
        '- 이미 약정이 없거나 알뜰폰(MVNO) 사용 중',
        '- 해외 출장·여행이 잦아 USIM 교체가 필요한 경우',
        '- 통신사 블로트웨어(사전 설치 앱)가 싫은 경우',
        '',
        '▶ 실질 비용 계산 예시 (Galaxy S25 256GB, 출고가 133만원)',
        '- 통신사(공시 20만원): 113만원 + 24개월 프리미엄 요금제 vs',
        '- 자급제: 133만원 + 알뜰폰 월 1~2만원 요금제',
        '- 24개월 기준 통신비 차액이 30만원+ 이면 자급제 유리',
        '',
        '💡 네이버페이·카카오페이 포인트 환급 행사 때 자급제 구매 시 5~10% 추가 할인 가능.',
      ].join('\n'),
    },
    {
      heading: '구매 체크리스트',
      content: [
        '□ OS 생태계(iOS vs 안드로이드)를 결정했는가?',
        '□ 카메라·배터리·성능 중 1순위를 정했는가?',
        '□ 통신사 공시지원금 vs 자급제 총비용을 비교했는가?',
        '□ 방수 등급(IP67/IP68)이 필요한가?',
        '□ 저장용량: 256GB 이상 권장 (사진·영상 많이 찍는 경우 512GB)',
        '□ OS 업데이트 지원 기간을 확인했는가? (최소 3년 이상)',
        '□ AS 센터(삼성·애플 케어+·구글) 접근성을 확인했는가?',
        '□ 이전 기기 데이터 이전 방법을 확인했는가?',
      ].join('\n'),
    },
    {
      heading: 'FAQ — 자주 묻는 질문',
      content: [
        'Q. 플래그십 대신 중급기를 사도 되나요?',
        'A. 일상 사용(SNS·동영상·카메라·메신저)이라면 Galaxy A55, Pixel 9a 수준으로도 충분합니다. 플래그십이 필요한 경우는 고배율 망원 카메라, 장시간 게임, 최신 AI 기능 풀사용 정도입니다.',
        '',
        'Q. 배터리 교체 비용은 얼마인가요?',
        'A. 삼성 공식 센터: 8~12만원. 애플 공식 서비스: 12~17만원. AppleCare+가 있으면 일부 무상. 3년 이상 사용 시 배터리 교체 vs 신기기 구매를 비교해볼 시점입니다.',
        '',
        'Q. 폴더블 폰은 가성비가 있나요?',
        'A. Galaxy Z Fold6/Flip6는 내구성 리뷰가 많이 개선됐지만, 동급 성능 일반 폰 대비 40~60% 비쌉니다. "폼팩터 자체가 필요한 경우"가 아니면 가성비는 낮습니다.',
        '',
        'Q. 구형 플래그십 vs 신형 중급기 중 어느 게 나을까요?',
        'A. 2년 이내 구형 플래그십(Galaxy S23 시리즈, iPhone 14 등)은 신형 중급기보다 카메라·성능이 우위인 경우가 많습니다. 단, OS 업데이트 잔여 기간을 반드시 확인하세요.',
      ].join('\n'),
    },
    {
      heading: '결론',
      content: [
        '예산 40~60만원대라면 Galaxy A55·Pixel 9a가 가성비 정점입니다. 100만원 이상이라면 Galaxy S25(삼성 생태계)·iPhone 16(Apple 생태계)·Pixel 9 Pro(카메라+순정 안드로이드) 중 생태계·용도에 맞게 선택하세요.',
        '',
        '자급제 + 알뜰폰 조합이 24개월 기준 총비용에서 유리한 경우가 많습니다. 공시지원금 조건을 꼭 비교해보세요.',
        '',
        '추가 질문이나 용도별 맞춤 추천은 댓글로 남겨주세요.',
      ].join('\n'),
    },
    {
      heading: '출처',
      content: ['---', '출처: ThiveLab 편집부', `참고: ${SITE_URL}`, `최초 발행: ${isoNow().slice(0, 10)}`].join('\n'),
    },
  ]
}

// ─────────────────────────────────────────────
// 3. 가성비 태블릿 가이드
// ─────────────────────────────────────────────
function sectionsTablet(date) {
  return [
    {
      heading: '이 가이드를 읽어야 하는 이유',
      content: [
        `발행일 기준(${date}) 2026년 태블릿 시장을 반영한 가성비 구매 가이드입니다.`,
        '',
        '태블릿은 "필기·학습·강의", "콘텐츠 소비(유튜브·넷플릭스)", "업무 생산성(문서·발표·영상 편집)" 세 가지 용도가 명확히 갈리는 제품군입니다. 용도를 먼저 정하지 않으면 비싸게 사고도 후회하는 경우가 많습니다.',
        '',
        '추천 대상',
        '- 노트북 대신 태블릿을 업무·학업에 쓸 수 있는지 고민하는 분',
        '- iPad vs Galaxy Tab 중 어느 것이 나에게 맞는지 모르겠는 분',
        '- 악세사리(펜·키보드) 포함 총비용을 따져보고 싶은 분',
      ].join('\n'),
    },
    {
      heading: 'iPad vs Galaxy Tab — 용도별 선택 기준',
      content: [
        '▶ iPad가 더 유리한 경우',
        '- 필기(노트 앱): Apple Pencil + GoodNotes/Notability 조합이 안드로이드 대비 우위',
        '- 창작(드로잉·음악): Procreate, Logic Pro, Final Cut Pro 등 iPad 전용 앱',
        '- 아이폰·맥북 생태계 통합(핸드오프, 에어드롭, 사이드카)',
        '- 장기 OS 업데이트(iPadOS 최소 5~6년)',
        '',
        '▶ Galaxy Tab이 더 유리한 경우',
        '- 안드로이드 앱 호환성이 필요한 경우 (네이버·카카오 서비스, 특정 기업 앱)',
        '- S Pen 기본 포함 모델(Tab S10 FE, Tab S10+): 추가 비용 없이 펜 제공',
        '- 삼성 덱스(DeX): 외부 모니터 연결 시 데스크탑 모드',
        '- 가격 대비 화면 크기(Galaxy Tab A9+ 11인치 30만원대)',
      ].join('\n'),
    },
    {
      heading: '용도별 추천 모델 (2026 기준)',
      content: [
        '▶ 필기·학업 전용',
        '- iPad Air M2 11인치 + Apple Pencil Pro: 필기 체험 최상, OS 업데이트 장기 보장',
        '- Galaxy Tab S10 FE + S Pen: 저렴하게 필기 기능, 단 성능은 중급',
        '- 예산 50만원 이하: Galaxy Tab S9 FE (이월) 또는 iPad 10세대(이월) + 1세대 펜슬',
        '',
        '▶ 유튜브·넷플릭스·독서·게임',
        '- iPad mini 7: 8.3인치 휴대성 + Liquid Retina + Apple Pencil 2세대 지원',
        '- Galaxy Tab A9+: 11인치 대화면 + 30만원대. 영상·독서·캐주얼 게임 적합',
        '- Amazon Fire HD 10: 콘텐츠 소비만 목적이라면 최저 가성비',
        '',
        '▶ 업무 생산성·영상 편집',
        '- iPad Pro M4 11인치 + Magic Keyboard: 노트북 대체 가능 수준의 성능',
        '- Galaxy Tab S10+ + Book Cover Keyboard: 대화면 + DeX + S Pen 조합',
        '⚠️ 태블릿으로 노트북을 완전 대체하려면 키보드 커버 필수. 총비용이 중급 노트북과 비슷해짐',
      ].join('\n'),
    },
    {
      heading: '악세사리 포함 총비용 계산',
      content: [
        '태블릿은 본체 가격만 보면 안 됩니다. 펜·키보드·보호케이스까지 더해야 실질 비용입니다.',
        '',
        '▶ iPad Air M2 11인치 풀세트 예시',
        '- 본체: 약 90만원 (256GB)',
        '- Apple Pencil Pro: 약 18만원',
        '- Magic Keyboard for iPad Air: 약 39만원',
        '- 보호 케이스: 2~5만원',
        '- 총합: 약 150~155만원 → 중급 노트북 가격',
        '',
        '▶ Galaxy Tab S10 FE + 키보드 커버 예시',
        '- 본체(S Pen 포함): 약 65만원',
        '- 키보드 커버: 약 10~15만원 (서드파티)',
        '- 보호 케이스: 2~3만원',
        '- 총합: 약 80만원',
        '',
        '💡 필기만 할 거라면 iPad Air + Apple Pencil(키보드 제외)가 필기 경험 대비 최고 가성비입니다.',
      ].join('\n'),
    },
    {
      heading: '구매 체크리스트',
      content: [
        '□ 주요 용도를 1개로 정했는가? (필기/콘텐츠/업무)',
        '□ 펜슬이 필요한가? (기본 포함 여부 확인)',
        '□ 키보드 커버가 필요한가? (노트북 대체 목적이면 필수)',
        '□ 악세사리 포함 총비용을 중급 노트북과 비교했는가?',
        '□ 저장용량: 256GB 이상 권장 (클라우드 의존도 확인)',
        '□ Wi-Fi 모델 vs LTE 모델: 이동 중 데이터 사용 여부',
        '□ OS 업데이트 지원 기간 확인 (iPad: 최소 5년)',
        '□ Apple Pencil 세대 호환성 확인 (1세대/2세대/Pro 모두 다름)',
      ].join('\n'),
    },
    {
      heading: 'FAQ — 자주 묻는 질문',
      content: [
        'Q. 태블릿으로 노트북을 완전히 대체할 수 있나요?',
        'A. iPad Pro M4 + Magic Keyboard 조합은 문서·발표·영상 편집 수준에서는 가능하지만, 총비용이 150만원 이상입니다. 개발·코딩·복잡한 파일 관리는 여전히 노트북이 유리합니다.',
        '',
        'Q. 중고 iPad를 사도 괜찮을까요?',
        'A. iPad는 중고 가격 하락이 적고, 배터리 상태와 Apple Pencil 지원 세대를 꼭 확인해야 합니다. 직거래보다는 당근마켓 안전결제, 중고나라 에스크로 이용을 권장합니다.',
        '',
        'Q. 어린이용 태블릿은 뭐가 좋나요?',
        'A. Amazon Fire Kids(어린이 보호 케이스 포함·2년 보증) 또는 iPad 10세대(화면 품질 우수, 내구성 좋음). Galaxy Tab A 시리즈도 Kids Mode 지원.',
        '',
        'Q. 태블릿 게임(원신·발로란트 등)은 iPad Pro가 필요한가요?',
        'A. iPad Air M2도 대부분의 모바일 게임에서 최고 설정 가능합니다. Pro급은 게임 외 영상 편집·음악 제작을 함께 할 경우에 투자 가치가 있습니다.',
      ].join('\n'),
    },
    {
      heading: '결론',
      content: [
        '필기가 목적이면 iPad Air M2 + Apple Pencil Pro, 예산이 빡빡하면 Galaxy Tab S10 FE + S Pen이 가장 현실적인 선택입니다.',
        '',
        '콘텐츠 소비가 주목적이라면 iPad mini 7이나 Galaxy Tab A9+로도 충분합니다.',
        '',
        '노트북 대체를 원한다면 악세사리 포함 총비용을 중급 노트북과 반드시 비교하세요. 생각보다 노트북이 더 실용적일 수 있습니다.',
      ].join('\n'),
    },
    {
      heading: '출처',
      content: ['---', '출처: ThiveLab 편집부', `참고: ${SITE_URL}`, `최초 발행: ${isoNow().slice(0, 10)}`].join('\n'),
    },
  ]
}

// ─────────────────────────────────────────────
// 4. 직구 vs 정발 가이드
// ─────────────────────────────────────────────
function sectionsParallelImport(date) {
  return [
    {
      heading: '이 가이드를 읽어야 하는 이유',
      content: [
        `발행일 기준(${date}) 직구 vs 정발 총비용 비교 가이드입니다.`,
        '',
        '직구는 "무조건 싸다"는 인식이 있지만, 관부가세·배송비·환율·AS 비용·반품 불편함을 모두 합산하면 정발보다 비쌀 수 있습니다. 반대로 제대로 계산하면 20~30% 절감도 가능합니다. 이 가이드에서 실제 계산법과 직구가 유리한 경우를 정리합니다.',
        '',
        '추천 대상',
        '- IT 기기를 처음 직구하려는 분',
        '- 관세·배대지 계산이 복잡하게 느껴지는 분',
        '- 어떤 제품은 직구하고 어떤 제품은 국내 구매해야 하는지 기준이 필요한 분',
      ].join('\n'),
    },
    {
      heading: '관부가세 계산법 — 핵심 공식',
      content: [
        '관세 면제 기준: 미국발 배송 $200 이하 (목록 통관), 기타 국가 $150 이하',
        '초과 시 관세 + 부가세 부과',
        '',
        '▶ 실제 계산 공식',
        '과세 기준가 = (물품가격 + 해외 배송비) × 환율',
        '관세 = 과세 기준가 × 관세율 (일반 전자제품 8~13%)',
        '부가세 = (과세 기준가 + 관세) × 10%',
        '총 납부액 = 관세 + 부가세',
        '',
        '▶ 실제 예시 (MacBook Air M4 미국 $1,099, 환율 1,400원, 배송비 $30)',
        '과세 기준가: $1,129 × 1,400 = 1,580,600원',
        '관세: 1,580,600 × 0.08 = 126,448원 (노트북 8%)',
        '부가세: (1,580,600 + 126,448) × 0.10 = 170,705원',
        '관부가세 합계: 약 297,153원',
        '총비용: 1,580,600 + 297,153 + 배대지(약 30,000) = 약 1,907,753원',
        '국내 정가: 2,090,000원 → 약 18만원 절감',
        '',
        '💡 관세청 UNI-PASS(unipass.customs.go.kr)에서 관세율 조회 및 사전 계산 가능.',
      ].join('\n'),
    },
    {
      heading: '배대지(배송대행지) 선택 기준',
      content: [
        '배대지는 해외 쇼핑몰에서 구매한 물건을 국내로 대신 배송해주는 서비스입니다.',
        '',
        '▶ 주요 배대지 비교',
        '- 아이포터(iporter): 미국·영국·독일·일본. 합산통관 지원. 안정적.',
        '- 몰테일(Malltail): 미국·영국·독일·일본·중국. 리뷰 많음.',
        '- 오마이집(Ohmy.zip): 미국 중심. 가격 경쟁력.',
        '- 직구장터: 소량·테스트 시 유용.',
        '',
        '▶ 배대지 선택 시 체크사항',
        '- 목적지 국가별 창고 운영 여부',
        '- 배송 속도 (일반 vs 특송 옵션)',
        '- 무게·부피 기준 과금 방식 (무게 vs 부피 중 큰 것 적용)',
        '- 합산통관 지원 여부 (여러 주문 한 번에 통관)',
        '- 분실·파손 시 배상 정책',
      ].join('\n'),
    },
    {
      heading: '직구가 유리한 제품 vs 정발이 유리한 제품',
      content: [
        '▶ 직구가 확실히 유리한 경우',
        '- Apple 제품: 국내 정가가 미국 대비 10~20% 비쌈. 교육 할인($150) 추가 시 더 유리.',
        '- 국내 미출시 스펙 (특정 RAM·저장용량 구성)',
        '- 해외 한정 색상·모델 (Apple Product Red 등)',
        '- 아마존 블랙프라이데이·사이버먼데이: 20~30% 추가 할인',
        '',
        '▶ 정발이 유리하거나 비슷한 경우',
        '- Samsung·LG 노트북: 국내 프로모션이 활발하고 AS가 월등히 편함',
        '- 삼성·LG TV: 정발 가격이 경쟁적이고 AS 비용이 크기 때문에 정발 권장',
        '- 소모품·악세사리: 관세 비율이 높고 반품이 복잡',
        '- 리콜 가능성이 있는 배터리 제품: 해외 리콜 시 국내 처리 어려움',
        '',
        '▶ 중립 (조건에 따라 다름)',
        '- iPad: Apple 교육 할인 적용 시 직구 유리. 일반 구매 시 정발과 비슷.',
        '- 헤드폰·이어폰: 워런티 글로벌 적용 여부 확인 필요',
      ].join('\n'),
    },
    {
      heading: '직구 사이트 가이드',
      content: [
        '▶ 미국 직구',
        '- Amazon.com: 가장 방대한 상품. 일부 제품 한국 배송 직접 지원.',
        '- Apple.com/shop: 교육 할인, 리퍼 제품 구매 가능.',
        '- B&H Photo: 카메라·노트북 전문. 세금 면제 배송 가능한 경우 있음.',
        '- Best Buy: 미국 현지 가격으로 구매 가능. 한국 배송 불가 → 배대지 필요.',
        '',
        '▶ 일본 직구',
        '- Amazon.co.jp: 엔화 약세 시 유리. 카드 결제 가능.',
        '- 요도바시(Yodobashi), 빅카메라: 전자제품 특화. 면세(税込) 확인 필요.',
        '',
        '▶ 유럽 직구',
        '- Amazon.de / Amazon.co.uk: 관세 복잡, 부가세(VAT) 처리 주의.',
        '- 유로화/파운드 환율 유리할 때만 고려.',
        '',
        '⚠️ 알리익스프레스·테무: IT 기기는 정품 여부, AS 불가, 개인정보 보안 리스크 주의.',
      ].join('\n'),
    },
    {
      heading: '구매 체크리스트',
      content: [
        '□ 관부가세 포함 총비용을 계산했는가? (공식: 물품가 × 환율 × 1.18 + 배송비)',
        '□ 국내 정가와 최저가를 네이버 쇼핑에서 먼저 확인했는가?',
        '□ 배대지 선택 및 배송비 견적을 받았는가?',
        '□ 제품 워런티가 글로벌 적용인지 확인했는가?',
        '□ 반품 정책을 확인했는가? (불량 시 국내 반품 vs 해외 반송 비용)',
        '□ 관세 면제 한도를 넘지 않는지 확인했는가?',
        '□ 블랙프라이데이·프라임데이 등 할인 시즌을 고려했는가?',
        '□ 한국어 A/S 가능한지 확인했는가?',
      ].join('\n'),
    },
    {
      heading: 'FAQ — 자주 묻는 질문',
      content: [
        'Q. 직구하다가 관세 폭탄 맞으면 어떻게 하나요?',
        'A. 예상치 못한 관세가 나오면 세관에 이의신청이 가능합니다. 또는 반품(수입 포기)도 가능하지만, 배대지 반품 비용이 발생합니다. 사전에 계산기로 관부가세를 확인하세요.',
        '',
        'Q. 애플 제품은 국내 A/S가 되나요?',
        'A. Apple은 전 세계 워런티가 적용되므로 해외 구매 제품도 국내 Apple Store/공인 서비스센터에서 수리 가능합니다.',
        '',
        'Q. 블랙프라이데이 직구가 정말 싼가요?',
        'A. Apple, Dell 등은 블프 할인폭이 작습니다(5~10%). ASUS, MSI, 스피커·헤드폰 등이 20~30% 큰 편입니다. 연중 최저가는 아닐 수 있으니 Camelcamelcamel(아마존 가격 추적) 확인을 권장합니다.',
        '',
        'Q. 중국 직구(알리, 테무)로 IT 기기를 사도 되나요?',
        'A. 소액 악세사리(케이블, 마우스)는 괜찮지만, 스마트폰·태블릿·노트북은 정품 여부·보안(개인정보 유출)·AS 불가 리스크가 크기 때문에 비추천합니다.',
      ].join('\n'),
    },
    {
      heading: '결론',
      content: [
        '직구는 "무조건 싸다"가 아닌 "계산해보면 이득인 경우"입니다.',
        '',
        'Apple 제품은 교육 할인 + 관부가세 계산 후 직구가 유리한 경우가 많고, Samsung·LG 등 국내 브랜드는 정발 AS와 프로모션이 직구 절감액을 상쇄합니다.',
        '',
        '처음 직구한다면 관부가세 계산기를 먼저 써보고, 비용이 15% 이상 차이날 때만 도전하는 것이 현실적입니다.',
      ].join('\n'),
    },
    {
      heading: '출처',
      content: ['---', '출처: ThiveLab 편집부', `참고: ${SITE_URL}`, `최초 발행: ${isoNow().slice(0, 10)}`].join('\n'),
    },
  ]
}

// ─────────────────────────────────────────────
// 5. AI 구독 가성비 가이드
// ─────────────────────────────────────────────
function sectionsAISubscription(date) {
  return [
    {
      heading: '이 가이드를 읽어야 하는 이유',
      content: [
        `발행일 기준(${date}) ChatGPT Plus·Claude Pro·Gemini Advanced 구독 비교 가이드입니다.`,
        '',
        '2026년 현재 주요 AI 구독 서비스는 월 $20(약 2만 8천원) 수준으로 가격이 수렴했습니다. 그런데 실제로 어떤 서비스가 "내 업무와 생활"에 맞는지는 기능·사용량 제한·한국어 품질·연동 앱에 따라 크게 달라집니다.',
        '',
        '추천 대상',
        '- ChatGPT·Claude·Gemini 중 하나라도 써보고 유료 구독을 고민하는 분',
        '- 여러 AI를 중복 구독 중인데 정리하고 싶은 분',
        '- 업무·학습·코딩·창작 중 어떤 AI가 맞는지 기준이 없는 분',
      ].join('\n'),
    },
    {
      heading: '2026 주요 AI 서비스 플랜 비교',
      content: [
        '| 서비스 | 무료 플랜 | 유료 플랜 | 월 가격 |',
        '|--------|-----------|-----------|---------|',
        '| ChatGPT | GPT-4o mini (제한적) | ChatGPT Plus (GPT-4o 무제한+) | $20/월 |',
        '| Claude | Claude 3.5 Haiku (제한) | Claude Pro (Claude 3.7 Sonnet 확장) | $20/월 |',
        '| Gemini | Gemini 1.5 Flash | Gemini Advanced (1.5 Pro Ultra + Google 앱 연동) | $21.99/월 (Google One AI Premium) |',
        '| Perplexity | 제한적 검색 | Perplexity Pro (Claude + GPT + Sonar 접근) | $20/월 |',
        '',
        '※ 가격은 변동될 수 있으며 연간 결제 시 10~20% 할인.',
      ].join('\n'),
    },
    {
      heading: '용도별 AI 추천',
      content: [
        '▶ 글쓰기·문서·보고서 작성',
        '1위: Claude Pro — 긴 컨텍스트(200K 토큰), 문체 품질, 지시 이해도 우수',
        '2위: ChatGPT Plus — 다양한 플러그인, 마이 GPT(커스텀 GPT)',
        '',
        '▶ 코딩·개발',
        '1위: ChatGPT Plus (o1/o3 사용 가능) — 복잡한 알고리즘, 수학 추론',
        '공동 1위: Claude Pro — 코드 수정·리팩터링, 설명 품질 우수',
        '참고: GitHub Copilot($10/월)과 병행 사용하는 개발자 많음',
        '',
        '▶ 정보 검색·리서치',
        '1위: Perplexity Pro — 실시간 웹 검색 기반, 출처 명시',
        '2위: ChatGPT Plus — SearchGPT(웹 검색 통합)',
        '무료 대안: Perplexity 무료 플랜도 기본 검색은 충분',
        '',
        '▶ 구글 Workspace 사용자 (Gmail·Docs·Sheets)',
        '1위: Gemini Advanced — Gmail 요약, Docs 초안, Sheets 분석 내장',
        '구글 Workspace 유료 사용자라면 가장 자연스러운 연동',
        '',
        '▶ 이미지 생성',
        '- ChatGPT Plus: DALL-E 3 포함',
        '- Adobe Firefly: Photoshop 통합, 상업적 이용 안전',
        '- Midjourney ($10/월): 품질 최고, 디자이너·창작자 선호',
      ].join('\n'),
    },
    {
      heading: '무료 플랜으로 해결 가능한 작업',
      content: [
        '유료 구독 전에 무료로 먼저 테스트해보세요.',
        '',
        '▶ 무료로 충분한 경우',
        '- 단순 질의응답·요약: ChatGPT 무료(GPT-4o mini), Claude 무료(Haiku)',
        '- 웹 검색 기반 리서치: Perplexity 무료 플랜',
        '- 영어 문법 교정: ChatGPT 무료, Grammarly 무료',
        '- 이미지 생성(저품질 OK): Bing Image Creator(DALL-E 3 기반, 무료)',
        '',
        '▶ 유료가 필요한 경우',
        '- 하루 20회 이상 집중적으로 사용하는 경우',
        '- 10,000자 이상의 긴 문서 처리',
        '- 최신 GPT-4o/Claude 3.7 모델이 체감되는 품질 차이가 나는 작업',
        '- API 연동 또는 커스텀 GPT 활용',
      ].join('\n'),
    },
    {
      heading: '구독 가성비 계산법',
      content: [
        '월 $20 지출이 가치 있는지 판단하는 기준:',
        '',
        '1. 시간 절약 환산',
        '   - 하루 30분 절약 × 22일 = 11시간/월',
        '   - 본인 시급 × 11시간 > $20이면 투자 가치 있음',
        '',
        '2. 대체 비용 비교',
        '   - 번역 서비스 대체: 전문 번역 1페이지 3~5만원 → 월 2~3건이면 손익분기',
        '   - 코드 작성 외주 대체: 간단한 스크립트 의뢰 5~10만원 → 월 1건이면 손익분기',
        '',
        '3. 무료 기간 활용',
        '   - 대부분 서비스가 무료 트라이얼 제공 없음 → 월간 결제로 먼저 테스트',
        '   - 3개월 사용 후 습관화 확인, 그 후 연간 결제로 전환',
        '',
        '⚠️ 중복 구독 주의: ChatGPT Plus + Claude Pro + Gemini Advanced = 월 6만원+. 1개를 메인으로 쓰고 나머지는 무료로 보완하는 전략 권장.',
      ].join('\n'),
    },
    {
      heading: '한국 사용자 체크포인트',
      content: [
        '▶ 한국어 품질',
        '- Claude Pro: 한국어 문체·맥락 이해 우수',
        '- ChatGPT Plus: 한국어 정보량 많음, 번역 품질 안정적',
        '- Gemini Advanced: 구글 검색 기반 최신 한국어 정보 강점',
        '',
        '▶ 결제 방법',
        '- 국내 카드 결제 모두 가능 (신용카드 필요, 일부 체크카드 불가)',
        '- 환율 변동에 따라 원화 청구액 달라짐 (달러 기준 결제)',
        '- 세금계산서/법인카드 필요 시 각 서비스 비즈니스 플랜 확인',
        '',
        '▶ 데이터 프라이버시',
        '- 업무 기밀 문서 입력 시 학습 데이터 사용 여부 확인 필요',
        '- ChatGPT: Settings → Data Controls에서 학습 비활성화 가능',
        '- Claude: 입력 데이터 학습에 사용하지 않음(기본 정책)',
        '- Gemini: Google 계정 활동 데이터와 연동 주의',
      ].join('\n'),
    },
    {
      heading: 'FAQ — 자주 묻는 질문',
      content: [
        'Q. ChatGPT와 Claude 중 하나만 구독한다면?',
        'A. 코딩·수학·복잡한 추론은 ChatGPT Plus(o1/o3), 긴 문서 작성·분석·지시 이해는 Claude Pro가 강합니다. 구글 생태계 사용자라면 Gemini Advanced.',
        '',
        'Q. 연간 결제가 이득인가요?',
        'A. 사용 습관이 확립된 후 연간 전환을 권장합니다. 첫 달은 월간으로 테스트 → 3개월 이상 활용 시 연간으로 전환(약 17~20% 절감).',
        '',
        'Q. Perplexity Pro는 ChatGPT Plus를 대체할 수 있나요?',
        'A. 리서치·검색 용도라면 대체 가능합니다. 단, 창작·코딩·장문 작성은 여전히 ChatGPT/Claude가 우위.',
        '',
        'Q. 무료 Claude/ChatGPT vs 유료 버전 체감 차이가 크나요?',
        'A. 하루 10회 이하 간단한 질의응답이라면 무료로 충분합니다. 집중적인 업무(하루 30분+ 사용, 긴 컨텍스트, 이미지 생성)에서는 차이가 명확합니다.',
      ].join('\n'),
    },
    {
      heading: '결론',
      content: [
        '한 개만 구독한다면: 글쓰기·문서는 Claude Pro, 코딩·검색·이미지는 ChatGPT Plus, 구글 생태계 사용자는 Gemini Advanced.',
        '',
        '중복 구독 전에 무료 버전으로 1~2주 집중 테스트 후 가장 자주 쓰는 서비스 1개를 유료로 전환하는 전략이 가성비 최고입니다.',
        '',
        '질문이나 추천이 필요한 분야가 있다면 댓글로 알려주세요.',
      ].join('\n'),
    },
    {
      heading: '출처',
      content: ['---', '출처: ThiveLab 편집부', `참고: ${SITE_URL}`, `최초 발행: ${isoNow().slice(0, 10)}`].join('\n'),
    },
  ]
}

// ─────────────────────────────────────────────
// DB 삽입
// ─────────────────────────────────────────────
async function upsertPostAndSections({ slug, title, description, category, tags, author, featured, readMinutes, createdAt, coverImageUrl, sourceUrl, sections }) {
  const { data: postRow, error: postError } = await sb
    .from('posts')
    .upsert({ slug, title, description, category, tags, author, featured, read_minutes: readMinutes, created_at: createdAt, cover_image_url: coverImageUrl || null, source_url: sourceUrl || null }, { onConflict: 'slug' })
    .select('id')
    .single()

  if (postError) throw postError

  const postId = postRow.id
  const { error: delErr } = await sb.from('post_sections').delete().eq('post_id', postId)
  if (delErr) throw delErr

  const sectionRows = sections.map((s, idx) => ({ post_id: postId, position: idx + 1, heading: s.heading, content: s.content }))
  const { error: sectionError } = await sb.from('post_sections').insert(sectionRows)
  if (sectionError) throw sectionError

  return postId
}

async function main() {
  const date = process.env.DATE || new Date().toISOString().slice(0, 10)

  const guides = [
    {
      slug: `value-laptop-guide-${date}`,
      title: `가성비 노트북 고르는 법(${date} 최신 기준): 최소 스펙·예산별 추천`,
      description: '2026년 노트북 가성비 기준을 정리했습니다. RAM·SSD 최소 스펙, 예산별 추천 모델, 직구 vs 정발 실질 계산까지 한국 소비자 관점으로 안내합니다.',
      category: 'laptop',
      tags: ['가성비', '노트북', '구매가이드', '직구', '학생'],
      sections: sectionsNotebook(date),
    },
    {
      slug: `value-phone-guide-${date}`,
      title: `가성비 스마트폰 고르는 법(${date} 최신 기준): 카메라·배터리·예산별 추천`,
      description: '2026년 스마트폰 가성비 구매 가이드. Galaxy A55·Pixel 9a·iPhone 16 비교, 통신사 vs 자급제 총비용 계산, 안드로이드/iOS 선택 기준을 정리합니다.',
      category: 'smartphone',
      tags: ['가성비', '스마트폰', '구매가이드', '자급제', '카메라'],
      sections: sectionsSmartphone(date),
    },
    {
      slug: `value-tablet-guide-${date}`,
      title: `가성비 태블릿 고르는 법(${date} 최신 기준): iPad vs Galaxy Tab 용도별 비교`,
      description: '필기·학업·콘텐츠 소비·업무 생산성별 태블릿 추천. 악세사리 포함 총비용과 노트북 대체 가능 여부까지 한국 소비자 관점으로 정리합니다.',
      category: 'tablet',
      tags: ['가성비', '태블릿', '아이패드', '갤럭시탭', '구매가이드'],
      sections: sectionsTablet(date),
    },
    {
      slug: `parallel-import-vs-kr-${date}`,
      title: `직구 vs 정발 가성비 비교(${date}): 관부가세·총비용 계산법 완전 정리`,
      description: '직구가 정말 저렴한지 계산하는 법. 관부가세 공식, 배대지 선택, Apple·Samsung별 직구/정발 유불리를 실제 수치로 비교합니다.',
      category: 'it-news',
      tags: ['직구', '정발', '가성비', '관부가세', '구매팁'],
      sections: sectionsParallelImport(date),
    },
    {
      slug: `ai-subscription-value-${date}`,
      title: `AI 구독 가성비 가이드(${date}): ChatGPT Plus·Claude Pro·Gemini Advanced 비교`,
      description: 'ChatGPT Plus·Claude Pro·Gemini Advanced 용도별 비교. 코딩·글쓰기·검색·이미지 생성 목적별 추천과 무료로 해결 가능한 작업 범위를 정리합니다.',
      category: 'ai',
      tags: ['ai', '구독', 'chatgpt', '가성비', '구매가이드'],
      sections: sectionsAISubscription(date),
    },
  ]

  const results = []

  for (const g of guides) {
    try {
      const rm = readMinutes(g.sections)
      const postId = await upsertPostAndSections({
        slug: g.slug,
        title: g.title,
        description: g.description,
        category: g.category,
        tags: g.tags,
        author: 'ThiveLab 편집부',
        featured: false,
        readMinutes: rm,
        createdAt: isoNow(),
        coverImageUrl: null,
        sourceUrl: SITE_URL,
        sections: g.sections,
      })
      results.push({ ok: true, id: postId, slug: g.slug })
      console.log(`✅ [${postId}] ${g.title.slice(0, 50)}`)
    } catch (err) {
      results.push({ ok: false, slug: g.slug, error: err.message })
      console.error(`❌ ${g.slug}: ${err.message}`)
    }
  }

  console.log('\n완료:', JSON.stringify({ created: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
