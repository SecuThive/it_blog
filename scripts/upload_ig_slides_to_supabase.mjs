#!/usr/bin/env node

/**
 * Upload local IG slide images to Supabase Storage (public) and print public URLs.
 *
 * Env:
 * - IG_BUCKET (default: ig)
 * - PREFIX (default: ig)
 *
 * Args: file paths
 */

import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
if (!SERVICE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function ensureBucket(bucket) {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (buckets?.some((b) => b.name === bucket)) return
  await supabase.storage.createBucket(bucket, { public: true })
}

function mimeFor(file) {
  const ext = path.extname(file).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  return 'image/jpeg'
}

async function main() {
  const bucket = process.env.IG_BUCKET || 'ig'
  const prefix = process.env.PREFIX || 'ig'
  const files = process.argv.slice(2)
  if (!files.length) throw new Error('Usage: node scripts/upload_ig_slides_to_supabase.mjs <file1> <file2> ...')

  await ensureBucket(bucket)

  const out = []
  for (const file of files) {
    const buf = fs.readFileSync(file)
    const base = path.basename(file)
    const key = `${prefix}/${Date.now()}-${base}`

    const { error } = await supabase.storage.from(bucket).upload(key, buf, {
      contentType: mimeFor(file),
      upsert: true,
      cacheControl: '3600',
    })
    if (error) throw error

    const { data } = supabase.storage.from(bucket).getPublicUrl(key)
    out.push({ file, key, url: data.publicUrl })
  }

  console.log(JSON.stringify({ ok: true, bucket, uploaded: out }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
