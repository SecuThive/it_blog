#!/usr/bin/env node

/**
 * Exchange a short-lived Facebook User Access Token for a long-lived token.
 *
 * Usage:
 *   META_APP_ID_PATH=... META_APP_SECRET_PATH=... SHORT_TOKEN_PATH=... OUT_PATH=... node scripts/ig_exchange_long_lived_token.mjs
 */

import fs from 'node:fs'

function reqEnv(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

async function main() {
  const appIdPath = reqEnv('META_APP_ID_PATH')
  const appSecretPath = reqEnv('META_APP_SECRET_PATH')
  const shortTokenPath = reqEnv('SHORT_TOKEN_PATH')
  const outPath = process.env.OUT_PATH || '/Users/macthive/.openclaw/secrets/ig_access_token_long_lived.txt'

  const clientId = fs.readFileSync(appIdPath, 'utf8').trim()
  const clientSecret = fs.readFileSync(appSecretPath, 'utf8').trim()
  const shortToken = fs.readFileSync(shortTokenPath, 'utf8').trim()

  if (!clientId || !clientSecret || !shortToken) throw new Error('Empty app id/secret/token')

  const url = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
  url.searchParams.set('grant_type', 'fb_exchange_token')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('client_secret', clientSecret)
  url.searchParams.set('fb_exchange_token', shortToken)

  const res = await fetch(url)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = json?.error?.message || res.statusText
    throw new Error(`${res.status} ${msg}`)
  }

  const longToken = json.access_token
  const expiresIn = json.expires_in
  if (!longToken) throw new Error('No access_token returned')

  fs.writeFileSync(outPath, longToken + '\n')
  console.log(
    JSON.stringify(
      {
        ok: true,
        outPath,
        expiresInSeconds: expiresIn,
      },
      null,
      2,
    ),
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
