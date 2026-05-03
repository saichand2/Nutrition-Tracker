-- Nutrition Tracker — run this in Supabase SQL Editor after creating a project.
-- 1) Authentication → disable "Confirm email" for quicker local testing (optional).
-- 2) Paste and run the whole script.

-- Goals: one row per user
create table if not exists public.nutrition_goals (
  user_id uuid primary key references auth.users (id) on delete cascade,
  calories numeric not null default 2000,
  protein numeric not null default 150,
  carbs numeric not null default 200,
  fat numeric not null default 65,
  fiber numeric not null default 30,
  updated_at timestamptz default now()
);

create table if not exists public.custom_meals (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  calories numeric not null,
  protein numeric not null,
  carbs numeric not null,
  fat numeric not null,
  fiber numeric not null,
  created_at timestamptz default now()
);

create table if not exists public.log_entries (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date text not null,
  meal_name text not null,
  calories numeric not null,
  protein numeric not null,
  carbs numeric not null,
  fat numeric not null,
  fiber numeric not null,
  custom_meal_id text,
  created_at timestamptz default now()
);

create table if not exists public.exercise_logs (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date text not null,
  group_id text not null,
  exercise_name text not null,
  weight_lbs numeric,
  created_at timestamptz default now()
);

create index if not exists log_entries_user_date_idx on public.log_entries (user_id, entry_date);
create index if not exists custom_meals_user_idx on public.custom_meals (user_id);
create index if not exists exercise_logs_user_date_idx on public.exercise_logs (user_id, entry_date);

alter table public.nutrition_goals enable row level security;
alter table public.custom_meals enable row level security;
alter table public.log_entries enable row level security;
alter table public.exercise_logs enable row level security;

drop policy if exists "nutrition_goals_select_own" on public.nutrition_goals;
drop policy if exists "nutrition_goals_insert_own" on public.nutrition_goals;
drop policy if exists "nutrition_goals_update_own" on public.nutrition_goals;
drop policy if exists "nutrition_goals_delete_own" on public.nutrition_goals;
drop policy if exists "custom_meals_all_own" on public.custom_meals;
drop policy if exists "log_entries_all_own" on public.log_entries;
drop policy if exists "exercise_logs_all_own" on public.exercise_logs;

create policy "nutrition_goals_select_own"
  on public.nutrition_goals for select
  using (auth.uid() = user_id);

create policy "nutrition_goals_insert_own"
  on public.nutrition_goals for insert
  with check (auth.uid() = user_id);

create policy "nutrition_goals_update_own"
  on public.nutrition_goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "nutrition_goals_delete_own"
  on public.nutrition_goals for delete
  using (auth.uid() = user_id);

create policy "custom_meals_all_own"
  on public.custom_meals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "log_entries_all_own"
  on public.log_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "exercise_logs_all_own"
  on public.exercise_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- meal_period column on log_entries (backward-compatible, nullable)
alter table public.log_entries
  add column if not exists meal_period text;

-- Weight logs
create table if not exists public.weight_logs (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date text not null,
  weight_kg numeric not null,
  note text,
  created_at timestamptz default now()
);

create index if not exists weight_logs_user_date_idx on public.weight_logs (user_id, entry_date);

alter table public.weight_logs enable row level security;

create policy "weight_logs_all_own"
  on public.weight_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Push subscriptions
create table if not exists public.push_subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  reminder_config jsonb not null default '{}',
  updated_at timestamptz default now()
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_all_own"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
