import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim()
  const subject = String(body.subject ?? '').trim()
  const message = String(body.message ?? '').trim()

  if (name.length < 2) {
    return NextResponse.json({ error: '이름을 2자 이상 입력해주세요.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '올바른 이메일 주소를 입력해주세요.' }, { status: 400 })
  }
  if (message.length < 10) {
    return NextResponse.json({ error: '문의 내용을 10자 이상 입력해주세요.' }, { status: 400 })
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: '문의 내용은 2000자 이내로 입력해주세요.' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { error } = await supabaseAdmin.from('contact_submissions').insert({
    name: name.slice(0, 100),
    email: email.slice(0, 200),
    subject: subject.slice(0, 100) || null,
    message: message.slice(0, 2000),
  })

  if (error) {
    console.error('[contact] Supabase insert error:', error.message)
    return NextResponse.json({ error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
