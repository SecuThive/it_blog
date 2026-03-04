-- DANGER: deletes all content + ingest logs
-- Run in Supabase SQL Editor

begin;

-- content
truncate table public.post_sections restart identity cascade;
truncate table public.comments restart identity cascade;
truncate table public.posts restart identity cascade;

-- ingestion
truncate table public.ingest_items restart identity cascade;
truncate table public.ingest_sources restart identity cascade;

-- donations (optional: comment out if you want to keep)
truncate table public.donation_incomes restart identity cascade;
truncate table public.donation_expenses restart identity cascade;
truncate table public.donation_intents restart identity cascade;
truncate table public.donation_virtual_accounts restart identity cascade;

commit;
