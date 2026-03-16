/**
 * 포스트 제목/description 오염 수정 스크립트
 *
 * 수정 대상:
 * 1. 제목 suffix 패턴 제거
 * 2. 제목 prefix 패턴 제거 ("IT:", "노트북:", "스마트폰:" 등)
 * 3. description 템플릿 prefix 제거
 * 4. description HTML 엔티티 디코딩
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oriwdqftmdspqqjdngmw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaXdkcWZ0bWRzcHFxamRuZ213Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU3MTQxNiwiZXhwIjoyMDg4MTQ3NDE2fQ.QcbZRTyTVEdmDmR29XBHgaSvWQIACLbTsUKGAAzfSmI';

const DRY_RUN = process.argv.includes('--dry-run');
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── 제목 suffix 제거 패턴 (순서 중요: 더 긴 것 먼저) ──────────────────
const TITLE_SUFFIX_PATTERNS = [
  / 업데이트\/이슈 정리: 핵심 변경점과 대응 체크리스트$/,
  / 공개 정리: 핵심 포인트와 추천 체크리스트$/,
  / 정리: 핵심 포인트와 추천 체크리스트$/,
  / 업데이트\/이슈 정리: 핵심 변경점과 대응$/,  // 잘린 버전
  / 공개 정리$/,
  / 정리$/,  // 마지막 수단 - 제목이 "...정리"로 끝나는 경우 (짧을 때만)
];

// ── 제목 prefix 제거 패턴 ─────────────────────────────────────────────
const TITLE_PREFIX_PATTERNS = [
  /^IT:\s*/,
  /^AI:\s*/,
  /^노트북:\s*/,
  /^스마트폰:\s*/,
  /^태블릿:\s*/,
  /^웨어러블:\s*/,
  /^오디오:\s*/,
  /^데스크탑:\s*/,
  /^소프트웨어:\s*/,
];

// ── description prefix 제거 패턴 ─────────────────────────────────────
const DESC_PREFIX_PATTERNS = [
  /^리뷰\/체크리스트:\s*/,
  /^정보 정리\/체크리스트:\s*/,
  /^체크리스트:\s*/,
];

// ── HTML 엔티티 디코딩 ────────────────────────────────────────────────
function decodeHtmlEntities(str) {
  if (!str) return str;
  return str
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8220;/g, '\u201C')
    .replace(/&#8221;/g, '\u201D')
    .replace(/&#8211;/g, '\u2013')
    .replace(/&#8212;/g, '\u2014')
    .replace(/&#38;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
}

function cleanTitle(title) {
  let t = decodeHtmlEntities(title).trim();

  // suffix 제거 (긴 패턴부터)
  for (const pattern of TITLE_SUFFIX_PATTERNS) {
    if (pattern.test(t)) {
      const candidate = t.replace(pattern, '').trim();
      // 너무 짧아지면 스킵 (단순 " 정리" suffix는 10자 이상일 때만 제거)
      if (pattern.source === ' 정리$' && candidate.length < 10) continue;
      t = candidate;
      break; // 하나만 제거
    }
  }

  // prefix 제거
  for (const pattern of TITLE_PREFIX_PATTERNS) {
    if (pattern.test(t)) {
      t = t.replace(pattern, '').trim();
      break;
    }
  }

  return t.trim();
}

function cleanDescription(desc) {
  if (!desc) return desc;
  let d = decodeHtmlEntities(desc).trim();

  for (const pattern of DESC_PREFIX_PATTERNS) {
    if (pattern.test(d)) {
      d = d.replace(pattern, '').trim();
      break;
    }
  }

  return d.trim();
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN 모드 (실제 수정 없음) ===' : '=== 실제 수정 모드 ===');

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, description')
    .order('id', { ascending: true });

  if (error) {
    console.error('조회 실패:', error);
    process.exit(1);
  }

  const toUpdate = [];

  for (const post of posts) {
    const newTitle = cleanTitle(post.title);
    const newDesc = cleanDescription(post.description);

    const titleChanged = newTitle !== post.title;
    const descChanged = newDesc !== post.description;

    if (titleChanged || descChanged) {
      toUpdate.push({
        id: post.id,
        oldTitle: post.title,
        newTitle,
        oldDesc: post.description,
        newDesc,
        titleChanged,
        descChanged,
      });
    }
  }

  console.log(`\n수정 대상: ${toUpdate.length}개 / 전체 ${posts.length}개\n`);

  for (const item of toUpdate) {
    if (item.titleChanged) {
      console.log(`[${item.id}] 제목 수정:`);
      console.log(`  전: ${item.oldTitle}`);
      console.log(`  후: ${item.newTitle}`);
    }
    if (item.descChanged) {
      console.log(`[${item.id}] description 수정:`);
      console.log(`  전: ${item.oldDesc}`);
      console.log(`  후: ${item.newDesc}`);
    }
    console.log('');
  }

  if (DRY_RUN) {
    console.log('DRY RUN 완료. 실제 적용하려면 --dry-run 없이 실행하세요.');
    return;
  }

  // 실제 업데이트
  let successCount = 0;
  let failCount = 0;

  for (const item of toUpdate) {
    const updatePayload = {};
    if (item.titleChanged) updatePayload.title = item.newTitle;
    if (item.descChanged) updatePayload.description = item.newDesc;

    const { error: updateError } = await supabase
      .from('posts')
      .update(updatePayload)
      .eq('id', item.id);

    if (updateError) {
      console.error(`[${item.id}] 업데이트 실패:`, updateError.message);
      failCount++;
    } else {
      successCount++;
    }
  }

  console.log(`\n✅ 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
}

main().catch(console.error);
