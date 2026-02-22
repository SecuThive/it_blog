-- ================================================================
-- 오늘의 IT 블로그 Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에서 전체 실행
-- ================================================================

-- ── 댓글 ─────────────────────────────────────────────────────────
create table if not exists public.comments (
  id         uuid        default gen_random_uuid() primary key,
  slug       text        not null,
  nickname   text        not null,
  content    text        not null,
  created_at timestamptz default now() not null
);

alter table public.comments enable row level security;

-- 누구나 읽기 가능
create policy "comments_select" on public.comments
  for select using (true);

-- anon 키로 작성 가능
create policy "comments_insert" on public.comments
  for insert with check (true);

-- 조회 성능 인덱스
create index if not exists comments_slug_idx on public.comments (slug, created_at desc);


-- ── 기부 수입 ─────────────────────────────────────────────────────
create table if not exists public.donation_incomes (
  id             uuid        default gen_random_uuid() primary key,
  date           date        not null,
  donor          text        not null,
  amount         integer     not null check (amount > 0),
  method         text        not null,
  message        text,
  provider       text,
  provider_tx_id text        unique,
  intent_id      uuid,
  created_at     timestamptz default now() not null
);

alter table public.donation_incomes enable row level security;

-- service_role만 읽기/쓰기 (공개 표시는 API에서 필터링)
create policy "donation_incomes_service_only" on public.donation_incomes
  using (auth.role() = 'service_role');


-- ── 기부 지출 ─────────────────────────────────────────────────────
create table if not exists public.donation_expenses (
  id           uuid        default gen_random_uuid() primary key,
  date         date        not null,
  title        text        not null,
  amount       integer     not null check (amount > 0),
  organization text        not null,
  receipt_url  text,
  created_at   timestamptz default now() not null
);

alter table public.donation_expenses enable row level security;

create policy "donation_expenses_service_only" on public.donation_expenses
  using (auth.role() = 'service_role');


-- ── 기부 의도 (가상계좌 결제 흐름) ──────────────────────────────
create table if not exists public.donation_intents (
  id                  uuid        default gen_random_uuid() primary key,
  donor_name          text        not null,
  donor_masked        text        not null,
  amount              integer     not null check (amount > 0),
  message             text,
  status              text        not null default 'pending'
                        check (status in ('pending', 'paid', 'cancelled')),
  provider_intent_id  text,
  depositor_hint      text,
  created_at          timestamptz default now() not null,
  paid_at             timestamptz
);

alter table public.donation_intents enable row level security;

create policy "donation_intents_service_only" on public.donation_intents
  using (auth.role() = 'service_role');


-- ── 기부 계좌 설정 ─────────────────────────────────────────────────
create table if not exists public.donation_virtual_accounts (
  id             uuid        default gen_random_uuid() primary key,
  bank_name      text        not null,
  account_number text        not null,
  account_holder text        not null,
  provider       text        not null,
  payment_method text        not null,
  is_active      boolean     not null default true,
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null
);

alter table public.donation_virtual_accounts enable row level security;

create policy "donation_virtual_accounts_service_only" on public.donation_virtual_accounts
  using (auth.role() = 'service_role');

create unique index if not exists donation_virtual_accounts_active_idx
  on public.donation_virtual_accounts (is_active)
  where is_active = true;
