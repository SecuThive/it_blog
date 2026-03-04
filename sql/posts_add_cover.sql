-- Add cover image + source url fields for better listings (run in Supabase SQL editor)
alter table public.posts add column if not exists cover_image_url text;
alter table public.posts add column if not exists source_url text;

-- Optional index for filtering
create index if not exists idx_posts_category_created_at on public.posts(category, created_at desc);
