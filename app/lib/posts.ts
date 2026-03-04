import { supabase } from './supabase'

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

export function getCategoryLabel(slug: string): string {
  return slug
    .trim()
    .split('-')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
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
    .limit(3)

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
