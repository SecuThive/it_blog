import { revalidatePath } from 'next/cache'
import type { NextRequest } from 'next/server'

const SECRET = process.env.REVALIDATE_SECRET ?? ''

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('secret')

  if (!SECRET || token !== SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  revalidatePath('/', 'layout')

  return Response.json({ revalidated: true, at: new Date().toISOString() })
}
