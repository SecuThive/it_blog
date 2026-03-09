#!/usr/bin/env node

import fs from 'node:fs'

function reqEnv(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

async function graphGet(path, token) {
  const url = `https://graph.facebook.com/v19.0${path}${path.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`
  const res = await fetch(url)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = json?.error?.message || res.statusText
    throw new Error(`${res.status} ${msg}`)
  }
  return json
}

async function main() {
  const pageId = reqEnv('FB_PAGE_ID')
  const igId = reqEnv('IG_BUSINESS_ID')
  const tokenPath = reqEnv('IG_TOKEN_PATH')

  const token = fs.readFileSync(tokenPath, 'utf8').trim()
  if (!token) throw new Error('Empty token')

  const me = await graphGet('/me?fields=id,name', token)
  const pages = await graphGet('/me/accounts?fields=name,id,tasks', token)
  const page = await graphGet(`/${pageId}?fields=id,name`, token)
  const ig = await graphGet(`/${igId}?fields=id,username,name`, token)

  console.log(
    JSON.stringify(
      {
        ok: true,
        tokenUser: me,
        pagesCount: Array.isArray(pages?.data) ? pages.data.length : 0,
        page,
        ig,
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
