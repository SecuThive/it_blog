/**
 * 영어 제목/description 한국어 번역 스크립트
 *
 * 사전 준비: .env.local 에 ANTHROPIC_API_KEY=sk-ant-... 추가
 * 실행: node scripts/translate_english_posts.mjs [--dry-run]
 */

import dotenv from 'dotenv'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}
if (!ANTHROPIC_KEY) {
  console.error('Missing ANTHROPIC_API_KEY — .env.local 에 추가해주세요: ANTHROPIC_API_KEY=sk-ant-...')
  process.exit(1)
}

const DRY_RUN = process.argv.includes('--dry-run')
const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const claude = new Anthropic({ apiKey: ANTHROPIC_KEY })

function isEnglishHeavy(text) {
  if (!text) return false
  const korean = (text.match(/[가-힣]/g) || []).length
  const ascii = (text.match(/[a-zA-Z]/g) || []).length
  return ascii > korean * 2 && ascii > 10
}

function isTruncated(text) {
  // 마지막 단어가 끊겨 보이는 경우
  return /\s[a-zA-Z]{1,3}$/.test(text.trim())
}

async function translatePost(post) {
  const prompt = `당신은 IT 블로그 에디터입니다. 아래 영어 제목과 description을 한국 IT 독자 관점에서 자연스러운 한국어로 번역하세요.

규칙:
- 제목: 간결하고 임팩트 있게. 60자 이내.
- description: 2문장 이내, 핵심 내용 요약. 100자 이내.
- 번역이 아닌 한국 독자가 쉽게 이해할 수 있는 표현 사용
- JSON 형식으로만 응답

카테고리: ${post.category}
영어 제목: ${post.title}
영어 description: ${post.description}

JSON 형식:
{"title": "한국어 제목", "description": "한국어 description"}`

  const msg = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`JSON 파싱 실패: ${text}`)
  return JSON.parse(jsonMatch[0])
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== 영어 → 한국어 번역 시작 ===')

  const { data: posts } = await sb
    .from('posts')
    .select('id, title, description, category')
    .order('id', { ascending: true })

  const targets = (posts || []).filter(
    (p) => isEnglishHeavy(p.title) || isTruncated(p.title) || isEnglishHeavy(p.description)
  )

  console.log(`\n번역 대상: ${targets.length}개 / 전체 ${(posts || []).length}개\n`)

  if (DRY_RUN) {
    for (const p of targets) {
      const flags = [
        isEnglishHeavy(p.title) ? '제목영어' : '',
        isTruncated(p.title) ? '제목잘림' : '',
        isEnglishHeavy(p.description) ? 'desc영어' : '',
      ].filter(Boolean).join('+')
      console.log(`  [${p.id}] [${flags}] ${p.title.slice(0, 60)}`)
    }
    console.log('\nDRY RUN 완료. 실제 번역하려면 --dry-run 없이 실행하세요.')
    return
  }

  let success = 0, fail = 0

  for (const post of targets) {
    try {
      const translated = await translatePost(post)
      const { error } = await sb
        .from('posts')
        .update({ title: translated.title, description: translated.description })
        .eq('id', post.id)

      if (error) throw error

      console.log(`✅ [${post.id}]`)
      console.log(`   전: ${post.title.slice(0, 60)}`)
      console.log(`   후: ${translated.title}`)
      success++
      await sleep(300) // rate limit 방지
    } catch (err) {
      console.error(`❌ [${post.id}] 실패: ${err.message}`)
      fail++
      await sleep(1000)
    }
  }

  console.log(`\n완료: 성공 ${success}개, 실패 ${fail}개`)
}

main().catch(console.error)
