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

const BOT_NAME = process.env.BLOG_BOT_NAME || 'ThiveLab 편집부'

function isKorean(text) {
  return /[가-힣]/.test(String(text || ''))
}

function looksLikeSpam(text) {
  const t = String(text || '').toLowerCase()
  return /http|https|t\.me|bit\.ly|free money|telegram|whatsapp|sex|casino|bet|airdrop|giveaway/.test(t)
}

function makeReply(original) {
  const c = String(original || '').trim()

  // Very simple intent buckets
  const q = /\?|어떻게|뭐야|무슨|언제|가격|정발|추천|비교|사도|업글|업그레이드|스펙/i.test(c)
  const praise = /감사|좋은|유익|도움|잘봤|굿|great|thanks/i.test(c)

  if (q) {
    if (isKorean(c)) {
      return '질문 감사해요! 댓글에 **사용 용도(문서/개발/영상/게임)**랑 현재 쓰는 기기만 적어주시면, 한국 기준(정발/직구/AS/가격)까지 포함해서 더 구체적으로 정리해드릴게요.'
    }
    return 'Thanks for the question! Drop your use case (work/dev/video/gaming) and your current device, and I’ll reply with a more practical, KR-market-focused breakdown (pricing/availability/warranty).' 
  }

  if (praise) {
    if (isKorean(c)) {
      return '읽어주셔서 감사합니다! 다음 글에서는 한국 정발 가격/구성(프로모션)까지 확인해서 더 실용적으로 정리해볼게요.'
    }
    return 'Thanks for reading! I’ll keep the next posts more practical (pricing/availability/warranty for KR readers) as updates come in.'
  }

  if (isKorean(c)) {
    return '댓글 감사해요! 필요하신 포인트(가격/출시/옵션/대체 제품) 있으면 편하게 남겨주세요. 다음 업데이트에서 더 구체적으로 정리해볼게요.'
  }
  return 'Thanks for the comment! If you share what you care about most (price/date/specs/alternatives), I can tailor the next update.'
}

async function main() {
  const sinceMinutes = Number.parseInt(process.env.SINCE_MINUTES || '180', 10) || 180
  const sinceIso = new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString()

  const { data: recent, error } = await sb
    .from('comments')
    .select('id,slug,nickname,content,created_at')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: true })

  if (error) throw error

  // Group by slug; naive threading (since schema has no parent_id)
  const bySlug = new Map()
  for (const c of recent) {
    if (!bySlug.has(c.slug)) bySlug.set(c.slug, [])
    bySlug.get(c.slug).push(c)
  }

  let replied = 0

  for (const [slug, comments] of bySlug.entries()) {
    for (const c of comments) {
      // Skip bot's own comments
      if (String(c.nickname || '').trim() === BOT_NAME) continue

      // Skip spam
      if (looksLikeSpam(c.content)) continue

      // If a bot reply already exists AFTER this comment for the same slug, skip
      const hasReply = comments.some(
        (x) => String(x.nickname || '').trim() === BOT_NAME && new Date(x.created_at) > new Date(c.created_at),
      )
      if (hasReply) continue

      const replyText = makeReply(c.content)
      const { error: insErr } = await sb.from('comments').insert({
        slug,
        nickname: BOT_NAME,
        content: replyText,
      })
      if (insErr) throw insErr

      replied++
    }
  }

  console.log(JSON.stringify({ ok: true, sinceIso, scanned: recent.length, replied }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
