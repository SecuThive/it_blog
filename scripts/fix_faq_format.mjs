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

function ensureText(s) {
  return String(s || '').replace(/\r\n/g, '\n')
}

function normalizeFaq(content) {
  const text = ensureText(content)

  // Remove any stray markdown code fences
  const cleaned = text.replace(/```[\s\S]*?```/g, (m) => {
    // If it's a fenced FAQ example, drop fences and keep inside
    return m.replace(/```/g, '')
  })

  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Ensure header
  const out = []
  if (!lines.length || lines[0] !== 'FAQ(짧게)') out.push('FAQ(짧게)')

  // Keep only bullet Q→A lines
  for (const l of lines) {
    if (l === 'FAQ(짧게)') continue
    if (l.startsWith('- ')) {
      // collapse internal extra spaces
      const ll = l.replace(/\s+/g, ' ')
      // must contain arrow
      if (ll.includes('→')) out.push(ll)
    }
  }

  // Fallback if empty
  if (out.length === 1) {
    out.push('- 지금 사도 되나요? → 상황(가격/출시/정책) 확정 전이면 보류가 안전하고, 급하면 비교 후 결정하세요.')
    out.push('- 업그레이드 가치가 있나요? → 내 병목(성능/배터리/호환/정확도)이 해결되는지가 핵심입니다.')
    out.push('- 후속 업데이트는 어디서 보나요? → 원문 링크와 공식 릴리즈 노트/공지 채널을 확인하세요.')
  }

  return out.join('\n')
}

async function main() {
  const { data: faqSections, error } = await sb
    .from('post_sections')
    .select('id,post_id,heading,content')
    .eq('heading', 'FAQ')

  if (error) throw error

  let updated = 0
  for (const sec of faqSections) {
    const newContent = normalizeFaq(sec.content)
    if (newContent !== sec.content) {
      const { error: upErr } = await sb.from('post_sections').update({ content: newContent }).eq('id', sec.id)
      if (upErr) throw upErr
      updated++
    }
  }

  console.log(JSON.stringify({ ok: true, faqSections: faqSections.length, updated }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
