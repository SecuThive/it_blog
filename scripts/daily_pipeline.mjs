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

function run(cmd, args, env = {}) {
  const res = spawnSync(cmd, args, {
    stdio: 'inherit',
    env: { ...process.env, ...env },
  })
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed with code ${res.status}`)
  }
}

function main() {
  const maxPosts = Number.parseInt(process.env.MAX_POSTS || '3', 10) || 3

  run('node', ['scripts/ingest.mjs'], { MAX_POSTS: String(maxPosts) })
  run('node', ['scripts/enforce_sources_format.mjs'])
  run('node', ['scripts/restore_faq_accordion_format.mjs'])
  run('node', ['scripts/cleanup_titles_seo.mjs'])

  // Must be last: if this fails, alert/cron should surface it.
  run('node', ['scripts/validate_guide_conformance.mjs'])
}

main()
