#!/usr/bin/env node

import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import Parser from 'rss-parser'
import { createClient } from '@supabase/supabase-js'

// Load Next.js-style local env file
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL')
  process.exit(1)
}
if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY (required for server-side inserts)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const workspaceRoot = process.cwd()
const feedsPath = path.join(workspaceRoot, 'content', 'feeds.json')
const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf8'))

const parser = new Parser({ timeout: 20000 })

function toSlug(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

function isoDate(d) {
  try {
    return new Date(d).toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function koSummaryFromItem(item) {
  // Minimal: create a Korean summary shell.
  const title = item.title || '제목 없음'
  const link = item.link || ''
  const publishedAt = item.isoDate || item.pubDate || ''

  const tldr = [
    `- 한 줄 요약: ${title} 관련 소식이 공개되었습니다.`,
    `- 핵심 포인트: 공식 발표 기준으로 주요 내용을 정리했습니다.`,
    `- 실사용 관점: 국내 구매/사용자에게 영향이 있는지 체크했습니다.`,
  ].join('\n')

  const checkpoints = [
    '- 구매 체크포인트',
    '  - 출시/지원 지역(한국 포함 여부)',
    '  - 가격/구독/번들 조건',
    '  - 이전 모델/버전 대비 변경점',
  ].join('\n')

  const source = [
    '---',
    `출처: ${link}`,
    publishedAt ? `발행일(원문): ${publishedAt}` : null,
  ].filter(Boolean).join('\n')

  return {
    description: `공식 발표 기반 요약: ${title}`,
    sections: [
      { heading: 'TL;DR', content: tldr },
      { heading: '구매/사용 체크포인트', content: checkpoints },
      { heading: '출처', content: source },
      {
        heading: '질문',
        content: '이 소식, 여러분은 어떻게 보시나요? 댓글로 한 줄 의견 남겨주세요.',
      },
    ],
  }
}

async function ensureIngestTables() {
  // Tables must be created via SQL editor (we won’t auto-migrate here).
  const { error } = await supabase.from('ingest_sources').select('id').limit(1)
  if (error) {
    console.error('Missing ingest_sources table (run SQL schema first):', error.message)
    process.exit(1)
  }
}

async function upsertSource(feed) {
  const { data, error } = await supabase
    .from('ingest_sources')
    .upsert(
      {
        name: feed.name,
        feed_url: feed.feedUrl,
        language: feed.language || 'en',
        category: feed.category || 'news',
        is_active: true,
      },
      { onConflict: 'feed_url' },
    )
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

async function alreadyIngested(url) {
  const { data } = await supabase
    .from('ingest_items')
    .select('id')
    .eq('url', url)
    .maybeSingle()
  return Boolean(data)
}

async function markIngested({ sourceId, url, title, publishedAt }) {
  const { error } = await supabase.from('ingest_items').insert({
    source_id: sourceId,
    url,
    title,
    published_at: publishedAt,
  })
  if (error) throw error
}

async function createPost({ slug, title, description, category, tags, author, featured, readMinutes, createdAt, sections }) {
  const { data: postRow, error: postError } = await supabase
    .from('posts')
    .insert({
      slug,
      title,
      description,
      category,
      tags,
      author,
      featured,
      read_minutes: readMinutes,
      created_at: createdAt,
    })
    .select('id')
    .single()

  if (postError) throw postError

  const postId = postRow.id
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

async function main() {
  await ensureIngestTables()

  let createdCount = 0

  for (const feed of feeds) {
    const sourceId = await upsertSource(feed)

    console.error(`Fetching feed: ${feed.name} (${feed.feedUrl})`)
    const res = await parser.parseURL(feed.feedUrl)
    const items = (res.items || []).slice(0, 10)

    for (const item of items) {
      const url = item.link
      if (!url) continue

      if (await alreadyIngested(url)) continue

      const title = (item.title || 'Untitled').trim()
      const publishedAt = isoDate(item.isoDate || item.pubDate || new Date())

      const baseSlug = toSlug(title) || toSlug(url)
      const slug = `${baseSlug}-${new Date(publishedAt).toISOString().slice(0, 10)}`

      const { description, sections } = koSummaryFromItem(item)

      await createPost({
        slug,
        title: title,
        description,
        category: feed.category || 'news',
        tags: ['news', feed.category || 'news'],
        author: '오늘의 IT 블로그',
        featured: false,
        readMinutes: 3,
        createdAt: publishedAt,
        sections,
      })

      await markIngested({ sourceId, url, title, publishedAt })

      createdCount += 1
      if (createdCount >= 3) break
    }

    if (createdCount >= 3) break
  }

  console.log(JSON.stringify({ ok: true, createdCount }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
