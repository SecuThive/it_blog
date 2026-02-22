import { NextResponse } from 'next/server'
import { recordDepositedDonation } from '../../../lib/donations'

export async function POST(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD
  const body = await request.json()

  if (!adminPassword) {
    return NextResponse.json({ error: 'ADMIN_PASSWORD가 설정되지 않았습니다.' }, { status: 500 })
  }

  if (String(body?.adminPassword ?? '') !== adminPassword) {
    return NextResponse.json({ error: '관리자 인증에 실패했습니다.' }, { status: 401 })
  }

  try {
    const intentId = body?.intentId ? String(body.intentId) : undefined
    const providerTxId = String(body?.providerTxId ?? '')
    const donorName = body?.donorName ? String(body.donorName) : undefined
    const amount = Number(body?.amount ?? 0)
    const message = body?.message ? String(body.message) : undefined
    const depositedAt = body?.depositedAt ? String(body.depositedAt) : undefined

    const result = await recordDepositedDonation({
      intentId,
      providerTxId,
      donorName,
      amount,
      message,
      depositedAt,
    })

    return NextResponse.json({ success: true, duplicated: result.duplicated })
  } catch (error) {
    const reason = error instanceof Error ? error.message : '수동 인증 처리 실패'
    return NextResponse.json({ error: reason }, { status: 400 })
  }
}
