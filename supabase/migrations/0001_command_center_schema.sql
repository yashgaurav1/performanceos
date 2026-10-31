-- =====================================================================
-- COMMAND CENTER - 0001 core schema, RLS, indexes, seed exercises
-- RLS rule: auth.uid() is ALWAYS wrapped in a scalar subquery so Postgres
-- evaluates it once per statement (initPlan) instead of once per row.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Shared trigger: keep updated_at fresh
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------
create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  display_name        text,
  body_weight_kg      numeric(5,2) not null default 70.0,
  target_kcal         int not null default 2400,
  target_protein_g    int not null default 140,
  target_carbs_g      int not null default 260,
  target_fat_g        int not null default 75,
  target_sleep_hours  numeric(3,1) not null default 8.0,
  target_study_hours  numeric(3,1) not null default 4.0,
  exam_crunch_mode    boolean not null default false,
  -- Study OS + Budget extensions
  pomodoro_focus_mins       smallint not null default 50 check (pomodoro_focus_mins between 5 and 180),
  pomodoro_short_break_mins smallint not null default 10 check (pomodoro_short_break_mins between 1 and 60),
  pomodoro_long_break_mins  smallint not null default 25 check (pomodoro_long_break_mins between 1 and 90),
  pomodoro_cycles_before_long smallint not null default 4 check (pomodoro_cycles_before_long between 2 and 8),
  currency_code       text not null default 'INR' check (char_length(currency_code) = 3),
  monthly_budget_minor bigint not null default 1500000 check (monthly_budget_minor >= 0),
  rest_days           smallint[] not null default '{0}', -- 0 = Sunday … 6 = Saturday
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_delete_own" on public.profiles for delete using ((select auth.uid()) = id);

-- Auto-provision a profile row on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. daily_logs
-- ---------------------------------------------------------------------
create table public.daily_logs (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  log_date           date not null,
  sleep_hours        numeric(3,1) check (sleep_hours >= 0 and sleep_hours <= 24),
  sleep_quality      smallint check (sleep_quality between 1 and 5),
  study_hours        numeric(4,2) not null default 0 check (study_hours >= 0 and study_hours <= 24),
  active_recall_mins int not null default 0 check (active_recall_mins >= 0),
  mood_score         smallint check (mood_score between 1 and 5),
  energy_score       smallint check (energy_score between 1 and 5),
  body_weight_kg     numeric(5,2),
  wins_list          jsonb not null default '[]'::jsonb,  -- [{ id, text, tag: 'study'|'gym'|'career'|'life' }]
  friction_note      text,
  day_score          smallint not null default 0 check (day_score between 0 and 100),
  score_breakdown    jsonb not null default '{}'::jsonb,  -- { sleep, nutrition, training, study, tasks }
  client_updated_at  timestamptz not null default now(),
  unique (user_id, log_date)
);
create index daily_logs_user_date_idx on public.daily_logs (user_id, log_date desc);

-- ---------------------------------------------------------------------
-- 3. food_entries
-- ---------------------------------------------------------------------
create table public.food_entries (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  log_date         date not null,
  logged_at        timestamptz not null default now(),
  meal_slot        text not null check (meal_slot in ('breakfast','lunch','dinner','snack','post_workout')),
  meal_title       text not null,
  source_type      text not null check (source_type in ('ai_photo','barcode','quick_manual','saved_template')),
  photo_path       text,
  prep_modifier    text not null default 'standard' check (prep_modifier in ('home_dry','standard','canteen_oily')),
  confidence_tier  text not null default 'medium' check (confidence_tier in ('high','medium','low')),
  kcal_point       int not null,
  kcal_low         int not null,
  kcal_high        int not null,
  protein_g        numeric(5,1) not null default 0,
  carbs_g          numeric(5,1) not null default 0,
  fat_g            numeric(5,1) not null default 0,
  fiber_g          numeric(5,1) not null default 0,
  items_breakdown  jsonb not null default '[]'::jsonb,
  constraint food_kcal_range_ok check (kcal_low <= kcal_point and kcal_point <= kcal_high)
);
create index food_entries_user_date_idx on public.food_entries (user_id, log_date desc);

-- ---------------------------------------------------------------------
-- 4. exercises (global catalogue, read-only to users)
-- ---------------------------------------------------------------------
create table public.exercises (
  slug                   text primary key,
  name                   text not null,
  primary_muscle         text not null check (primary_muscle in
                           ('chest','back','quads','hamstrings','glutes','shoulders','side_delts','rear_delts',
                            'biceps','triceps','calves','core')),
  secondary_muscles      text[] not null default '{}',
  equipment              text not null check (equipment in ('barbell','dumbbell','cable','machine','bodyweight')),
  overload_increment_kg  numeric(4,2) not null default 2.5,
  rep_range_min          smallint not null default 6,
  rep_range_max          smallint not null default 10,
  is_compound            boolean not null default true
);
alter table public.exercises enable row level security;
create policy "exercises_read_authenticated" on public.exercises for select to authenticated using (true);

insert into public.exercises
  (slug, name, primary_muscle, secondary_muscles, equipment, overload_increment_kg, rep_range_min, rep_range_max, is_compound) values
  ('barbell-bench-press',     'Barbell Bench Press',      'chest',      '{triceps,shoulders}',      'barbell',   2.5, 5, 8,  true),
  ('incline-db-press',        'Incline DB Press',         'chest',      '{shoulders,triceps}',      'dumbbell',  2.0, 6, 10, true),
  ('machine-chest-press',     'Machine Chest Press',      'chest',      '{triceps,shoulders}',      'machine',   2.5, 8, 12, true),
  ('cable-fly',               'Cable Fly',                'chest',      '{}',                       'cable',     1.25,10, 15, false),
  ('weighted-dip',            'Weighted Dip',             'chest',      '{triceps,shoulders}',      'bodyweight',2.5, 6, 10, true),
  ('overhead-press',          'Overhead Press',           'shoulders',  '{triceps,side_delts}',     'barbell',   1.25,5, 8,  true),
  ('db-lateral-raise',        'DB Lateral Raise',         'side_delts', '{}',                       'dumbbell',  1.0, 10, 20, false),
  ('cable-lateral-raise',     'Cable Lateral Raise',      'side_delts', '{}',                       'cable',     1.25,10, 20, false),
  ('reverse-pec-deck',        'Reverse Pec Deck',         'rear_delts', '{back}',                   'machine',   2.5, 12, 20, false),
  ('barbell-row',             'Barbell Row',              'back',       '{biceps,rear_delts}',      'barbell',   2.5, 6, 10, true),
  ('weighted-pull-up',        'Weighted Pull-Up',         'back',       '{biceps}',                 'bodyweight',1.25,5, 8,  true),
  ('lat-pulldown',            'Lat Pulldown',             'back',       '{biceps}',                 'cable',     2.5, 8, 12, true),
  ('seated-cable-row',        'Seated Cable Row',         'back',       '{biceps,rear_delts}',      'cable',     2.5, 8, 12, true),
  ('chest-supported-db-row',  'Chest-Supported DB Row',   'back',       '{biceps,rear_delts}',      'dumbbell',  2.0, 8, 12, true),
  ('barbell-squat',           'Barbell Back Squat',       'quads',      '{glutes,core}',            'barbell',   2.5, 5, 8,  true),
  ('hack-squat',              'Hack Squat',               'quads',      '{glutes}',                 'machine',   5.0, 6, 10, true),
  ('leg-press',               'Leg Press',                'quads',      '{glutes}',                 'machine',   5.0, 8, 12, true),
  ('leg-extension',           'Leg Extension',            'quads',      '{}',                       'machine',   2.5, 10, 15, false),
  ('romanian-deadlift',       'Romanian Deadlift',        'hamstrings', '{glutes,back}',            'barbell',   2.5, 6, 10, true),
  ('conventional-deadlift',   'Conventional Deadlift',    'back',       '{hamstrings,glutes,quads}','barbell',   5.0, 3, 6,  true),
  ('seated-leg-curl',         'Seated Leg Curl',          'hamstrings', '{}',                       'machine',   2.5, 10, 15, false),
  ('hip-thrust',              'Barbell Hip Thrust',       'glutes',     '{hamstrings}',             'barbell',   5.0, 8, 12, true),
  ('standing-calf-raise',     'Standing Calf Raise',      'calves',     '{}',                       'machine',   5.0, 8, 15, false),
  ('ez-bar-curl',             'EZ-Bar Curl',              'biceps',     '{}',                       'barbell',   1.25,8, 12, false),
  ('incline-db-curl',         'Incline DB Curl',          'biceps',     '{}',                       'dumbbell',  1.0, 8, 12, false),
  ('cable-triceps-pushdown',  'Cable Triceps Pushdown',   'triceps',    '{}',                       'cable',     2.5, 10, 15, false),
  ('overhead-cable-extension','Overhead Cable Extension', 'triceps',    '{}',                       'cable',     1.25,10, 15, false),
  ('cable-crunch',            'Cable Crunch',             'core',       '{}',                       'cable',     2.5, 10, 15, false);

-- ---------------------------------------------------------------------
-- 5. workouts
-- ---------------------------------------------------------------------
create table public.workouts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  log_date          date not null,
  split_name        text not null,
  started_at        timestamptz not null default now(),
  ended_at          timestamptz,
  session_rpe       numeric(3,1) check (session_rpe between 1 and 10),
  notes             text,
  total_volume_kg   numeric(10,2) not null default 0,
  pr_count          smallint not null default 0,
  client_updated_at timestamptz not null default now()
);
create index workouts_user_date_idx on public.workouts (user_id, log_date desc);

-- ---------------------------------------------------------------------
-- 6. workout_sets
-- ---------------------------------------------------------------------
create table public.workout_sets (
  id             uuid primary key default gen_random_uuid(),
  workout_id     uuid not null references public.workouts(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  exercise_slug  text not null references public.exercises(slug),
  set_number     smallint not null,
  set_type       text not null default 'working' check (set_type in ('warmup','working','dropset','failure')),
  weight_kg      numeric(6,2) not null check (weight_kg >= 0),
  reps           smallint not null check (reps >= 0),
  rir            numeric(3,1) check (rir >= 0 and rir <= 10),
  est_1rm        numeric(6,2) not null default 0,
  is_1rm_pr      boolean not null default false,
  is_volume_pr   boolean not null default false,
  completed_at   timestamptz not null default now()
);
create index workout_sets_user_ex_completed_idx on public.workout_sets (user_id, exercise_slug, completed_at desc);
create index workout_sets_workout_idx on public.workout_sets (workout_id);

-- ---------------------------------------------------------------------
-- 7. goals_tasks
-- ---------------------------------------------------------------------
create table public.goals_tasks (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  kind               text not null check (kind in ('quarterly_goal','daily_task')),
  parent_goal_id     uuid references public.goals_tasks(id) on delete set null,
  domain             text not null check (domain in ('study','physique','career','life')),
  title              text not null,
  status             text not null default 'todo' check (status in ('todo','in_progress','done','dropped')),
  is_big_three       boolean not null default false,
  scheduled_date     date,
  due_date           date,
  target_metric_num  numeric(10,2),
  current_metric_num numeric(10,2) default 0,
  metric_unit        text,
  start_metric_num   numeric(10,2) default 0,
  completed_at       timestamptz,
  created_at         timestamptz not null default now()
);
create index goals_tasks_user_sched_status_idx on public.goals_tasks (user_id, scheduled_date, status);
create index goals_tasks_parent_idx on public.goals_tasks (parent_goal_id);

-- Enforce the "Daily Big 3" ceiling server-side too (client shows the swap drawer first)
create or replace function public.enforce_big_three_limit()
returns trigger language plpgsql as $$
begin
  if new.is_big_three and new.kind = 'daily_task' and new.scheduled_date is not null then
    if (select count(*) from public.goals_tasks
         where user_id = new.user_id and scheduled_date = new.scheduled_date
           and is_big_three and kind = 'daily_task' and status <> 'dropped' and id <> new.id) >= 3 then
      raise exception 'BIG_THREE_LIMIT: max 3 Big-3 tasks per day';
    end if;
  end if;
  return new;
end $$;
create trigger goals_tasks_big_three before insert or update on public.goals_tasks
  for each row execute function public.enforce_big_three_limit();

-- ---------------------------------------------------------------------
-- 8. AI tables
-- ---------------------------------------------------------------------
create table public.ai_weekly_reviews (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  week_start_date    date not null,
  overall_grade      text not null,
  telemetry_snapshot jsonb not null default '{}'::jsonb,
  review_payload     jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  unique (user_id, week_start_date)
);

create table public.ai_runs_ledger (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  feature            text not null check (feature in ('food_vision','weekly_review','coach_chat')),
  model_id           text not null,
  input_tokens       int not null default 0,
  output_tokens      int not null default 0,
  estimated_cost_usd numeric(8,5) not null default 0,
  created_at         timestamptz not null default now()
);
create index ai_runs_ledger_user_created_idx on public.ai_runs_ledger (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 9. Study OS - pomodoro / focus sessions
-- ---------------------------------------------------------------------
create table public.study_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  log_date          date not null,
  subject           text not null default 'General',
  mode              text not null check (mode in ('lecture','active_recall','problem_solving','revision','reading')),
  source            text not null default 'pomodoro' check (source in ('pomodoro','stopwatch','manual')),
  started_at        timestamptz not null,
  ended_at          timestamptz not null,
  focus_mins        numeric(6,2) not null check (focus_mins >= 0),
  pomodoros         smallint not null default 0,
  interruptions     smallint not null default 0,
  focus_rating      smallint check (focus_rating between 1 and 5),
  note              text,
  client_updated_at timestamptz not null default now()
);
create index study_sessions_user_date_idx on public.study_sessions (user_id, log_date desc);

-- ---------------------------------------------------------------------
-- 10. Budget Ledger
-- ---------------------------------------------------------------------
create table public.expenses (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  spent_on          date not null,
  amount_minor      bigint not null check (amount_minor > 0),   -- paise / cents
  currency_code     text not null default 'INR',
  category          text not null check (category in
                      ('food','groceries','transport','rent','utilities','education','health','fitness',
                       'shopping','entertainment','subscriptions','social','travel','other')),
  merchant          text,
  note              text,
  payment_method    text not null default 'upi' check (payment_method in ('upi','card','cash','bank','wallet')),
  is_recurring      boolean not null default false,
  client_updated_at timestamptz not null default now()
);
create index expenses_user_date_idx on public.expenses (user_id, spent_on desc);
create index expenses_user_cat_idx on public.expenses (user_id, category, spent_on desc);

create table public.budget_categories (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  category           text not null,
  monthly_limit_minor bigint not null check (monthly_limit_minor >= 0),
  client_updated_at  timestamptz not null default now(),
  unique (user_id, category)
);

-- ---------------------------------------------------------------------
-- RLS for every user-owned table (scalar-subquery auth.uid())
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['daily_logs','food_entries','workouts','workout_sets','goals_tasks',
                           'ai_weekly_reviews','ai_runs_ledger','study_sessions','expenses','budget_categories']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select using ((select auth.uid()) = user_id)', t || '_select_own', t);
    execute format('create policy %I on public.%I for insert with check ((select auth.uid()) = user_id)', t || '_insert_own', t);
    execute format('create policy %I on public.%I for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t || '_update_own', t);
    execute format('create policy %I on public.%I for delete using ((select auth.uid()) = user_id)', t || '_delete_own', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Storage: private meal photo bucket, files namespaced by user id folder
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('meal-photos', 'meal-photos', false)
on conflict (id) do nothing;

create policy "meal_photos_select_own" on storage.objects for select
  using (bucket_id = 'meal-photos' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "meal_photos_insert_own" on storage.objects for insert
  with check (bucket_id = 'meal-photos' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "meal_photos_delete_own" on storage.objects for delete
  using (bucket_id = 'meal-photos' and (select auth.uid())::text = (storage.foldername(name))[1]);
