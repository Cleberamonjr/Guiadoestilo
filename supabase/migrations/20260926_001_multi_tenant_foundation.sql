-- Guia do Estilo · Multi-tenant SaaS foundation
-- Migration: 20260926_001_multi_tenant_foundation
--
-- Objetivos:
-- 1. Identidade via Supabase Auth.
-- 2. Isolamento por usuário com RLS.
-- 3. Perfis e planos para Free / Plus / Pro / Admin.
-- 4. Coleções, análises de estilo, curadorias de compra e consumo de IA separados por usuário.
-- 5. Preparação para cobrança recorrente sem colocar segredos de pagamento no navegador.
--
-- IMPORTANTE:
-- Esta migration NÃO apaga nem altera as tabelas legadas gde_perfumes/gde_watches.
-- A aplicação continuará podendo recuperar os dados locais antigos durante a migração.
-- Depois de validar o novo fluxo autenticado, os dados locais serão migrados para as tabelas abaixo.

create extension if not exists pgcrypto;

create table if not exists public.gde_plans (
  code text primary key,
  name text not null,
  monthly_price_cents integer not null default 0 check (monthly_price_cents >= 0),
  currency text not null default 'BRL',
  perfume_limit integer,
  style_analysis_limit integer,
  purchase_search_limit integer,
  ai_credits_limit integer,
  features jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.gde_plans
  (code,name,monthly_price_cents,currency,perfume_limit,style_analysis_limit,purchase_search_limit,ai_credits_limit,features)
values
  ('free','Free',0,'BRL',20,3,3,30,'{"cloud_sync":true,"style_vision":true,"purchase_curator":true,"dupe_finder":true}'::jsonb),
  ('plus','Plus',1990,'BRL',250,30,30,300,'{"cloud_sync":true,"style_vision":true,"purchase_curator":true,"dupe_finder":true,"history":true}'::jsonb),
  ('pro','Pro',3990,'BRL',2000,200,200,2000,'{"cloud_sync":true,"style_vision":true,"purchase_curator":true,"dupe_finder":true,"history":true,"advanced_dna":true,"priority_ai":true}'::jsonb),
  ('admin','Admin',0,'BRL',null,null,null,null,'{"all":true}'::jsonb)
on conflict (code) do update set
  name=excluded.name,
  monthly_price_cents=excluded.monthly_price_cents,
  currency=excluded.currency,
  perfume_limit=excluded.perfume_limit,
  style_analysis_limit=excluded.style_analysis_limit,
  purchase_search_limit=excluded.purchase_search_limit,
  ai_credits_limit=excluded.ai_credits_limit,
  features=excluded.features,
  active=excluded.active;

create table if not exists public.gde_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'pt-BR',
  timezone text not null default 'America/Sao_Paulo',
  currency text not null default 'BRL',
  role text not null default 'user' check (role in ('user','admin','support')),
  plan_code text not null default 'free' references public.gde_plans(code),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gde_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code text not null references public.gde_plans(code),
  provider text not null default 'manual' check (provider in ('manual','stripe','mercadopago')),
  provider_customer_id text,
  provider_subscription_id text,
  status text not null default 'active' check (status in ('trialing','active','past_due','paused','canceled','incomplete','expired')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_subscription_id)
);

create table if not exists public.gde_user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ai_provider text,
  ai_model text,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.gde_user_perfumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id text,
  name text not null,
  brand text,
  concentration text,
  status text not null default 'tenho' check (status in ('tenho','desejo','acabou')),
  data jsonb not null default '{}'::jsonb,
  authoritative_lookup_key text,
  authoritative_lookup_at timestamptz,
  source_confidence text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, client_id)
);

create index if not exists gde_user_perfumes_user_id_idx on public.gde_user_perfumes(user_id);
create index if not exists gde_user_perfumes_lookup_idx on public.gde_user_perfumes(user_id, authoritative_lookup_key);

create table if not exists public.gde_user_watches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id text,
  name text not null,
  brand text,
  status text not null default 'tenho',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, client_id)
);

create index if not exists gde_user_watches_user_id_idx on public.gde_user_watches(user_id);

create table if not exists public.gde_style_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  image_path text,
  style_score numeric(3,1) check (style_score between 0 and 10),
  result jsonb not null default '{}'::jsonb,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists gde_style_analyses_user_id_idx on public.gde_style_analyses(user_id, created_at desc);

create table if not exists public.gde_purchase_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  mode text not null default 'suggest' check (mode in ('candidate','suggest')),
  query jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists gde_purchase_searches_user_id_idx on public.gde_purchase_searches(user_id, created_at desc);

create table if not exists public.gde_ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  ai_credits integer not null default 0 check (ai_credits >= 0),
  style_analyses integer not null default 0 check (style_analyses >= 0),
  purchase_searches integer not null default 0 check (purchase_searches >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

create index if not exists gde_ai_usage_user_id_idx on public.gde_ai_usage(user_id, usage_date desc);

-- Profile creation is server-side and tied to auth.users.
create or replace function public.gde_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.gde_profiles (user_id, display_name, locale, timezone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'locale', 'pt-BR'),
    coalesce(new.raw_user_meta_data ->> 'timezone', 'America/Sao_Paulo')
  )
  on conflict (user_id) do nothing;

  insert into public.gde_user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists gde_on_auth_user_created on auth.users;
create trigger gde_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.gde_handle_new_user();

-- Keep updated_at reliable.
create or replace function public.gde_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists gde_profiles_updated_at on public.gde_profiles;
create trigger gde_profiles_updated_at before update on public.gde_profiles for each row execute procedure public.gde_set_updated_at();

drop trigger if exists gde_subscriptions_updated_at on public.gde_subscriptions;
create trigger gde_subscriptions_updated_at before update on public.gde_subscriptions for each row execute procedure public.gde_set_updated_at();

drop trigger if exists gde_settings_updated_at on public.gde_user_settings;
create trigger gde_settings_updated_at before update on public.gde_user_settings for each row execute procedure public.gde_set_updated_at();

drop trigger if exists gde_perfumes_updated_at on public.gde_user_perfumes;
create trigger gde_perfumes_updated_at before update on public.gde_user_perfumes for each row execute procedure public.gde_set_updated_at();

drop trigger if exists gde_watches_updated_at on public.gde_user_watches;
create trigger gde_watches_updated_at before update on public.gde_user_watches for each row execute procedure public.gde_set_updated_at();

drop trigger if exists gde_usage_updated_at on public.gde_ai_usage;
create trigger gde_usage_updated_at before update on public.gde_ai_usage for each row execute procedure public.gde_set_updated_at();

-- RLS: every user-owned table is isolated by auth.uid().
alter table public.gde_profiles enable row level security;
alter table public.gde_subscriptions enable row level security;
alter table public.gde_user_settings enable row level security;
alter table public.gde_user_perfumes enable row level security;
alter table public.gde_user_watches enable row level security;
alter table public.gde_style_analyses enable row level security;
alter table public.gde_purchase_searches enable row level security;
alter table public.gde_ai_usage enable row level security;

-- Remove broad Data API access from the new private tables.
revoke all on table public.gde_profiles from anon;
revoke all on table public.gde_subscriptions from anon;
revoke all on table public.gde_user_settings from anon;
revoke all on table public.gde_user_perfumes from anon;
revoke all on table public.gde_user_watches from anon;
revoke all on table public.gde_style_analyses from anon;
revoke all on table public.gde_purchase_searches from anon;
revoke all on table public.gde_ai_usage from anon;

grant select, insert, update, delete on table public.gde_profiles to authenticated;
grant select on table public.gde_subscriptions to authenticated;
grant select, insert, update, delete on table public.gde_user_settings to authenticated;
grant select, insert, update, delete on table public.gde_user_perfumes to authenticated;
grant select, insert, update, delete on table public.gde_user_watches to authenticated;
grant select, insert, update, delete on table public.gde_style_analyses to authenticated;
grant select, insert, update, delete on table public.gde_purchase_searches to authenticated;
grant select, insert, update, delete on table public.gde_ai_usage to authenticated;

-- Profiles.
drop policy if exists "Users can read their own profile" on public.gde_profiles;
create policy "Users can read their own profile" on public.gde_profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own profile" on public.gde_profiles;
create policy "Users can create their own profile" on public.gde_profiles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own profile" on public.gde_profiles;
create policy "Users can update their own profile" on public.gde_profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own profile" on public.gde_profiles;
create policy "Users can delete their own profile" on public.gde_profiles
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Generic owner policies.
create or replace function public.gde_apply_owner_policies(target_table text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  execute format('drop policy if exists "Users can read own rows" on public.%I', target_table);
  execute format('drop policy if exists "Users can insert own rows" on public.%I', target_table);
  execute format('drop policy if exists "Users can update own rows" on public.%I', target_table);
  execute format('drop policy if exists "Users can delete own rows" on public.%I', target_table);

  execute format('create policy "Users can read own rows" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', target_table);
  execute format('create policy "Users can insert own rows" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', target_table);
  execute format('create policy "Users can update own rows" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', target_table);
  execute format('create policy "Users can delete own rows" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', target_table);
end;
$$;

select public.gde_apply_owner_policies('gde_subscriptions');
select public.gde_apply_owner_policies('gde_user_settings');
select public.gde_apply_owner_policies('gde_user_perfumes');
select public.gde_apply_owner_policies('gde_user_watches');
select public.gde_apply_owner_policies('gde_style_analyses');
select public.gde_apply_owner_policies('gde_purchase_searches');
select public.gde_apply_owner_policies('gde_ai_usage');

-- Plans are product configuration, not private user data.
alter table public.gde_plans enable row level security;
revoke all on table public.gde_plans from anon;
grant select on table public.gde_plans to authenticated;

drop policy if exists "Authenticated users can read active plans" on public.gde_plans;
create policy "Authenticated users can read active plans" on public.gde_plans
  for select to authenticated
  using (active = true);

-- Remove the temporary policy-builder function from the Data API surface.
revoke all on function public.gde_apply_owner_policies(text) from public, anon, authenticated;

-- Storage bucket for private look photos. Actual files live in Storage, not Postgres.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gde-style-photos',
  'gde-style-photos',
  false,
  8388608,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 8388608,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload their own style photos" on storage.objects;
create policy "Users can upload their own style photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'gde-style-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users can read their own style photos" on storage.objects;
create policy "Users can read their own style photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'gde-style-photos'
  and owner_id = (select auth.uid()::text)
);

drop policy if exists "Users can update their own style photos" on storage.objects;
create policy "Users can update their own style photos"
on storage.objects for update to authenticated
using (
  bucket_id = 'gde-style-photos'
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id = 'gde-style-photos'
  and owner_id = (select auth.uid()::text)
);

drop policy if exists "Users can delete their own style photos" on storage.objects;
create policy "Users can delete their own style photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'gde-style-photos'
  and owner_id = (select auth.uid()::text)
);

-- Backfill profiles for users that may already exist before this migration.
insert into public.gde_profiles (user_id, display_name)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name')
from auth.users
on conflict (user_id) do nothing;

insert into public.gde_user_settings (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- SECURITY NOTE:
-- Never place a Supabase service_role key, Stripe secret, Mercado Pago secret,
-- AI provider secret or webhook signing secret in this GitHub repository or browser code.
-- Those secrets belong in Supabase Edge Functions / server-side environment variables.
