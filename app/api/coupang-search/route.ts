import { createHmac } from 'crypto'
import type { NextRequest } from 'next/server'

const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY ?? ''
const SECRET_KEY = process.env.COUPANG_SECRET_KEY ?? ''

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get('keyword') ?? ''
  const limit = req.nextUrl.searchParams.get('limit') ?? '4'

  if (!keyword || !ACCESS_KEY || !SECRET_KEY) {
    return Response.json({ products: [] })
  }

  // 공식 문서 기준: yyMMdd'T'HHmmss'Z' (2자리 연도)
  const now = new Date()
  const p2 = (n: number) => String(n).padStart(2, '0')
  const datetime =
    String(now.getUTCFullYear()).slice(-2) +
    p2(now.getUTCMonth() + 1) +
    p2(now.getUTCDate()) +
    'T' +
    p2(now.getUTCHours()) +
    p2(now.getUTCMinutes()) +
    p2(now.getUTCSeconds()) +
    'Z'

  // path와 query를 분리 — 서명 메시지에는 '?' 없이 붙임
  const urlPath = '/v2/providers/affiliate_open_api/apis/openapi/products/search'
  const query = `keyword=${encodeURIComponent(keyword)}&limit=${limit}&subId=thivelab`

  const signature = createHmac('sha256', SECRET_KEY)
    .update(`${datetime}GET${urlPath}${query}`)
    .digest('hex')

  try {
    const res = await fetch(`https://api-gateway.coupang.com${urlPath}?${query}`, {
      headers: {
        Authorization: `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${datetime}, signature=${signature}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
    })

    if (!res.ok) {
      return Response.json({ products: [] })
    }

    const data = await res.json()

    const products = (data?.data?.productData ?? [])
      .slice(0, parseInt(limit))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => ({
        id: String(p.productId),
        name: String(p.productName),
        price: Number(p.productPrice),
        image: String(p.productImage ?? ''),
        url: String(p.productUrl),
        isRocket: Boolean(p.isRocket),
      }))

    return Response.json({ products }, {
      headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
    })
  } catch {
    return Response.json({ products: [] })
  }
}
