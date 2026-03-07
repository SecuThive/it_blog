import type { MetadataRoute } from 'next'
import { getAllPosts, getPostCategorySummaries, getAllTags } from './lib/posts'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, tags] = await Promise.all([
    getAllPosts(),
    getPostCategorySummaries(),
    getAllTags(),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL,                       changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/feed.xml`,         changeFrequency: 'daily',   priority: 0.4 },
    { url: `${SITE_URL}/about`,            changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contact`,          changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/terms`,            changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE_URL}/privacy`,          changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE_URL}/disclaimer`,       changeFrequency: 'yearly',  priority: 0.3 },
  ]

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${SITE_URL}/category/${cat.slug}`,
    changeFrequency: 'daily',
    priority: 0.6,
  }))

  const tagPages: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${SITE_URL}/tag/${encodeURIComponent(tag)}`,
    changeFrequency: 'daily',
    priority: 0.4,
  }))

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/post/${post.slug}`,
    lastModified: new Date(post.createdAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticPages, ...categoryPages, ...tagPages, ...postPages]
}
