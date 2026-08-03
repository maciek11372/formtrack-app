create extension if not exists "pgcrypto";
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text, age integer check (age between 13 and 100), sex text check (sex in ('male','female')), birth_date date, height_cm numeric,
  activity_factor numeric default 1.55, goal text default 'utrzymanie', target_weight numeric,
  workouts_per_week int default 3, trend_weight_tolerance numeric default .2,
  trend_measurement_tolerance numeric default .5, rest_timer_seconds int default 90,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  name text not null, muscle_group text not null, is_system boolean default false, created_at timestamptz default now()
);
create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, weekday int, created_at timestamptz default now()
);
create table if not exists public.workout_plan_exercises (
  id uuid primary key default gen_random_uuid(), workout_plan_id uuid references public.workout_plans(id) on delete cascade,
  exercise_id uuid references public.exercises(id), position int not null default 0, target_sets int, target_reps text
);
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  workout_plan_id uuid references public.workout_plans(id) on delete set null, name text not null,
  started_at timestamptz, ended_at timestamptz, notes text, created_at timestamptz default now()
);
create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(), workout_id uuid references public.workouts(id) on delete cascade,
  exercise_id uuid references public.exercises(id), position int default 0, notes text
);
create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(), workout_exercise_id uuid references public.workout_exercises(id) on delete cascade,
  set_number int not null, weight numeric default 0, reps int default 0, rir numeric, created_at timestamptz default now()
);
create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  measured_at date not null, weight numeric, waist numeric, hips numeric, chest numeric, arm numeric,
  forearm numeric, thigh numeric, calf numeric, neck numeric, body_fat numeric, notes text, created_at timestamptz default now()
);
create table if not exists public.nutrition_calculations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  measurement_id uuid references public.body_measurements(id) on delete set null, bmi numeric, bmr numeric, tdee numeric,
  calories numeric, protein_g numeric, fat_g numeric, carbs_g numeric, manually_overridden boolean default false,
  created_at timestamptz default now()
);
create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  measurement_id uuid references public.body_measurements(id) on delete cascade, angle text check(angle in ('front','side','back')),
  storage_path text not null, created_at timestamptz default now()
);
create table if not exists public.personal_records (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid references public.exercises(id), workout_set_id uuid references public.workout_sets(id) on delete set null,
  record_type text not null, value numeric not null, achieved_at timestamptz default now()
);
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, weekday int, time time, enabled boolean default true, created_at timestamptz default now()
);

create index if not exists idx_measurements_user_date on public.body_measurements(user_id, measured_at desc);
create index if not exists idx_workouts_user_date on public.workouts(user_id, started_at desc);
create index if not exists idx_plans_user on public.workout_plans(user_id);

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workouts enable row level security;
alter table public.body_measurements enable row level security;
alter table public.nutrition_calculations enable row level security;
alter table public.progress_photos enable row level security;
alter table public.personal_records enable row level security;
alter table public.reminders enable row level security;

create policy "profiles own" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "exercises own or system" on public.exercises for select using (is_system or auth.uid() = user_id);
create policy "exercises write own" on public.exercises for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "plans own" on public.workout_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workouts own" on public.workouts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "measurements own" on public.body_measurements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "nutrition own" on public.nutrition_calculations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "photos own" on public.progress_photos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "records own" on public.personal_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reminders own" on public.reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.workout_plan_exercises enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;

create policy "plan exercises own" on public.workout_plan_exercises for all
using (exists (select 1 from public.workout_plans where workout_plans.id = workout_plan_exercises.workout_plan_id and workout_plans.user_id = auth.uid()))
with check (exists (select 1 from public.workout_plans where workout_plans.id = workout_plan_exercises.workout_plan_id and workout_plans.user_id = auth.uid()));

create policy "workout exercises own" on public.workout_exercises for all
using (exists (select 1 from public.workouts where workouts.id = workout_exercises.workout_id and workouts.user_id = auth.uid()))
with check (exists (select 1 from public.workouts where workouts.id = workout_exercises.workout_id and workouts.user_id = auth.uid()));

create policy "workout sets own" on public.workout_sets for all
using (exists (select 1 from public.workout_exercises join public.workouts on workouts.id = workout_exercises.workout_id where workout_exercises.id = workout_sets.workout_exercise_id and workouts.user_id = auth.uid()))
with check (exists (select 1 from public.workout_exercises join public.workouts on workouts.id = workout_exercises.workout_id where workout_exercises.id = workout_sets.workout_exercise_id and workouts.user_id = auth.uid()));
