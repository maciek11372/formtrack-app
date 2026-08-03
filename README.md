# FormTrack

Wersja z prawdziwym logowaniem Supabase, onboardingiem po pierwszym zalogowaniu i pustymi danymi użytkownika.

## Aktualizacja istniejącej bazy
Uruchom w Supabase SQL Editor plik `supabase/onboarding-migration.sql`.

## Uruchomienie
1. Skopiuj `.env.example` do `.env.local` i wpisz dane Supabase.
2. `npm install`
3. `npm run dev`

Po pierwszym zalogowaniu użytkownik podaje imię, wiek, wzrost i aktualną wagę. Waga zapisuje się jako pierwszy rekord w `body_measurements`.
