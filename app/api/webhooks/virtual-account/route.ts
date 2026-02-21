import { NextResponse } from 'next/server'
import { recordDepositedDonation } from '../../../lib/donations'

export async function POST(request: Request) {
  const webhookSecret = process.env.DONATION_WEBHOOK_SECRET
  const receivedSecret = request.headers.get('x-donation-webhook-secret')

  if (!webhookSecret) {
    return NextResponse.json({ error: 'DONATION_WEBHOOK_SECRET가 설정되지 않았습니다.' }, { status: 500 })
  }

  if (!receivedSecret || receivedSecret !== webhookSecret) {
    return NextResponse.json({ error: '웹훅 인증 실패' }, { status: 401 })
  }

  try {
    const payload = await request.json()

    if (payload?.eventType !== 'VIRTUAL_ACCOUNT_DEPOSITED') {
      return NextResponse.json({ ignored: true })
    }

    const result = await recordDepositedDonation({
      intentId: payload?.intentId ? String(payload.intentId) : undefined,
      providerTxId: String(payload?.providerTxId ?? ''),
      donorName: payload?.donorName ? String(payload.donorName) : undefined,
      amount: Number(payload?.amount ?? 0),
      method: '계좌이체',
      message: payload?.message ? String(payload.message) : undefined,
      depositedAt: payload?.depositedAt ? String(payload.depositedAt) : undefined,
    })

    if (result.duplicated) {
      return NextResponse.json({ success: true, duplicated: true })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const reason = error instanceof Error ? error.message : '웹훅 처리 실패'
    return NextResponse.json({ error: reason }, { status: 400 })
  }
}
