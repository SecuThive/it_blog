#!/usr/bin/env node

import dotenv from 'dotenv'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function fetchOgImage(url) {
  if (!url) return null
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 12000)
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; it_blog_backfill/1.0)',
        accept: 'text/html,application/xhtml+xml',
      },
    })
    clearTimeout(t)
    if (!res.ok) return null
    const html = await res.text()
    const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    if (m?.[1]) return m[1]
    const m2 = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    return m2?.[1] || null
  } catch {
    return null
  }
}

function stripDateSuffix(slug) {
  return slug.replace(/-\d{4}-\d{2}-\d{2}$/, '')
}

function guessAppleNewsroomUrlFromSlug(slug) {
  const base = stripDateSuffix(slug)
  // Current demo items are 2026/03; if you add other months, we should store source_url at ingest time.
  return `https://www.apple.com/newsroom/2026/03/${base}/`
}

async function main() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id,slug,category,source_url,cover_image_url')
    .or('source_url.is.null,cover_image_url.is.null')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error

  let updated = 0

  for (const p of posts) {
    let sourceUrl = p.source_url
    if (!sourceUrl && p.category === 'apple') {
      sourceUrl = guessAppleNewsroomUrlFromSlug(p.slug)
    }

    const cover = p.cover_image_url || (await fetchOgImage(sourceUrl))

    if (!sourceUrl && !cover) continue

    const patch = {
      source_url: sourceUrl || null,
      cover_image_url: cover || null,
    }

    const { error: upErr } = await supabase.from('posts').update(patch).eq('id', p.id)
    if (upErr) throw upErr

    updated += 1
    // be polite
    await new Promise((r) => setTimeout(r, 400))
  }

  console.log(JSON.stringify({ ok: true, updated }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
