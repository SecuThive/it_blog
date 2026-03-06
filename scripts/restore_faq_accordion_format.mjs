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

function isHeader(line) {
  return /^FAQ\(짧게\)/i.test(line.trim())
}

function toQ(line) {
  const q = line.trim().replace(/^[-•]\s*/, '')
  // split "Q → A" style
  const parts = q.split('→').map((x) => x.trim())
  const qq = parts[0]
  return qq.endsWith('?') ? qq : `${qq}?`
}

function toA(line) {
  const t = line.trim().replace(/^[-•]\s*/, '')
  const parts = t.split('→').map((x) => x.trim())
  if (parts.length >= 2) return `- ${parts.slice(1).join(' → ')}`
  return `- ${t}`
}

function restore(content) {
  const lines = ensureText(content)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const out = ['FAQ(짧게)']

  for (const l of lines) {
    if (isHeader(l)) continue

    // If it's "- Q? → A" (our recent format)
    if (l.startsWith('-') && l.includes('→')) {
      out.push(toQ(l))
      out.push(toA(l))
      continue
    }

    // If it's already in expected format, keep it.
    // Question line (ends with ?) OR bold question
    if ((l.endsWith('?') && !l.startsWith('-')) || (l.startsWith('**') && l.endsWith('**'))) {
      out.push(l.replace(/^\*\*/, '').replace(/\*\*$/, ''))
      continue
    }

    // Answer bullet
    if (l.startsWith('-')) {
      out.push(l)
      continue
    }

    // If it's a plain line containing arrow but no dash
    if (l.includes('→')) {
      out.push(toQ(l))
      out.push(toA(l))
      continue
    }

    // Otherwise: treat as answer line under previous question
    out.push(`- ${l}`)
  }

  // If we somehow ended with a question without answer, add a placeholder.
  for (let i = 0; i < out.length; i++) {
    if (out[i].endsWith('?')) {
      const next = out[i + 1] || ''
      if (!next.startsWith('-')) {
        out.splice(i + 1, 0, '- (답변 준비 중)')
      }
    }
  }

  return out.join('\n')
}

async function main() {
  const { data: secs, error } = await sb
    .from('post_sections')
    .select('id,post_id,heading,content')
    .eq('heading', 'FAQ')

  if (error) throw error

  let updated = 0
  for (const s of secs) {
    const newContent = restore(s.content)
    if (newContent !== s.content) {
      const { error: upErr } = await sb.from('post_sections').update({ content: newContent }).eq('id', s.id)
      if (upErr) throw upErr
      updated++
    }
  }

  console.log(JSON.stringify({ ok: true, total: secs.length, updated }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
