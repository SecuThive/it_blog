#!/usr/bin/env node

import dotenv from 'dotenv'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
if (!SERVICE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function inferSourceName(url) {
  if (!url) return '출처'
  if (/apple\.com\/newsroom/i.test(url)) return 'Apple Newsroom'
  if (/news\.samsung\.com/i.test(url)) return '삼성전자 뉴스룸'
  if (/openai\.com\/(index|news)/i.test(url)) return 'OpenAI News'
  if (/prnewswire\.com/i.test(url)) return 'PR Newswire'
  return '출처'
}

async function main() {
  const { data: posts, error } = await sb
    .from('posts')
    .select('id,created_at,source_url')

  if (error) throw error

  let updated = 0

  for (const p of posts) {
    const { data: srcSec, error: e2 } = await sb
      .from('post_sections')
      .select('id,content')
      .eq('post_id', p.id)
      .eq('heading', '출처')
      .maybeSingle()

    if (e2) throw e2
    if (!srcSec) continue

    const url = p.source_url
    const iso = new Date(p.created_at || new Date()).toISOString()
    const name = inferSourceName(url)

    const desired = ['---', `출처: ${name}`, url ? `원문 링크: ${url}` : '원문 링크: ', `발행일(원문): ${iso}`]
      .filter(Boolean)
      .join('\n')

    if (srcSec.content !== desired) {
      const { error: upErr } = await sb.from('post_sections').update({ content: desired }).eq('id', srcSec.id)
      if (upErr) throw upErr
      updated++
    }
  }

  console.log(JSON.stringify({ ok: true, total: posts.length, updated }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
