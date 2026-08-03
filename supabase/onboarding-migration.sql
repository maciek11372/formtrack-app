-- Uruchom ten plik tylko raz w Supabase SQL Editor.
alter table public.profiles
  add column if not exists age integer check (age between 13 and 100);
