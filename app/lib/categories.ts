export type CategorySlug =
  | 'it-news'
  | 'laptop'
  | 'smartphone'
  | 'tablet'
  | 'desktop'
  | 'wearable'
  | 'audio'
  | 'software'
  | 'ai'

export const CATEGORIES: { slug: CategorySlug; label: string }[] = [
  { slug: 'it-news',    label: 'IT 뉴스' },
  { slug: 'laptop',     label: '노트북' },
  { slug: 'smartphone', label: '스마트폰' },
  { slug: 'tablet',     label: '태블릿' },
  { slug: 'desktop',    label: '데스크탑' },
  { slug: 'wearable',   label: '웨어러블' },
  { slug: 'audio',      label: '오디오' },
  { slug: 'software',   label: '소프트웨어' },
  { slug: 'ai',         label: 'AI·서비스' },
]

const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.slug, c.label]))

export function getCategoryLabelFromSlug(slug: string): string {
  return CATEGORY_MAP.get(slug as CategorySlug) ?? slug
}

// 제목 키워드 → 카테고리 자동 감지 (ingest에서도 동일 로직 사용)
const KEYWORD_MAP: { pattern: RegExp; slug: CategorySlug }[] = [
  { pattern: /macbook|mac\s*book|notebook|laptop|노트북|그램|\bgram\b|갤럭시\s*북|galaxy\s*book|vivobook|zenbook|thinkpad|m\d+\s*(pro|max)\b/i, slug: 'laptop' },
  { pattern: /iphone|galaxy\s*s|galaxy\s*z|pixel\s*\d|스마트폰|smartphone|android\s*phone/i, slug: 'smartphone' },
  { pattern: /ipad|galaxy\s*tab|태블릿|tablet/i, slug: 'tablet' },
  { pattern: /imac|mac\s*mini|mac\s*pro|mac\s*studio|desktop|데스크탑/i, slug: 'desktop' },
  { pattern: /apple\s*watch|galaxy\s*watch|웨어러블|wearable|watch\s*\d|fitbit/i, slug: 'wearable' },
  { pattern: /airpods|earbuds|headphone|이어폰|헤드폰|스피커|speaker|audio|buds/i, slug: 'audio' },
  { pattern: /macos|windows|ios\s*\d|android\s*\d|소프트웨어|software|os\s*update|앱\s*업데이트/i, slug: 'software' },
  { pattern: /\bai\b|chatgpt|claude|gemini|llm|gpt|copilot|인공지능|머신러닝|딥러닝/i, slug: 'ai' },
]

export function detectCategory(title: string): CategorySlug {
  for (const { pattern, slug } of KEYWORD_MAP) {
    if (pattern.test(title)) return slug
  }
  return 'it-news'
}
