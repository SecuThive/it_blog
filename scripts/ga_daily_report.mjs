#!/usr/bin/env node

/**
 * GA4 Daily Report (read-only)
 *
 * Requires:
 * - GA4_PROPERTY_ID (e.g. 385610325)
 * - GA_KEY_PATH (service account key json)
 * - GA data API enabled
 * - Service account email added to GA4 property with Viewer role
 */

import fs from 'node:fs'
import path from 'node:path'
import { BetaAnalyticsDataClient } from '@google-analytics/data'

function reqEnv(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

function yyyyMmDd(d) {
  const dt = new Date(d)
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dateRangeYesterdayKST() {
  // Use Asia/Seoul offset by creating a "now" and formatting by locale is tricky.
  // We'll approximate using UTC date boundaries and accept small drift; for trend, it's fine.
  const now = new Date()
  const end = new Date(now)
  end.setDate(end.getDate() - 1)
  const start = new Date(end)
  return { start: yyyyMmDd(start), end: yyyyMmDd(end) }
}

async function main() {
  const propertyId = reqEnv('GA4_PROPERTY_ID')
  const keyPath = reqEnv('GA_KEY_PATH')

  if (!fs.existsSync(keyPath)) throw new Error(`GA key not found at: ${keyPath}`)

  const client = new BetaAnalyticsDataClient({ keyFilename: keyPath })

  const { start, end } = dateRangeYesterdayKST()

  const property = `properties/${propertyId}`

  const [report] = await client.runReport({
    property,
    dateRanges: [{ startDate: start, endDate: end }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'newUsers' },
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' },
    ],
  })

  const totals = report.rows?.[0]?.metricValues?.map((m) => m.value) || []

  const out = {
    ok: true,
    date: { start, end },
    propertyId,
    totals: {
      activeUsers: Number(totals[0] || 0),
      newUsers: Number(totals[1] || 0),
      sessions: Number(totals[2] || 0),
      pageViews: Number(totals[3] || 0),
      avgSessionSeconds: Number(totals[4] || 0),
    },
  }

  // Top pages (yesterday)
  const [pages] = await client.runReport({
    property,
    dateRanges: [{ startDate: start, endDate: end }],
    dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10,
  })

  out.topPages = (pages.rows || []).map((r) => ({
    path: r.dimensionValues?.[0]?.value || '',
    title: r.dimensionValues?.[1]?.value || '',
    pageViews: Number(r.metricValues?.[0]?.value || 0),
    activeUsers: Number(r.metricValues?.[1]?.value || 0),
  }))

  // Organic vs others (yesterday)
  const [acq] = await client.runReport({
    property,
    dateRanges: [{ startDate: start, endDate: end }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 10,
  })

  out.channels = (acq.rows || []).map((r) => ({
    channel: r.dimensionValues?.[0]?.value || '',
    sessions: Number(r.metricValues?.[0]?.value || 0),
    activeUsers: Number(r.metricValues?.[1]?.value || 0),
  }))

  const outDir = path.join(process.cwd(), 'content', 'analytics')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `ga4-${end}.json`)
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2))

  console.log(JSON.stringify({ ok: true, outPath, summary: out.totals }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
