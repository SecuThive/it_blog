/**
 * migrate_slugs.mjs
 * 기존 posts 테이블의 slug를 앞 5단어 + 날짜 형식으로 단축합니다.
 * 실행: node scripts/migrate_slugs.mjs
 */
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env.local') })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

/**
 * slug에서 날짜 suffix(-YYYY-MM-DD)를 분리하고
 * base 부분을 앞 5단어로 잘라 반환
 */
function shortenSlug(slug) {
  const dateMatch = slug.match(/^(.+)-(\d{4}-\d{2}-\d{2})$/)

  if (dateMatch) {
    const [, base, date] = dateMatch
    const parts = base.split('-')
    if (parts.length <= 5) return slug          // 이미 짧음
    return `${parts.slice(0, 5).join('-')}-${date}`
  }

  // 날짜 없는 slug
  const parts = slug.split('-')
  if (parts.length <= 5) return slug
  return parts.slice(0, 5).join('-')
}

async function main() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, slug, title')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('포스트 조회 실패:', error.message)
    process.exit(1)
  }

  console.log(`총 ${posts.length}개 포스트 확인\n`)

  // 충돌 방지: 최종 slug 집합(이미 짧은 것 포함)
  const usedSlugs = new Set()
  const migrations = []

  for (const post of posts) {
    const newSlug = shortenSlug(post.slug)

    if (newSlug === post.slug) {
      usedSlugs.add(post.slug)
      console.log(`[SKIP]    ${post.slug}`)
      continue
    }

    // 충돌 시 숫자 suffix
    let finalSlug = newSlug
    let n = 1
    while (usedSlugs.has(finalSlug)) {
      finalSlug = `${newSlug}-${n++}`
    }

    usedSlugs.add(finalSlug)
    migrations.push({ id: post.id, oldSlug: post.slug, newSlug: finalSlug })
    console.log(`[MIGRATE] ${post.slug}\n          → ${finalSlug}`)
  }

  if (migrations.length === 0) {
    console.log('\n변경할 slug가 없습니다.')
    return
  }

  console.log(`\n${migrations.length}개 slug 업데이트 시작...\n`)

  let success = 0
  let fail = 0

  for (const { id, oldSlug, newSlug } of migrations) {
    const { error } = await supabase
      .from('posts')
      .update({ slug: newSlug })
      .eq('id', id)

    if (error) {
      console.error(`✗ 실패: ${oldSlug} → ${error.message}`)
      fail++
    } else {
      console.log(`✓ ${oldSlug} → ${newSlug}`)
      success++
    }
  }

  console.log(`\n완료 — 성공: ${success}, 실패: ${fail}`)
}

main()
