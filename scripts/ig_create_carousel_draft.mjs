#!/usr/bin/env node

/**
 * Create an Instagram carousel draft (no publish) via Instagram Graph API.
 *
 * Env:
 * - IG_BUSINESS_ID
 * - IG_TOKEN_PATH
 * - CAPTION
 * - IMAGE_URLS (comma-separated public URLs)
 */

import fs from 'node:fs'

function reqEnv(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

async function graphPost(path, token, params) {
  const url = new URL(`https://graph.facebook.com/v19.0${path}`)
  url.searchParams.set('access_token', token)

  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) body.set(k, String(v))

  const res = await fetch(url, { method: 'POST', body })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = json?.error?.message || res.statusText
    throw new Error(`${res.status} ${msg}`)
  }
  return json
}

async function main() {
  const igId = reqEnv('IG_BUSINESS_ID')
  const tokenPath = reqEnv('IG_TOKEN_PATH')
  const caption = process.env.CAPTION || ''
  const imageUrls = reqEnv('IMAGE_URLS')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const token = fs.readFileSync(tokenPath, 'utf8').trim()

  if (imageUrls.length < 2) throw new Error('Need at least 2 IMAGE_URLS for carousel')

  // 1) create children media containers
  const childIds = []
  for (const u of imageUrls) {
    const child = await graphPost(`/${igId}/media`, token, {
      image_url: u,
      is_carousel_item: 'true',
    })
    childIds.push(child.id)
  }

  // 2) create carousel container
  const carousel = await graphPost(`/${igId}/media`, token, {
    media_type: 'CAROUSEL',
    children: childIds.join(','),
    caption,
  })

  console.log(JSON.stringify({ ok: true, childIds, creationId: carousel.id }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
