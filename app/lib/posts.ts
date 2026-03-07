import { supabase } from './supabase'
import { getCategoryLabelFromSlug } from './categories'

export type PostCategory = string

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
  coverImageUrl?: string | null
  sourceUrl?: string | null
  sections: PostSection[]
}

export type PostCategorySummary = {
  slug: string
  name: string
  description: string
  count: number
}

export type TagSummary = {
  tag: string
  count: number
  description: string
}

export function getCategoryLabel(slug: string): string {
  return getCategoryLabelFromSlug(slug)
}

function getCategoryDescription(slug: string): string {
  return `${getCategoryLabel(slug)} 카테고리 글 모음`
}

// DB 행 → Post 타입 변환
function rowToPost(row: Record<string, unknown>, sections: Record<string, unknown>[]): Post {
  return {
    id: Number(row.id),
    slug: String(row.slug),
    title: String(row.title),
    description: String(row.description),
    category: row.category as PostCategory,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    createdAt: String(row.created_at),
    readMinutes: Number(row.read_minutes),
    author: String(row.author),
    featured: Boolean(row.featured),
    coverImageUrl: row.cover_image_url ? String(row.cover_image_url) : null,
    sourceUrl: row.source_url ? String(row.source_url) : null,
    sections: sections
      .filter((s) => Number(s.post_id) === Number(row.id))
      .sort((a, b) => Number(a.position) - Number(b.position))
      .map((s) => ({ heading: String(s.heading), content: String(s.content) })),
  }
}

export async function getPostsCount(): Promise<number> {
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
  return count ?? 0
}

export async function getPaginatedPosts(page: number, pageSize: number): Promise<Post[]> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: postRows, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error || !postRows?.length) return []

  const postIds = postRows.map((p) => p.id)
  const { data: sectionRows } = await supabase
    .from('post_sections')
    .select('*')
    .in('post_id', postIds)
    .order('position', { ascending: true })

  return postRows.map((row) => rowToPost(row, sectionRows ?? []))
}

export async function getAllPosts(): Promise<Post[]> {
  const { data: postRows, error: postError } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (postError || !postRows?.length) return []

  const postIds = postRows.map((p) => p.id)
  const { data: sectionRows } = await supabase
    .from('post_sections')
    .select('*')
    .in('post_id', postIds)
    .order('position', { ascending: true })

  return postRows.map((row) => rowToPost(row, sectionRows ?? []))
}

export async function getAllTags(): Promise<string[]> {
  const { data, error } = await supabase.from('posts').select('tags')
  if (error || !data?.length) return []

  const tags = new Set<string>()
  type TagsRow = { tags?: unknown }

  for (const row of data as TagsRow[]) {
    const maybe = row?.tags
    const arr = Array.isArray(maybe) ? (maybe as unknown[]).map(String) : []
    for (const t of arr) {
      const tt = String(t || '').trim()
      if (!tt) continue
      tags.add(tt)
    }
  }

  return [...tags].sort((a, b) => a.localeCompare(b))
}

function describeTag(tag: string): string {
  const t = String(tag || '').trim()
  const lower = t.toLowerCase()

  if (lower === 'openai' || lower === 'chatgpt') return 'OpenAI/ChatGPT 업데이트와 활용 팁을 모아봅니다.'
  if (lower.startsWith('gpt-')) return 'GPT 모델 업데이트·비교·체크리스트 글을 모아봅니다.'
  if (lower === 'apple' || lower.includes('mac') || lower.includes('iphone') || lower.includes('ipad')) return 'Apple 관련 발표/업데이트를 모아봅니다.'
  if (lower === 'samsung' || lower.includes('galaxy')) return '삼성/갤럭시 관련 신제품·업데이트를 모아봅니다.'
  if (lower === 'lg' || lower.includes('gram')) return 'LG/LG gram 관련 신제품·업데이트를 모아봅니다.'
  if (lower === 'ai') return 'AI 서비스/모델/업계 소식을 모아봅니다.'

  return `#${t} 관련 글을 모아봅니다.`
}

export async function getTagSummary(tag: string): Promise<TagSummary | null> {
  const t = String(tag || '').trim()
  if (!t) return null

  // exact match against array element
  const { count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .contains('tags', [t])

  if (error) return null
  return { tag: t, count: count ?? 0, description: describeTag(t) }
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const t = String(tag || '').trim()
  if (!t) return []

  const { data: postRows, error } = await supabase
    .from('posts')
    .select('*')
    .contains('tags', [t])
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !postRows?.length) return []

  const postIds = postRows.map((p) => p.id)
  const { data: sectionRows } = await supabase
    .from('post_sections')
    .select('*')
    .in('post_id', postIds)
    .order('position', { ascending: true })

  return postRows.map((row) => rowToPost(row, sectionRows ?? []))
}

export async function getPostCategorySummaries(): Promise<PostCategorySummary[]> {
  const { data, error } = await supabase.from('posts').select('category')
  if (error || !data?.length) return []

  const counts = new Map<string, number>()
  for (const row of data) {
    const category = String(row.category ?? '').trim()
    if (!category) continue
    counts.set(category, (counts.get(category) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([slug, count]) => ({
      slug,
      name: getCategoryLabel(slug),
      description: getCategoryDescription(slug),
      count,
    }))
}

export async function getPostCategorySummary(slug: string): Promise<PostCategorySummary | null> {
  const summaries = await getPostCategorySummaries()
  return summaries.find((summary) => summary.slug === slug) ?? null
}

export async function getFeaturedPosts(): Promise<Post[]> {
  const { data: postRows, error } = await supabase
    .from('posts')
    .select('*')
    .eq('featured', true)
    .order('created_at', { ascending: false })

  if (error || !postRows?.length) return []

  const postIds = postRows.map((p) => p.id)
  const { data: sectionRows } = await supabase
    .from('post_sections')
    .select('*')
    .in('post_id', postIds)
    .order('position', { ascending: true })

  return postRows.map((row) => rowToPost(row, sectionRows ?? []))
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { data: postRow, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !postRow) return null

  const { data: sectionRows } = await supabase
    .from('post_sections')
    .select('*')
    .eq('post_id', postRow.id)
    .order('position', { ascending: true })

  return rowToPost(postRow, sectionRows ?? [])
}

export async function getPostsByCategory(category: PostCategory): Promise<Post[]> {
  const { data: postRows, error } = await supabase
    .from('posts')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false })

  if (error || !postRows?.length) return []

  const postIds = postRows.map((p) => p.id)
  const { data: sectionRows } = await supabase
    .from('post_sections')
    .select('*')
    .in('post_id', postIds)
    .order('position', { ascending: true })

  return postRows.map((row) => rowToPost(row, sectionRows ?? []))
}

export async function getRelatedPosts(slug: string, category: PostCategory): Promise<Post[]> {
  const { data: postRows, error } = await supabase
    .from('posts')
    .select('*')
    .eq('category', category)
    .neq('slug', slug)
    .order('created_at', { ascending: false })
    .limit(9)

  if (error || !postRows?.length) return []

  const postIds = postRows.map((p) => p.id)
  const { data: sectionRows } = await supabase
    .from('post_sections')
    .select('*')
    .in('post_id', postIds)
    .order('position', { ascending: true })

  return postRows.map((row) => rowToPost(row, sectionRows ?? []))
}

export async function getRelatedPostsSmart(slug: string, category: PostCategory, tags: string[]): Promise<Post[]> {
  const cleanTags = Array.isArray(tags) ? tags.filter(Boolean).slice(0, 10) : []

  // 1) Same category candidates
  const { data: catRows } = await supabase
    .from('posts')
    .select('*')
    .eq('category', category)
    .neq('slug', slug)
    .order('created_at', { ascending: false })
    .limit(30)

  // 2) Tag overlap candidates (any overlap)
  const { data: tagRows } = cleanTags.length
    ? await supabase
        .from('posts')
        .select('*')
        .neq('slug', slug)
        .overlaps('tags', cleanTags)
        .order('created_at', { ascending: false })
        .limit(30)
    : { data: [] }

  const merged = new Map<number, Record<string, unknown>>()
  for (const r of [...(catRows ?? []), ...(tagRows ?? [])]) {
    const rr = r as Record<string, unknown>
    merged.set(Number(rr.id), rr)
  }

  const rows = [...merged.values()]

  // Rank: tag overlap count + same category bonus + recency
  const tagSet = new Set(cleanTags.map((t) => String(t).toLowerCase()))
  rows.sort((a, b) => {
    const aTagsArr = Array.isArray((a as Record<string, unknown>).tags) ? ((a as Record<string, unknown>).tags as unknown[]) : []
    const bTagsArr = Array.isArray((b as Record<string, unknown>).tags) ? ((b as Record<string, unknown>).tags as unknown[]) : []

    const aTags = new Set(aTagsArr.map((t) => String(t).toLowerCase()))
    const bTags = new Set(bTagsArr.map((t) => String(t).toLowerCase()))

    const overlapA = [...aTags].filter((t) => tagSet.has(t)).length
    const overlapB = [...bTags].filter((t) => tagSet.has(t)).length

    const catA = String((a as Record<string, unknown>).category || '')
    const catB = String((b as Record<string, unknown>).category || '')

    const catBonusA = catA === category ? 2 : 0
    const catBonusB = catB === category ? 2 : 0

    const scoreA = overlapA * 3 + catBonusA
    const scoreB = overlapB * 3 + catBonusB

    if (scoreA !== scoreB) return scoreB - scoreA

    const aTime = new Date(String((a as Record<string, unknown>).created_at || 0)).getTime()
    const bTime = new Date(String((b as Record<string, unknown>).created_at || 0)).getTime()
    return bTime - aTime
  })

  const top = rows.slice(0, 9)

  const postIds = top.map((p) => p.id)
  if (!postIds.length) return []

  const { data: sectionRows } = await supabase
    .from('post_sections')
    .select('*')
    .in('post_id', postIds)
    .order('position', { ascending: true })

  // Preserve ranking order
  const posts = top.map((r) => rowToPost(r as Record<string, unknown>, sectionRows ?? []))
  return posts
}

export async function searchPosts(query: string): Promise<Post[]> {
  if (!query.trim()) return []

  const q = `%${query.trim()}%`
  const { data: postRows, error } = await supabase
    .from('posts')
    .select('*')
    .or(`title.ilike.${q},description.ilike.${q}`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error || !postRows?.length) return []

  const postIds = postRows.map((p) => p.id)
  const { data: sectionRows } = await supabase
    .from('post_sections')
    .select('*')
    .in('post_id', postIds)
    .order('position', { ascending: true })

  return postRows.map((row) => rowToPost(row, sectionRows ?? []))
}

export async function getPrevNextPost(
  slug: string,
): Promise<{ prev: Post | undefined; next: Post | undefined }> {
  const all = await getAllPosts()
  const index = all.findIndex((p) => p.slug === slug)

  if (index < 0) return { prev: undefined, next: undefined }

  return {
    prev: all[index + 1],
    next: all[index - 1],
  }
}
