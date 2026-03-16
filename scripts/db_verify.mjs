import { createClient } from '@supabase/supabase-js';

const s = createClient(
  'https://oriwdqftmdspqqjdngmw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaXdkcWZ0bWRzcHFxamRuZ213Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU3MTQxNiwiZXhwIjoyMDg4MTQ3NDE2fQ.QcbZRTyTVEdmDmR29XBHgaSvWQIACLbTsUKGAAzfSmI'
);

const { data } = await s.from('posts').select('id, title, description, tags').order('created_at', { ascending: false });

// 1. 제목 잔여 오염
const dirtyTitles = data.filter(p =>
  p.title.includes('업데이트/이슈 정리') ||
  p.title.includes('핵심 변경점과 대응 체크리스트') ||
  p.title.includes('공개 정리: 핵심 포인트') ||
  /^(IT|AI|노트북|스마트폰|태블릿):\s/.test(p.title)
);
console.log('제목 오염 잔여:', dirtyTitles.length + '개');
for (const p of dirtyTitles) console.log('  [' + p.id + '] ' + p.title);

// 2. description 잔여 오염
const dirtyDescs = data.filter(p =>
  p.description && (
    p.description.startsWith('리뷰/체크리스트:') ||
    p.description.startsWith('정보 정리/체크리스트:') ||
    p.description.includes('&#')
  )
);
console.log('\ndescription 오염 잔여:', dirtyDescs.length + '개');
for (const p of dirtyDescs) console.log('  [' + p.id + '] ' + p.description);

// 3. 태그 충돌
const tagVariants = {};
for (const r of data) {
  for (const t of (r.tags || [])) {
    const lower = t.toLowerCase();
    if (tagVariants[lower] === undefined) tagVariants[lower] = new Set();
    tagVariants[lower].add(t);
  }
}
const conflicts = Object.entries(tagVariants).filter(([, v]) => v.size > 1);
console.log('\n태그 대소문자 충돌 잔여:', conflicts.length + '개');
for (const [k, v] of conflicts) console.log('  "' + k + '": ' + [...v].join(', '));

// 4. 최근 포스트 5개 제목
console.log('\n최근 포스트 5개 제목:');
for (const p of data.slice(0, 5)) console.log('  [' + p.id + '] ' + p.title);
