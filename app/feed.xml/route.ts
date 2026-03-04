import { getAllPosts } from '../lib/posts'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'
const SITE_NAME = 'ThiveLab'
const SITE_DESC = '스마트폰, 노트북, 태블릿, IT 액세서리 리뷰와 구매가이드'

export async function GET() {
  const posts = await getAllPosts()

  const items = posts
    .slice(0, 20)
    .map((post) =>
      [
        `  <item>`,
        `    <title><![CDATA[${post.title}]]></title>`,
        `    <link>${SITE_URL}/post/${post.slug}</link>`,
        `    <guid isPermaLink="true">${SITE_URL}/post/${post.slug}</guid>`,
        `    <description><![CDATA[${post.description}]]></description>`,
        `    <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>`,
        `    <category>${post.category}</category>`,
        `  </item>`,
      ].join('\n'),
    )
    .join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESC}</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
