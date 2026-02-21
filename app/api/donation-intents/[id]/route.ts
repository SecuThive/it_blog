import { NextResponse } from 'next/server'
import { formatKrw, getDonationIntentById } from '../../../lib/donations'

type Params = {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: Params) {
  const { id } = await params
  const intent = await getDonationIntentById(id)

  if (!intent) {
    return NextResponse.json({ error: '해당 기부 요청을 찾을 수 없습니다.' }, { status: 404 })
  }

  return NextResponse.json({
    id: intent.id,
    donorMasked: intent.donorMasked,
    amount: intent.amount,
    amountLabel: formatKrw(intent.amount),
    status: intent.status,
    depositorHint: intent.depositorHint,
    createdAt: intent.createdAt,
    paidAt: intent.paidAt,
    message: intent.message,
  })
}
