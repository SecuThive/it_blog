import { NextResponse } from 'next/server'
import {
  createDonationIntent,
  getActiveDonationVirtualAccount,
  maskDonorName,
} from '../../lib/donations'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const donorName = String(body?.donorName ?? '').trim()
    const amount = Number(body?.amount ?? 0)
    const message = body?.message ? String(body.message) : undefined

    if (!donorName || donorName.length < 2) {
      return NextResponse.json({ error: '기부자명은 2글자 이상이어야 합니다.' }, { status: 400 })
    }

    if (!Number.isFinite(amount) || amount < 1000) {
      return NextResponse.json({ error: '기부 금액은 1,000원 이상이어야 합니다.' }, { status: 400 })
    }

    const intent = await createDonationIntent({
      donorName,
      amount,
      message,
      depositorHint: `ITBLOG-${Date.now().toString().slice(-6)}`,
    })
    const account = await getActiveDonationVirtualAccount()

    return NextResponse.json({
      success: true,
      intentId: intent.id,
      depositorNameRule: `${maskDonorName(donorName)} / ${intent.depositorHint}`,
      virtualAccount: {
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        accountHolder: account.accountHolder,
      },
      amount,
      message: '입금 확인 후 자동으로 투명성 페이지에 반영됩니다.',
    })
  } catch (error) {
    const reason = error instanceof Error ? error.message : '기부 요청 생성 실패'
    return NextResponse.json({ error: reason }, { status: 500 })
  }
}
