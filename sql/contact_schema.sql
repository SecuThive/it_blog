-- ================================================================
-- 문의 접수 테이블
-- Supabase 대시보드 → SQL Editor 에서 실행
-- ================================================================

create table if not exists public.contact_submissions (
  id         uuid        default gen_random_uuid() primary key,
  name       text        not null,
  email      text        not null,
  subject    text,
  message    text        not null,
  created_at timestamptz default now() not null
);

alter table public.contact_submissions enable row level security;

-- anon 키로 제출 가능 (문의 폼 전송)
create policy "contact_submissions_insert" on public.contact_submissions
  for insert with check (true);

-- 조회는 service_role 만 (관리자만 확인 가능)
create policy "contact_submissions_select" on public.contact_submissions
  for select using (auth.role() = 'service_role');

-- 인덱스
create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);
