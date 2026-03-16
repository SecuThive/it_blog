/**
 * 태그 대소문자 충돌 수정 스크립트
 * - "AI" → "ai" 로 통합 (소문자 기준)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oriwdqftmdspqqjdngmw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaXdkcWZ0bWRzcHFxamRuZ213Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU3MTQxNiwiZXhwIjoyMDg4MTQ3NDE2fQ.QcbZRTyTVEdmDmR29XBHgaSvWQIACLbTsUKGAAzfSmI';

const DRY_RUN = process.argv.includes('--dry-run');
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// 통합 규칙: { 잘못된값: 올바른값 }
const TAG_NORMALIZE = {
  'AI': 'ai',
  'Google': 'google',
  'Samsung': 'samsung',
  'Apple': 'apple',
};

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== 실제 수정 ===');

  const { data: posts } = await supabase.from('posts').select('id, tags');

  const toUpdate = [];

  for (const post of posts || []) {
    if (!Array.isArray(post.tags)) continue;

    let changed = false;
    const newTags = post.tags.map(tag => {
      const normalized = TAG_NORMALIZE[tag];
      if (normalized && !post.tags.includes(normalized)) {
        changed = true;
        return normalized;
      }
      if (normalized && post.tags.includes(normalized)) {
        // 이미 올바른 버전이 있으면 중복 제거
        changed = true;
        return null; // 나중에 필터
      }
      return tag;
    }).filter(Boolean);

    // 중복 제거
    const dedupedTags = [...new Set(newTags)];
    const finalChanged = JSON.stringify(post.tags.sort()) !== JSON.stringify(dedupedTags.sort());

    if (finalChanged) {
      toUpdate.push({ id: post.id, oldTags: post.tags, newTags: dedupedTags });
    }
  }

  console.log(`\n수정 대상: ${toUpdate.length}개`);
  for (const item of toUpdate) {
    console.log(`  [${item.id}] ${JSON.stringify(item.oldTags)} → ${JSON.stringify(item.newTags)}`);
  }

  if (DRY_RUN) {
    console.log('\nDRY RUN 완료.');
    return;
  }

  let success = 0, fail = 0;
  for (const item of toUpdate) {
    const { error } = await supabase.from('posts').update({ tags: item.newTags }).eq('id', item.id);
    if (error) { console.error(`[${item.id}] 실패:`, error.message); fail++; }
    else success++;
  }

  console.log(`\n✅ 완료: 성공 ${success}개, 실패 ${fail}개`);
}

main().catch(console.error);
