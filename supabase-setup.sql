-- Guia do Estilo — rode uma vez no Supabase (projeto lumi) > SQL Editor > Run
create table if not exists public.gde_perfumes (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists public.gde_watches  (id text primary key, data jsonb not null, updated_at timestamptz default now());
alter table public.gde_perfumes enable row level security;
alter table public.gde_watches  enable row level security;
grant all on public.gde_perfumes to anon, authenticated;
grant all on public.gde_watches  to anon, authenticated;
create policy gde_perf_all  on public.gde_perfumes for all to anon, authenticated using (true) with check (true);
create policy gde_watch_all on public.gde_watches  for all to anon, authenticated using (true) with check (true);
