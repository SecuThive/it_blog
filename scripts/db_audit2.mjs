import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oriwdqftmdspqqjdngmw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaXdkcWZ0bWRzcHFxamRuZ213Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU3MTQxNiwiZXhwIjoyMDg4MTQ3NDE2fQ.QcbZRTyTVEdmDmR29XBHgaSvWQIACLbTsUKGAAzfSmI';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  // 1. description 짧은 포스트 상세
  const { data: allPosts } = await supabase.from('posts').select('id, title, description, category, tags, cover_image_url').order('created_at', { ascending: false });

  const shortDesc = (allPosts || []).filter(p => (p.description || '').length < 50);
  console.log('=== description 짧은 포스트 (<50자) ===');
  for (const p of shortDesc) {
    console.log(`  [${p.id}] "${p.description}" (${(p.description||'').length}자)`);
    console.log(`    제목: ${p.title}`);
  }

  // 2. 제목에 패턴이 있는지 체크 ("업데이트/이슈 정리" 같은 suffix)
  const titlePatterns = [
    '업데이트/이슈 정리',
    '핵심 변경점',
    '대응 체크리스트',
    'IT:',
  ];
  for (const pattern of titlePatterns) {
    const matched = (allPosts || []).filter(p => p.title.includes(pattern));
    console.log(`\n제목에 "${pattern}" 포함된 포스트: ${matched.length}개`);
    if (matched.length > 0 && matched.length <= 5) {
      for (const p of matched.slice(0, 3)) {
        console.log(`  [${p.id}] ${p.title.slice(0, 80)}`);
      }
    } else if (matched.length > 5) {
      for (const p of matched.slice(0, 3)) {
        console.log(`  [${p.id}] ${p.title.slice(0, 80)}`);
      }
      console.log(`  ... 외 ${matched.length - 3}개`);
    }
  }

  // 3. 태그 대소문자 불일치 체크
  const { data: tagRows } = await supabase.from('posts').select('id, tags');
  const tagVariants = {};
  for (const r of tagRows || []) {
    for (const t of (r.tags || [])) {
      const lower = t.toLowerCase();
      if (!tagVariants[lower]) tagVariants[lower] = new Set();
      tagVariants[lower].add(t);
    }
  }
  const conflicts = Object.entries(tagVariants).filter(([, variants]) => variants.size > 1);
  console.log(`\n=== 태그 대소문자 충돌 (${conflicts.length}개) ===`);
  for (const [lower, variants] of conflicts) {
    console.log(`  "${lower}": ${[...variants].join(', ')}`);
  }

  // 4. cover 없는 포스트 상세 목록
  const noCoverPosts = (allPosts || []).filter(p => !p.cover_image_url);
  console.log(`\n=== cover 없는 포스트 (${noCoverPosts.length}개) ===`);
  for (const p of noCoverPosts) {
    console.log(`  [${p.id}] [${p.category}] ${p.title.slice(0, 60)}`);
  }

  // 5. 카테고리 slug와 일치하는 불필요 태그
  const categoryTags = ['ai', 'it-news', 'laptop', 'smartphone', 'software', 'tablet', 'wearable', 'audio', 'desktop'];
  console.log('\n=== 카테고리명과 동일한 태그 사용 포스트 ===');
  for (const cat of categoryTags) {
    const matched = (allPosts || []).filter(p => (p.tags || []).includes(cat));
    if (matched.length > 0) {
      console.log(`  태그 "${cat}": ${matched.length}개 포스트`);
    }
  }

  // 6. 태그가 없거나 1개 이하인 포스트
  const fewTags = (allPosts || []).filter(p => (p.tags || []).length <= 1);
  console.log(`\n태그 1개 이하 포스트: ${fewTags.length}개`);
  for (const p of fewTags) {
    console.log(`  [${p.id}] tags:[${(p.tags||[]).join(',')}] ${p.title.slice(0, 50)}`);
  }
}

main().catch(console.error);
