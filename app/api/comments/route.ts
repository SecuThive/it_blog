import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

// GET /api/comments?slug=xxx
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ error: 'slug가 필요합니다.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('comments')
    .select('id, nickname, content, created_at')
    .eq('slug', slug)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/comments
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const slug: string = (body.slug ?? '').trim()
  const nickname: string = (body.nickname ?? '').trim()
  const content: string = (body.content ?? '').trim()

  if (!slug) {
    return NextResponse.json({ error: 'slug가 필요합니다.' }, { status: 400 })
  }
  if (nickname.length < 2) {
    return NextResponse.json({ error: '닉네임은 2글자 이상 입력해 주세요.' }, { status: 422 })
  }
  if (content.length < 3) {
    return NextResponse.json({ error: '댓글은 3글자 이상 입력해 주세요.' }, { status: 422 })
  }
  if (nickname.length > 20 || content.length > 300) {
    return NextResponse.json({ error: '입력 길이를 초과했습니다.' }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({ slug, nickname, content })
    .select('id, nickname, content, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
