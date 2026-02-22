create table if not exists public.donation_intents (
  id uuid primary key default gen_random_uuid(),
  donor_name text not null,
  donor_masked text not null,
  amount integer not null check (amount > 0),
  message text,
  status text not null default 'pending',
  provider text not null,
  provider_intent_id text unique,
  depositor_hint text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.donation_incomes (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  donor text not null,
  amount integer not null check (amount > 0),
  method text not null,
  message text,
  provider text not null,
  provider_tx_id text unique,
  intent_id uuid references public.donation_intents(id),
  created_at timestamptz not null default now()
);

create table if not exists public.donation_expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  title text not null,
  amount integer not null check (amount > 0),
  organization text not null,
  receipt_url text,
  created_at timestamptz not null default now()
);

create index if not exists donation_incomes_date_idx on public.donation_incomes (date desc);
create index if not exists donation_expenses_date_idx on public.donation_expenses (date desc);
create index if not exists donation_intents_status_idx on public.donation_intents (status);

create table if not exists public.donation_virtual_accounts (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null,
  account_number text not null,
  account_holder text not null,
  provider text not null,
  payment_method text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists donation_virtual_accounts_active_idx
  on public.donation_virtual_accounts (is_active)
  where is_active = true;
