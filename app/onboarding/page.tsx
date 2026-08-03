"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Dumbbell,
  Gauge,
  Ruler,
  Target,
  UserRound,
  Weight,
} from "lucide-react";

import { createClient } from "@/lib/supabase-client";

const steps = [
  "Imię",
  "Data urodzenia",
  "Płeć",
  "Wzrost",
  "Waga",
  "Aktywność",
  "Treningi",
  "Cel",
  "Tryb kalorii",
];

type SexForCalculation = "male" | "female";
type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "high"
  | "very_high";
type Goal = "lose" | "maintain" | "gain";
type CalorieMode = "fixed" | "dynamic";

type ProfileData = {
  name: string | null;
  birth_date: string | null;
  sex_for_calculation: SexForCalculation | null;
  height_cm: number | null;
  activity_level: ActivityLevel | null;
  workouts_per_week: number | null;
  goal: Goal | null;
  target_weight: number | null;
  weekly_rate_percent: number | null;
  calorie_mode: CalorieMode | null;
};

const activityOptions: Array<{
  value: ActivityLevel;
  label: string;
  description: string;
  factor: number;
}> = [
  {
    value: "sedentary",
    label: "Głównie siedzący",
    description: "Praca siedząca, mało ruchu poza treningami",
    factor: 1.2,
  },
  {
    value: "light",
    label: "Lekko aktywny",
    description: "Trochę chodzenia i zwykła aktywność w ciągu dnia",
    factor: 1.35,
  },
  {
    value: "moderate",
    label: "Umiarkowanie aktywny",
    description: "Regularny ruch, dużo chodzenia lub aktywna praca",
    factor: 1.5,
  },
  {
    value: "high",
    label: "Bardzo aktywny",
    description: "Dużo ruchu każdego dnia lub praca fizyczna",
    factor: 1.7,
  },
  {
    value: "very_high",
    label: "Wyjątkowo aktywny",
    description: "Bardzo ciężka praca fizyczna i wysoka aktywność",
    factor: 1.9,
  },
];

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState<SexForCalculation | "">("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | "">("");
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState("");
  const [goal, setGoal] = useState<Goal | "">("");
  const [targetWeight, setTargetWeight] = useState("");
  const [weeklyRatePercent, setWeeklyRatePercent] = useState("0.5");
  const [calorieMode, setCalorieMode] = useState<CalorieMode>("fixed");

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      const supabase = createClient();

      if (!supabase) {
        router.replace("/auth");
        return;
      }

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (!active) return;

      if (authError || !authData.user) {
        router.replace("/auth");
        return;
      }

      setUserId(authData.user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(
          "name, birth_date, sex_for_calculation, height_cm, activity_level, workouts_per_week, goal, target_weight, weekly_rate_percent, calorie_mode"
        )
        .eq("id", authData.user.id)
        .maybeSingle();

      if (!active) return;

      if (profileError) {
        setError(`Błąd pobierania profilu: ${profileError.message}`);
        setLoading(false);
        return;
      }

      if (isProfessionalProfileComplete(profile as ProfileData | null)) {
        router.replace("/");
        return;
      }

      if (profile?.name) setName(profile.name);
      if (profile?.birth_date) setBirthDate(profile.birth_date);
      if (profile?.sex_for_calculation) setSex(profile.sex_for_calculation);
      if (profile?.height_cm) setHeight(String(profile.height_cm));
      if (profile?.activity_level) setActivityLevel(profile.activity_level);
      if (profile?.workouts_per_week != null) {
        setWorkoutsPerWeek(String(profile.workouts_per_week));
      }
      if (profile?.goal) setGoal(profile.goal);
      if (profile?.target_weight != null) {
        setTargetWeight(String(profile.target_weight));
      }
      if (profile?.weekly_rate_percent != null) {
        setWeeklyRatePercent(String(profile.weekly_rate_percent));
      }
      if (profile?.calorie_mode) setCalorieMode(profile.calorie_mode);

      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  const age = getAge(birthDate);
  const normalizedWeight = parseDecimal(weight);
  const normalizedHeight = Number(height);
  const normalizedTargetWeight = parseDecimal(targetWeight);
  const normalizedWorkouts = Number(workoutsPerWeek);
  const normalizedRate = parseDecimal(weeklyRatePercent);

  const selectedActivity = activityOptions.find(
    (option) => option.value === activityLevel
  );

  const estimates = useMemo(() => {
    if (
      !sex ||
      age < 13 ||
      !Number.isFinite(normalizedWeight) ||
      !Number.isFinite(normalizedHeight) ||
      !selectedActivity ||
      !goal
    ) {
      return null;
    }

    const bmr = calculateBmr(
      sex,
      normalizedWeight,
      normalizedHeight,
      age
    );

    const maintenance =
      calorieMode === "dynamic"
        ? bmr * 1.2
        : bmr * selectedActivity.factor;

    const dailyAdjustment =
      goal === "maintain"
        ? 0
        : Math.round(
            (normalizedWeight * (normalizedRate / 100) * 7700) / 7
          );

    const calories =
      goal === "lose"
        ? maintenance - dailyAdjustment
        : goal === "gain"
          ? maintenance + dailyAdjustment
          : maintenance;

    const proteinPerKg =
      goal === "lose" ? 2 : goal === "gain" ? 1.8 : 1.8;
    const fatPerKg = goal === "lose" ? 0.8 : 0.9;

    const protein = Math.round(normalizedWeight * proteinPerKg);
    const fat = Math.round(normalizedWeight * fatPerKg);
    const carbs = Math.max(
      0,
      Math.round((calories - protein * 4 - fat * 9) / 4)
    );

    return {
      bmr: Math.round(bmr),
      maintenance: Math.round(maintenance),
      calories: Math.max(1200, Math.round(calories)),
      protein,
      fat,
      carbs,
    };
  }, [
    sex,
    age,
    normalizedWeight,
    normalizedHeight,
    selectedActivity,
    goal,
    normalizedRate,
    calorieMode,
  ]);

  const validSteps = [
    name.trim().length >= 2,
    birthDate.length > 0 && age >= 13 && age <= 100,
    sex === "male" || sex === "female",
    normalizedHeight >= 120 && normalizedHeight <= 230,
    normalizedWeight >= 30 && normalizedWeight <= 350,
    Boolean(activityLevel),
    Number.isInteger(normalizedWorkouts) &&
      normalizedWorkouts >= 0 &&
      normalizedWorkouts <= 14,
    Boolean(goal) &&
      normalizedTargetWeight >= 30 &&
      normalizedTargetWeight <= 350 &&
      (goal === "maintain" ||
        (normalizedRate >= 0.1 && normalizedRate <= 1)),
    calorieMode === "fixed" || calorieMode === "dynamic",
  ];

  const valid = validSteps[step] ?? false;

  async function finish() {
    if (!userId || !sex || !activityLevel || !goal || !estimates) {
      setError("Brakuje danych potrzebnych do zapisania profilu.");
      return;
    }

    setSaving(true);
    setError("");

    const supabase = createClient();

    if (!supabase) {
      setError("Nie udało się połączyć z Supabase.");
      setSaving(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        name: name.trim(),
        birth_date: birthDate,
        sex_for_calculation: sex,
        height_cm: normalizedHeight,
        activity_level: activityLevel,
        workouts_per_week: normalizedWorkouts,
        goal,
        target_weight: normalizedTargetWeight,
        weekly_rate_percent: goal === "maintain" ? 0 : normalizedRate,
        calorie_mode: calorieMode,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      setError(`Błąd zapisu profilu: ${profileError.message}`);
      setSaving(false);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const { data: existingMeasurement } = await supabase
      .from("body_measurements")
      .select("id")
      .eq("user_id", userId)
      .eq("measured_at", today)
      .maybeSingle();

    if (existingMeasurement?.id) {
      const { error: measurementError } = await supabase
        .from("body_measurements")
        .update({
          weight: normalizedWeight,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingMeasurement.id)
        .eq("user_id", userId);

      if (measurementError) {
        setError(`Błąd aktualizacji wagi: ${measurementError.message}`);
        setSaving(false);
        return;
      }
    } else {
      const { error: measurementError } = await supabase
        .from("body_measurements")
        .insert({
          user_id: userId,
          measured_at: today,
          weight: normalizedWeight,
        });

      if (measurementError) {
        setError(`Błąd zapisu wagi: ${measurementError.message}`);
        setSaving(false);
        return;
      }
    }

    const { error: goalError } = await supabase
      .from("nutrition_goals")
      .upsert(
        {
          user_id: userId,
          calories_target: estimates.calories,
          protein_target: estimates.protein,
          fat_target: estimates.fat,
          carbs_target: estimates.carbs,
          include_activity_calories: calorieMode === "dynamic",
          calculation_source: "mifflin_st_jeor",
          calculated_bmr: estimates.bmr,
          calculated_maintenance: estimates.maintenance,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (goalError) {
      setError(`Błąd zapisu celu kalorycznego: ${goalError.message}`);
      setSaving(false);
      return;
    }

    router.replace("/");
  }

  function next() {
    setError("");

    if (!valid) {
      const messages = [
        "Podaj imię składające się z co najmniej 2 znaków.",
        "Podaj prawidłową datę urodzenia. Wiek musi wynosić od 13 do 100 lat.",
        "Wybierz płeć używaną do obliczenia zapotrzebowania.",
        "Podaj wzrost od 120 do 230 cm.",
        "Podaj wagę od 30 do 350 kg.",
        "Wybierz poziom codziennej aktywności.",
        "Podaj liczbę treningów od 0 do 14 tygodniowo.",
        "Wybierz cel, docelową wagę i prawidłowe tempo.",
        "Wybierz sposób rozliczania aktywności.",
      ];

      setError(messages[step] ?? "Uzupełnij poprawnie dane.");
      return;
    }

    if (step === steps.length - 1) {
      void finish();
      return;
    }

    setStep((current) => current + 1);
  }

  function previous() {
    setError("");
    setStep((current) => Math.max(0, current - 1));
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center">
        <div className="loader" />
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="card w-full max-w-2xl overflow-hidden">
        <div className="border-b border-emerald-900/50 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-300 font-black text-[#07120c]">
                F
              </div>
              <div>
                <div className="font-black">FormTrack</div>
                <div className="muted text-xs">
                  Profesjonalna konfiguracja profilu
                </div>
              </div>
            </div>

            <span className="muted text-sm">
              {step + 1}/{steps.length}
            </span>
          </div>

          <div className="grid grid-cols-9 gap-1.5">
            {steps.map((label, index) => (
              <div key={label}>
                <div
                  className={`h-1.5 rounded-full ${
                    index <= step
                      ? "bg-emerald-300"
                      : "bg-emerald-950"
                  }`}
                />
                <div
                  className={`mt-2 hidden text-center text-[9px] md:block ${
                    index === step ? "text-emerald-200" : "muted"
                  }`}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8">
          {step === 0 && (
            <Step
              title="Jak mamy się do Ciebie zwracać?"
              description="Wystarczy samo imię."
              icon={<UserRound size={26} />}
            >
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Np. Maciej"
                maxLength={40}
              />
            </Step>
          )}

          {step === 1 && (
            <Step
              title="Kiedy się urodziłeś?"
              description="Data urodzenia pozwala automatycznie aktualizować wiek."
              icon={<CalendarDays size={26} />}
            >
              <input
                autoFocus
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                max={dateYearsAgo(13)}
                min={dateYearsAgo(100)}
              />
            </Step>
          )}

          {step === 2 && (
            <Step
              title="Wybierz płeć do obliczeń"
              description="Ta wartość jest używana wyłącznie we wzorze Mifflina–St Jeora."
              icon={<UserRound size={26} />}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <Choice
                  selected={sex === "male"}
                  title="Mężczyzna"
                  description="Stała we wzorze: +5"
                  onClick={() => setSex("male")}
                />
                <Choice
                  selected={sex === "female"}
                  title="Kobieta"
                  description="Stała we wzorze: −161"
                  onClick={() => setSex("female")}
                />
              </div>
            </Step>
          )}

          {step === 3 && (
            <Step
              title="Jaki masz wzrost?"
              description="Podaj wzrost w centymetrach."
              icon={<Ruler size={26} />}
            >
              <NumberInput
                value={height}
                setValue={setHeight}
                placeholder="Np. 180"
                suffix="cm"
              />
            </Step>
          )}

          {step === 4 && (
            <Step
              title="Ile obecnie ważysz?"
              description="Waga będzie używana do obliczenia BMR, TDEE i makroskładników."
              icon={<Weight size={26} />}
            >
              <NumberInput
                value={weight}
                setValue={setWeight}
                placeholder="Np. 85,5"
                suffix="kg"
                decimal
              />
            </Step>
          )}

          {step === 5 && (
            <Step
              title="Jaka jest Twoja codzienna aktywność?"
              description="Oceń ruch poza zaplanowanymi treningami."
              icon={<Activity size={26} />}
            >
              <div className="grid gap-3">
                {activityOptions.map((option) => (
                  <Choice
                    key={option.value}
                    selected={activityLevel === option.value}
                    title={option.label}
                    description={option.description}
                    onClick={() => setActivityLevel(option.value)}
                  />
                ))}
              </div>
            </Step>
          )}

          {step === 6 && (
            <Step
              title="Ile treningów wykonujesz tygodniowo?"
              description="Ta informacja służy do opisu planu i późniejszej kalibracji."
              icon={<Dumbbell size={26} />}
            >
              <NumberInput
                value={workoutsPerWeek}
                setValue={setWorkoutsPerWeek}
                placeholder="Np. 3"
                suffix="treningi"
              />
            </Step>
          )}

          {step === 7 && (
            <Step
              title="Jaki jest Twój cel?"
              description="Wybierz cel, docelową wagę i tempo zmiany masy."
              icon={<Target size={26} />}
            >
              <div className="grid gap-3 md:grid-cols-3">
                <Choice
                  selected={goal === "lose"}
                  title="Redukcja"
                  description="Zmniejszenie masy"
                  onClick={() => setGoal("lose")}
                />
                <Choice
                  selected={goal === "maintain"}
                  title="Utrzymanie"
                  description="Stabilna masa"
                  onClick={() => {
                    setGoal("maintain");
                    setWeeklyRatePercent("0");
                  }}
                />
                <Choice
                  selected={goal === "gain"}
                  title="Budowanie masy"
                  description="Stopniowy wzrost"
                  onClick={() => setGoal("gain")}
                />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-2 block font-bold">
                    Docelowa masa
                  </span>
                  <NumberInput
                    value={targetWeight}
                    setValue={setTargetWeight}
                    placeholder="Np. 78"
                    suffix="kg"
                    decimal
                  />
                </label>

                {goal !== "maintain" && (
                  <label className="block text-sm">
                    <span className="mb-2 block font-bold">
                      Tempo tygodniowe
                    </span>
                    <select
                      value={weeklyRatePercent}
                      onChange={(event) =>
                        setWeeklyRatePercent(event.target.value)
                      }
                    >
                      <option value="0.25">0,25% masy / tydzień</option>
                      <option value="0.5">0,5% masy / tydzień</option>
                      <option value="0.75">0,75% masy / tydzień</option>
                    </select>
                  </label>
                )}
              </div>
            </Step>
          )}

          {step === 8 && (
            <Step
              title="Jak rozliczać aktywność?"
              description="Wybierz sposób ustalania dziennego limitu kalorii."
              icon={<Gauge size={26} />}
            >
              <div className="grid gap-3">
                <Choice
                  selected={calorieMode === "fixed"}
                  title="Stały cel — polecany"
                  description="Cel uwzględnia typową aktywność. Treningi i kroki nie zwiększają automatycznie limitu."
                  onClick={() => setCalorieMode("fixed")}
                />
                <Choice
                  selected={calorieMode === "dynamic"}
                  title="Cel dynamiczny"
                  description="Bazą jest siedzący tryb życia, a aktywność z konkretnego dnia zwiększa limit kalorii."
                  onClick={() => setCalorieMode("dynamic")}
                />
              </div>

              {estimates && (
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <Summary label="BMR" value={`${estimates.bmr} kcal`} />
                  <Summary
                    label={
                      calorieMode === "fixed"
                        ? "Szacowane utrzymanie"
                        : "Baza dzienna"
                    }
                    value={`${estimates.maintenance} kcal`}
                  />
                  <Summary
                    label="Cel kalorii"
                    value={`${estimates.calories} kcal`}
                  />
                  <Summary
                    label="Makro"
                    value={`B ${estimates.protein} g • T ${estimates.fat} g • W ${estimates.carbs} g`}
                  />
                </div>
              )}

              <p className="muted mt-5 text-xs">
                Wynik jest estymacją i będzie można go później kalibrować
                na podstawie średniego spożycia oraz trendu masy ciała.
              </p>
            </Step>
          )}

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <div className="mt-8 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={previous}
                disabled={saving}
              >
                <ArrowLeft size={18} />
                Wstecz
              </button>
            )}

            <button
              type="button"
              className="btn btn-primary flex-1"
              onClick={next}
              disabled={saving || !valid}
            >
              {saving ? (
                "Zapisywanie…"
              ) : step === steps.length - 1 ? (
                <>
                  <Check size={18} />
                  Zakończ
                </>
              ) : (
                <>
                  Dalej
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function Step({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-300">
        {icon}
      </div>
      <h1 className="text-2xl font-black">{title}</h1>
      <p className="muted mt-2">{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Choice({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-emerald-300 bg-emerald-300/10"
          : "border-emerald-900/50 bg-emerald-950/30"
      }`}
    >
      <div className="font-black">{title}</div>
      <div className="muted mt-1 text-sm">{description}</div>
    </button>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-emerald-950/50 p-4">
      <div className="muted text-xs">{label}</div>
      <div className="mt-1 font-black">{value}</div>
    </div>
  );
}

function NumberInput({
  value,
  setValue,
  placeholder,
  suffix,
  decimal = false,
}: {
  value: string;
  setValue: (value: string) => void;
  placeholder: string;
  suffix: string;
  decimal?: boolean;
}) {
  return (
    <div className="relative">
      <input
        autoFocus
        inputMode={decimal ? "decimal" : "numeric"}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="pr-24"
      />
      <span className="muted absolute right-4 top-1/2 -translate-y-1/2 font-bold">
        {suffix}
      </span>
    </div>
  );
}

function isProfessionalProfileComplete(profile: ProfileData | null) {
  return Boolean(
    profile?.name?.trim() &&
      profile?.birth_date &&
      profile?.sex_for_calculation &&
      profile?.height_cm &&
      profile?.activity_level &&
      profile?.workouts_per_week != null &&
      profile?.goal &&
      profile?.target_weight &&
      profile?.weekly_rate_percent != null &&
      profile?.calorie_mode
  );
}

function calculateBmr(
  sex: SexForCalculation,
  weight: number,
  height: number,
  age: number
) {
  return (
    10 * weight +
    6.25 * height -
    5 * age +
    (sex === "male" ? 5 : -161)
  );
}

function parseDecimal(value: string) {
  return Number(value.replace(",", "."));
}

function getAge(dateString: string) {
  if (!dateString) return -1;

  const birthDate = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(birthDate.getTime())) return -1;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference =
    today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

function dateYearsAgo(years: number) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString().slice(0, 10);
}