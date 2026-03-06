#!/usr/bin/env node

/**
 * Daily pipeline:
 * 1) Ingest N posts from RSS feeds into Supabase
 * 2) Enforce 출처 section format (single canonical source)
 * 3) Restore FAQ accordion-friendly format
 * 4) Cleanup titles (SEO readability)
 * 5) Validate POSTING_GUIDE conformance; exit non-zero on failure
 */

import { spawnSync } from 'node:child_process'

function run(cmd, args, env = {}, opts = {}) {
  const res = spawnSync(cmd, args, {
    stdio: opts.pipe ? 'pipe' : 'inherit',
    env: { ...process.env, ...env },
    encoding: 'utf8',
  })
  if (res.status !== 0) {
    const errOut = (res.stderr || '').toString().slice(-4000)
    throw new Error(`${cmd} ${args.join(' ')} failed with code ${res.status}\n${errOut}`)
  }
  return res
}

function main() {
  const maxPosts = Number.parseInt(process.env.MAX_POSTS || '3', 10) || 3

  // 1) Ingest and capture created post ids
  const ingestRes = run('node', ['scripts/ingest.mjs'], { MAX_POSTS: String(maxPosts) }, { pipe: true })
  process.stdout.write(ingestRes.stdout)
  process.stderr.write(ingestRes.stderr)

  let createdPostIds = []
  try {
    const json = JSON.parse(String(ingestRes.stdout || '').trim())
    createdPostIds = json.createdPostIds || []
  } catch {
    // If parsing fails, proceed without targeted upgrade.
    createdPostIds = []
  }

  // 2) Normalize DB fields that often drift
  run('node', ['scripts/enforce_sources_format.mjs'])
  run('node', ['scripts/restore_faq_accordion_format.mjs'])
  run('node', ['scripts/cleanup_titles_seo.mjs'])

  // 3) Quality gate: rewrite newly created posts into higher-quality Korean templates.
  // We run the upgrader only for the new posts to avoid heavy rewrites every day.
  if (createdPostIds.length) {
    run('node', ['scripts/upgrade_posts_quality.mjs'], { POST_IDS: createdPostIds.join(',') })
    // Re-normalize after rewrite
    run('node', ['scripts/enforce_sources_format.mjs'])
    run('node', ['scripts/restore_faq_accordion_format.mjs'])
    run('node', ['scripts/cleanup_titles_seo.mjs'])
  }

  // 4) Validate guide conformance; fails pipeline if anything breaks.
  run('node', ['scripts/validate_guide_conformance.mjs'])
}

main()
