#!/usr/bin/env node

/**
 * Publish an existing IG media container (creationId).
 *
 * Env:
 * - IG_BUSINESS_ID
 * - IG_TOKEN_PATH
 * - CREATION_ID
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
  const creationId = reqEnv('CREATION_ID')
  const token = fs.readFileSync(tokenPath, 'utf8').trim()

  const published = await graphPost(`/${igId}/media_publish`, token, {
    creation_id: creationId,
  })

  console.log(JSON.stringify({ ok: true, published }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
