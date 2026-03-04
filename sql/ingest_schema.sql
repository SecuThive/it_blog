-- Ingestion bookkeeping tables (run in Supabase SQL editor)

create table if not exists public.ingest_sources (
  id bigserial primary key,
  name text not null,
  feed_url text not null unique,
  language text not null default 'en',
  category text not null default 'news',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ingest_items (
  id bigserial primary key,
  source_id bigint not null references public.ingest_sources(id) on delete cascade,
  url text not null unique,
  title text not null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_ingest_items_source_id on public.ingest_items(source_id);

-- Lock down with RLS; only service role should write.
alter table public.ingest_sources enable row level security;
alter table public.ingest_items enable row level security;

-- Optional: allow public read of sources
drop policy if exists "ingest_sources_read" on public.ingest_sources;
create policy "ingest_sources_read" on public.ingest_sources
for select to anon, authenticated using (true);

-- No insert/update/delete policies on purpose.
