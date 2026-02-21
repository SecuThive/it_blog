export type PostCategory = 'smartphone' | 'laptop' | 'review' | 'deal'

export type PostSection = {
  heading: string
  content: string
}

export type Post = {
  id: number
  slug: string
  title: string
  description: string
  category: PostCategory
  tags: string[]
  createdAt: string
  readMinutes: number
  author: string
  featured?: boolean
  sections: PostSection[]
}

export const categoryMeta: Record<PostCategory, { name: string; description: string }> = {
  smartphone: { name: '스마트폰', description: '신제품 소식, 실사용 비교, 구매 포인트' },
  laptop: { name: '노트북/태블릿', description: '학생·직장인 용도별 추천과 성능 비교' },
  review: { name: '상품 리뷰', description: 'IT 기기와 액세서리 실사용 후기' },
  deal: { name: '구매가이드', description: '할인 정보, 예산별 추천, 사기 전 체크리스트' },
}

const posts: Post[] = [
  {
    id: 1,
    slug: 'galaxy-s26-vs-iphone-18-korea-buying-guide',
    title: '갤럭시 S26 vs 아이폰 18: 한국 사용자 기준 구매 가이드',
    description:
      '카메라, 배터리, 통신사 혜택, 중고 감가까지 한국 구매 환경 기준으로 비교했습니다.',
    category: 'smartphone',
    tags: ['갤럭시S26', '아이폰18', '구매가이드'],
    createdAt: '2026-02-18T09:30:00+09:00',
    readMinutes: 8,
    author: '민지훈',
    featured: true,
    sections: [
      {
        heading: '1. 사진 중심이면 줌·야간 후보정을 먼저 비교',
        content:
          '스펙표보다 실제 야간 촬영과 인물 톤 차이가 체감에 더 크게 작용합니다. 여행/일상 사진 비중이 높다면 카메라 성향을 우선으로 고르는 편이 실패가 적습니다.',
      },
      {
        heading: '2. 통신사·카드 할인은 출고가보다 더 중요할 수 있다',
        content:
          '국내는 요금제 결합, 제휴카드, 사전예약 혜택에 따라 체감 구매가가 크게 달라집니다. 원하는 모델을 정한 뒤에도 결제 채널을 다시 비교해야 합니다.',
      },
      {
        heading: '3. 2년 후 중고 가치까지 계산하면 선택이 달라진다',
        content:
          '초기 가격이 조금 높아도 감가가 적은 모델은 총소유비용이 낮아질 수 있습니다. 구매 시점에는 리셀 시세 흐름까지 함께 보길 권장합니다.',
      },
    ],
  },
  {
    id: 2,
    slug: '2026-ultrabook-top5-for-office-and-school',
    title: '2026 초경량 노트북 TOP 5: 학생·직장인 용도별 추천',
    description:
      '휴대성, 배터리, 팬 소음, 키보드 감각까지 실사용 중심으로 비교했습니다.',
    category: 'laptop',
    tags: ['노트북추천', '초경량', '대학생노트북'],
    createdAt: '2026-02-15T11:00:00+09:00',
    readMinutes: 10,
    author: '김서윤',
    featured: true,
    sections: [
      {
        heading: '1. 체감 무게는 숫자보다 충전기 포함 휴대 기준으로 보자',
        content:
          '본체만 1kg 미만이어도 충전기 무게가 크면 매일 들고 다니기 어렵습니다. 통합 무게와 가방 수납성까지 체크해야 실제 만족도가 높습니다.',
      },
      {
        heading: '2. 배터리는 최대 시간보다 회의 2~3회 버티는지를 확인',
        content:
          '영상회의와 문서 작업을 동시에 돌리면 배터리가 급격히 줄 수 있습니다. 사용 패턴에서 몇 시간 버티는지 사용자 리뷰를 반드시 확인해야 합니다.',
      },
      {
        heading: '3. AS 접근성은 장기 사용에서 체감 차이가 크다',
        content:
          '가까운 서비스센터 유무와 수리 기간은 학기/업무 일정에 직접 영향을 줍니다. 스펙이 비슷하다면 보증 정책이 좋은 쪽이 안정적입니다.',
      },
    ],
  },
  {
    id: 3,
    slug: 'ipad-air-2026-accessory-real-use-review',
    title: '아이패드 에어 2026 + 액세서리 실사용 리뷰',
    description:
      '키보드, 펜슬, 케이스 조합별로 필기·문서·영상 시청 경험이 어떻게 달라지는지 정리했습니다.',
    category: 'review',
    tags: ['아이패드에어', '액세서리', '실사용리뷰'],
    createdAt: '2026-02-10T14:00:00+09:00',
    readMinutes: 7,
    author: '박도현',
    sections: [
      {
        heading: '1. 생산성은 키보드 선택에서 거의 결정된다',
        content:
          '태블릿 단독 사용은 휴대성이 좋지만 문서 작업에서는 한계가 명확합니다. 타건감이 맞는 키보드를 고르면 노트북 대체 비율이 크게 올라갑니다.',
      },
      {
        heading: '2. 저가형 케이스는 무게와 발열에서 손해를 보기 쉽다',
        content:
          '보호력만 보고 두꺼운 케이스를 고르면 손목 피로가 빨리 옵니다. 하루 사용 시간이 길다면 경량 케이스가 만족도가 높았습니다.',
      },
    ],
  },
  {
    id: 4,
    slug: 'it-gadget-discount-brief-feb-third-week-2026',
    title: '2월 셋째 주 IT 상품 할인 브리프',
    description:
      '스마트폰, 노트북, 이어폰 주요 특가를 구매 포인트와 함께 정리했습니다.',
    category: 'deal',
    tags: ['할인정보', '특가정리', '주간구매가이드'],
    createdAt: '2026-02-20T08:00:00+09:00',
    readMinutes: 6,
    author: '정하린',
    sections: [
      {
        heading: '1. 카드사 제휴 특가는 무이자 조건까지 함께 봐야 한다',
        content:
          '즉시 할인만 보면 실제 부담 금액을 놓칠 수 있습니다. 월 납부 금액과 총 납부액을 동시에 확인해야 진짜 혜택을 판단할 수 있습니다.',
      },
      {
        heading: '2. 특가 제품은 반품·교환 정책을 먼저 확인하자',
        content:
          '한정 수량 특가는 가격은 좋지만 교환 조건이 까다로운 경우가 있습니다. 고가 제품일수록 반품 규정을 먼저 확인하는 것이 안전합니다.',
      },
    ],
  },
]

export function getAllPosts() {
  return [...posts].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

export function getFeaturedPosts() {
  return getAllPosts().filter((post) => post.featured)
}

export function getPostBySlug(slug: string) {
  return posts.find((post) => post.slug === slug)
}

export function getPostsByCategory(category: PostCategory) {
  return getAllPosts().filter((post) => post.category === category)
}

export function getRelatedPosts(slug: string, category: PostCategory) {
  return getAllPosts()
    .filter((post) => post.slug !== slug && post.category === category)
    .slice(0, 3)
}

export function getPrevNextPost(slug: string) {
  const sorted = getAllPosts()
  const index = sorted.findIndex((post) => post.slug === slug)

  if (index < 0) {
    return { prev: undefined, next: undefined }
  }

  return {
    prev: sorted[index + 1],
    next: sorted[index - 1],
  }
}
