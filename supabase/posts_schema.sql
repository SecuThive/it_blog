-- ================================================================
-- 포스트 테이블 생성
-- Supabase 대시보드 → SQL Editor 에서 실행
-- ================================================================

create table if not exists public.posts (
  id           serial       primary key,
  slug         text         not null unique,
  title        text         not null,
  description  text         not null,
  category     text         not null check (category in ('smartphone','laptop','review','deal')),
  tags         text[]       not null default '{}',
  created_at   timestamptz  not null,
  read_minutes integer      not null,
  author       text         not null default 'DevThive',
  featured     boolean      not null default false
);

create table if not exists public.post_sections (
  id       serial  primary key,
  post_id  integer not null references public.posts(id) on delete cascade,
  position integer not null,
  heading  text    not null,
  content  text    not null
);

-- RLS
alter table public.posts enable row level security;
alter table public.post_sections enable row level security;

-- 누구나 읽기 가능
create policy "posts_select" on public.posts for select using (true);
create policy "post_sections_select" on public.post_sections for select using (true);

-- 인덱스
create index if not exists posts_category_idx on public.posts (category);
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_slug_idx on public.posts (slug);
create index if not exists post_sections_post_id_idx on public.post_sections (post_id, position);
