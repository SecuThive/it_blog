import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oriwdqftmdspqqjdngmw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaXdkcWZ0bWRzcHFxamRuZ213Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU3MTQxNiwiZXhwIjoyMDg4MTQ3NDE2fQ.QcbZRTyTVEdmDmR29XBHgaSvWQIACLbTsUKGAAzfSmI';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  // 1. 포스트 총 개수
  const { count: totalCount } = await supabase.from('posts').select('*', { count: 'exact', head: true });
  console.log(`\n총 포스트 수: ${totalCount}`);

  // 2. cover 없는 포스트
  const { count: noCoverCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).is('cover_image_url', null);
  console.log(`cover 없는 포스트: ${noCoverCount}`);

  // 3. source_url 없는 포스트
  const { count: noSourceCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).is('source_url', null);
  console.log(`source_url 없는 포스트: ${noSourceCount}`);

  // 4. featured 포스트
  const { count: featuredCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('featured', true);
  console.log(`featured 포스트: ${featuredCount}`);

  // 5. 카테고리별 분포
  const { data: allCats } = await supabase.from('posts').select('category');
  const catMap = {};
  for (const r of allCats || []) {
    catMap[r.category] = (catMap[r.category] || 0) + 1;
  }
  console.log('\n=== 카테고리별 분포 ===');
  for (const [k, v] of Object.entries(catMap).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}개`);
  }

  // 6. 태그 분포 TOP 20
  const { data: allTags } = await supabase.from('posts').select('tags');
  const tagMap = {};
  for (const r of allTags || []) {
    for (const t of (r.tags || [])) {
      tagMap[t] = (tagMap[t] || 0) + 1;
    }
  }
  const sortedTags = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 20);
  console.log('\n=== 태그 TOP 20 ===');
  for (const [t, c] of sortedTags) {
    console.log(`  ${t}: ${c}개`);
  }

  // 7. 최근 포스트 10개 상태 체크
  const { data: recent } = await supabase
    .from('posts')
    .select('id, slug, title, category, tags, cover_image_url, source_url, featured, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('\n=== 최근 포스트 10개 ===');
  for (const p of recent || []) {
    const flags = [
      p.cover_image_url ? 'cover:O' : 'cover:X',
      p.source_url ? 'src:O' : 'src:X',
      p.featured ? 'featured' : '',
      `tags:${(p.tags || []).length}개`,
    ].filter(Boolean).join(' | ');
    console.log(`  [${p.id}] ${p.category} | ${flags}`);
    console.log(`    ${p.title}`);
  }

  // 8. 섹션 없는 포스트 (content 없는 포스트)
  const { data: postsWithSections } = await supabase.from('post_sections').select('post_id');
  const postIdsWithSections = new Set((postsWithSections || []).map(r => r.post_id));
  const { data: allPostIds } = await supabase.from('posts').select('id, title').order('created_at', { ascending: false });
  const postsWithoutSections = (allPostIds || []).filter(p => !postIdsWithSections.has(p.id));
  console.log(`\n섹션 없는 포스트: ${postsWithoutSections.length}개`);
  if (postsWithoutSections.length > 0 && postsWithoutSections.length <= 10) {
    for (const p of postsWithoutSections) {
      console.log(`  [${p.id}] ${p.title}`);
    }
  }

  // 9. description 짧은 포스트 (50자 미만)
  const { data: allDescs } = await supabase.from('posts').select('id, title, description').order('created_at', { ascending: false });
  const shortDesc = (allDescs || []).filter(p => (p.description || '').length < 50);
  console.log(`\ndescription 짧은 포스트 (<50자): ${shortDesc.length}개`);

  // 10. 날짜별 포스트 수 (최근 2주)
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('created_at')
    .gte('created_at', twoWeeksAgo)
    .order('created_at', { ascending: false });
  const dayMap = {};
  for (const r of recentPosts || []) {
    const day = r.created_at.slice(0, 10);
    dayMap[day] = (dayMap[day] || 0) + 1;
  }
  console.log('\n=== 최근 2주 날짜별 포스트 수 ===');
  for (const [d, c] of Object.entries(dayMap).sort().reverse()) {
    console.log(`  ${d}: ${c}개`);
  }
}

main().catch(console.error);
