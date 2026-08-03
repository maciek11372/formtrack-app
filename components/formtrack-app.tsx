"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Beef,
  Bell,
  BellRing,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Flame,
  Footprints,
  Home,
  LogOut,
  MoreHorizontal,
  Pencil,
  Pill,
  Plus,
  Salad,
  Ruler,
  Target,
  Trash2,
  User,
  Weight,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { createClient } from "@/lib/supabase-client";
import { bmi } from "@/lib/calculations";

type Tab =
  | "dashboard"
  | "workout"
  | "measurements"
  | "nutrition"
  | "supplements"
  | "stats"
  | "profile";

type Profile = {
  id: string;
  name: string;
  birth_date: string;
  height_cm: number;
  sex_for_calculation: "male" | "female";
  activity_level:
    | "sedentary"
    | "light"
    | "moderate"
    | "high"
    | "very_high";
  workouts_per_week: number;
  goal: "lose" | "maintain" | "gain";
  target_weight: number;
  weekly_rate_percent: number;
  calorie_mode: "fixed" | "dynamic";
};

type ProfileData = {
  id: string;
  name: string | null;
  birth_date: string | null;
  height_cm: number | null;
  sex_for_calculation: "male" | "female" | null;
  activity_level:
    | "sedentary"
    | "light"
    | "moderate"
    | "high"
    | "very_high"
    | null;
  workouts_per_week: number | null;
  goal: "lose" | "maintain" | "gain" | null;
  target_weight: number | null;
  weekly_rate_percent: number | null;
  calorie_mode: "fixed" | "dynamic" | null;
};

type DbMeasurement = {
  id: string;
  user_id: string;
  measured_at: string;
  weight: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  chest_cm: number | null;
  arm_cm: number | null;
  forearm_cm: number | null;
  thigh_cm: number | null;
  calf_cm: number | null;
  neck_cm: number | null;
  body_fat_percentage: number | null;
  notes: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type MeasurementForm = {
  measured_at: string;
  weight: string;
  waist_cm: string;
  hips_cm: string;
  chest_cm: string;
  arm_cm: string;
  forearm_cm: string;
  thigh_cm: string;
  calf_cm: string;
  neck_cm: string;
  body_fat_percentage: string;
  notes: string;
};

type DbActivity = {
  id: string;
  user_id: string;
  activity_date: string;
  activity_type: string;
  duration_minutes: number | null;
  calories_burned: number | null;
  steps: number | null;
  notes: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ActivityForm = {
  activity_date: string;
  activity_type: string;
  duration_minutes: string;
  calories_burned: string;
  steps: string;
  notes: string;
};

type NutritionGoal = {
  id: string;
  user_id: string;
  calories_target: number;
  protein_target: number | null;
  fat_target: number | null;
  carbs_target: number | null;
  include_activity_calories: boolean;
  calculation_source: string | null;
  calculated_bmr: number | null;
  calculated_maintenance: number | null;
};

type DbMeal = {
  id: string;
  user_id: string;
  meal_date: string;
  meal_type: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  notes: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type MealForm = {
  meal_date: string;
  meal_type: string;
  name: string;
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
  notes: string;
};

type GoalForm = {
  calories_target: string;
  protein_percent: string;
  fat_percent: string;
  carbs_percent: string;
  include_activity_calories: boolean;
};

type SupplementCatalogItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  default_amount: number | null;
  default_unit: string | null;
  amount_mg_equivalent: number | null;
  timing_guidance: string | null;
  usage_guidance: string | null;
  safety_note: string | null;
  source_name: string | null;
  source_url: string | null;
  requires_professional_guidance: boolean;
};

type UserSupplement = {
  id: string;
  user_id: string;
  catalog_id: string | null;
  custom_name: string | null;
  amount: number;
  unit: string;
  amount_mg_equivalent: number | null;
  instructions: string | null;
  notes: string | null;
  is_active: boolean;
  supplement_catalog: SupplementCatalogItem | null;
};

type SupplementSchedule = {
  id: string;
  user_id: string;
  user_supplement_id: string;
  reminder_time: string;
  days_of_week: number[];
  notification_enabled: boolean;
};

type SupplementIntake = {
  id: string;
  user_id: string;
  user_supplement_id: string;
  schedule_id: string | null;
  planned_date: string;
  planned_time: string | null;
  status: "taken" | "skipped";
  taken_at: string | null;
  skipped_at: string | null;
};

type SupplementForm = {
  catalog_id: string;
  custom_name: string;
  amount: string;
  unit: string;
  instructions: string;
  notes: string;
  reminder_time: string;
  days_of_week: number[];
  notification_enabled: boolean;
};

const tabs = [
  ["dashboard", "Pulpit", Home],
  ["workout", "Trening", Dumbbell],
  ["measurements", "Pomiary", Ruler],
  ["nutrition", "Dieta", Salad],
  ["supplements", "Suplementy", Pill],
  ["stats", "Statystyki", BarChart3],
  ["profile", "Profil", User],
] as const;

const EMPTY_SUPPLEMENT_FORM: SupplementForm = {
  catalog_id: "",
  custom_name: "",
  amount: "",
  unit: "mg",
  instructions: "",
  notes: "",
  reminder_time: "08:00",
  days_of_week: [1, 2, 3, 4, 5, 6, 7],
  notification_enabled: true,
};

const DAY_OPTIONS = [
  { value: 1, label: "Pn" },
  { value: 2, label: "Wt" },
  { value: 3, label: "Śr" },
  { value: 4, label: "Cz" },
  { value: 5, label: "Pt" },
  { value: 6, label: "Sb" },
  { value: 7, label: "Nd" },
];

const EMPTY_MEAL_FORM: MealForm = {
  meal_date: new Date().toISOString().slice(0, 10),
  meal_type: "Śniadanie",
  name: "",
  calories: "",
  protein: "",
  fat: "",
  carbs: "",
  notes: "",
};

const MEAL_TYPES = [
  "Śniadanie",
  "Drugie śniadanie",
  "Obiad",
  "Podwieczorek",
  "Kolacja",
  "Przekąska",
  "Inny posiłek",
];

const EMPTY_ACTIVITY_FORM: ActivityForm = {
  activity_date: new Date().toISOString().slice(0, 10),
  activity_type: "",
  duration_minutes: "",
  calories_burned: "",
  steps: "",
  notes: "",
};

const ACTIVITY_TYPES = [
  "Trening siłowy",
  "Bieganie",
  "Spacer",
  "Rower",
  "Pływanie",
  "Orbitrek",
  "Sport zespołowy",
  "Inna aktywność",
];

const EMPTY_MEASUREMENT_FORM: MeasurementForm = {
  measured_at: new Date().toISOString().slice(0, 10),
  weight: "",
  waist_cm: "",
  hips_cm: "",
  chest_cm: "",
  arm_cm: "",
  forearm_cm: "",
  thigh_cm: "",
  calf_cm: "",
  neck_cm: "",
  body_fat_percentage: "",
  notes: "",
};

const MEASUREMENT_FIELDS: Array<{
  key: keyof Omit<MeasurementForm, "measured_at" | "notes">;
  label: string;
  unit: string;
  min: number;
  max: number;
  placeholder: string;
}> = [
  {
    key: "weight",
    label: "Masa ciała",
    unit: "kg",
    min: 20,
    max: 400,
    placeholder: "Np. 85,5",
  },
  {
    key: "waist_cm",
    label: "Obwód pasa",
    unit: "cm",
    min: 30,
    max: 250,
    placeholder: "Np. 92",
  },
  {
    key: "hips_cm",
    label: "Obwód bioder",
    unit: "cm",
    min: 30,
    max: 250,
    placeholder: "Np. 100",
  },
  {
    key: "chest_cm",
    label: "Obwód klatki piersiowej",
    unit: "cm",
    min: 30,
    max: 250,
    placeholder: "Np. 105",
  },
  {
    key: "arm_cm",
    label: "Obwód ramienia",
    unit: "cm",
    min: 10,
    max: 100,
    placeholder: "Np. 38",
  },
  {
    key: "forearm_cm",
    label: "Obwód przedramienia",
    unit: "cm",
    min: 10,
    max: 80,
    placeholder: "Np. 31",
  },
  {
    key: "thigh_cm",
    label: "Obwód uda",
    unit: "cm",
    min: 20,
    max: 150,
    placeholder: "Np. 61",
  },
  {
    key: "calf_cm",
    label: "Obwód łydki",
    unit: "cm",
    min: 10,
    max: 100,
    placeholder: "Np. 39",
  },
  {
    key: "neck_cm",
    label: "Obwód szyi",
    unit: "cm",
    min: 15,
    max: 100,
    placeholder: "Np. 41",
  },
  {
    key: "body_fat_percentage",
    label: "Tkanka tłuszczowa",
    unit: "%",
    min: 1,
    max: 70,
    placeholder: "Np. 22",
  },
];

function isProfileComplete(profile: ProfileData | null) {
  return Boolean(
    profile?.name?.trim() &&
      profile?.birth_date &&
      profile?.height_cm &&
      profile.height_cm > 0 &&
      profile?.sex_for_calculation &&
      profile?.activity_level &&
      profile?.workouts_per_week != null &&
      profile?.goal &&
      profile?.target_weight &&
      profile?.weekly_rate_percent != null &&
      profile?.calorie_mode
  );
}

export default function FormTrackApp() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("dashboard");
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [measurements, setMeasurements] = useState<DbMeasurement[]>([]);
  const [activities, setActivities] = useState<DbActivity[]>([]);
  const [meals, setMeals] = useState<DbMeal[]>([]);
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal | null>(null);
  const [supplementCatalog, setSupplementCatalog] = useState<SupplementCatalogItem[]>([]);
  const [userSupplements, setUserSupplements] = useState<UserSupplement[]>([]);
  const [supplementSchedules, setSupplementSchedules] = useState<SupplementSchedule[]>([]);
  const [supplementIntakes, setSupplementIntakes] = useState<SupplementIntake[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [measurementModal, setMeasurementModal] = useState<{
    open: boolean;
    measurement: DbMeasurement | null;
  }>({
    open: false,
    measurement: null,
  });
  const [activityModal, setActivityModal] = useState<{
    open: boolean;
    activity: DbActivity | null;
  }>({
    open: false,
    activity: null,
  });
  const [mealModal, setMealModal] = useState<{
    open: boolean;
    meal: DbMeal | null;
  }>({
    open: false,
    meal: null,
  });
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [supplementModal, setSupplementModal] = useState<{
    open: boolean;
    supplement: UserSupplement | null;
  }>({
    open: false,
    supplement: null,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    const supabase = createClient();

    if (!supabase) {
      router.replace("/auth");
      return;
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      router.replace("/auth");
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select(
          "id, name, birth_date, height_cm, sex_for_calculation, activity_level, workouts_per_week, goal, target_weight, weekly_rate_percent, calorie_mode"
        )
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      setLoadError(
        `Nie udało się pobrać profilu: ${profileError.message}`
      );
      setLoading(false);
      return;
    }

    if (!isProfileComplete(profileData)) {
      router.replace("/onboarding");
      return;
    }

    const { data: measurementData, error: measurementError } =
      await supabase
        .from("body_measurements")
        .select(
          "id, user_id, measured_at, weight, waist_cm, hips_cm, chest_cm, arm_cm, forearm_cm, thigh_cm, calf_cm, neck_cm, body_fat_percentage, notes, created_at, updated_at"
        )
        .eq("user_id", authData.user.id)
        .order("measured_at", { ascending: true });

    if (measurementError) {
      setLoadError(
        `Nie udało się pobrać pomiarów: ${measurementError.message}`
      );
      setLoading(false);
      return;
    }

    const { data: activityData, error: activityError } =
      await supabase
        .from("activities")
        .select(
          "id, user_id, activity_date, activity_type, duration_minutes, calories_burned, steps, notes, created_at, updated_at"
        )
        .eq("user_id", authData.user.id)
        .order("activity_date", { ascending: true })
        .order("created_at", { ascending: true });

    if (activityError) {
      setLoadError(
        `Nie udało się pobrać aktywności: ${activityError.message}`
      );
      setLoading(false);
      return;
    }

    const { data: mealData, error: mealError } = await supabase
      .from("meals")
      .select(
        "id, user_id, meal_date, meal_type, name, calories, protein, fat, carbs, notes, created_at, updated_at"
      )
      .eq("user_id", authData.user.id)
      .order("meal_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (mealError) {
      setLoadError(`Nie udało się pobrać posiłków: ${mealError.message}`);
      setLoading(false);
      return;
    }

    const { data: goalData, error: goalError } = await supabase
      .from("nutrition_goals")
      .select(
        "id, user_id, calories_target, protein_target, fat_target, carbs_target, include_activity_calories, calculation_source, calculated_bmr, calculated_maintenance"
      )
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (goalError) {
      setLoadError(`Nie udało się pobrać celu żywieniowego: ${goalError.message}`);
      setLoading(false);
      return;
    }

    const { data: catalogData, error: catalogError } = await supabase
      .from("supplement_catalog")
      .select(
        "id, slug, name, category, default_amount, default_unit, amount_mg_equivalent, timing_guidance, usage_guidance, safety_note, source_name, source_url, requires_professional_guidance"
      )
      .order("category")
      .order("name");

    if (catalogError) {
      setLoadError(`Nie udało się pobrać katalogu suplementów: ${catalogError.message}`);
      setLoading(false);
      return;
    }

    const { data: userSupplementData, error: userSupplementError } =
      await supabase
        .from("user_supplements")
        .select(
          "id, user_id, catalog_id, custom_name, amount, unit, amount_mg_equivalent, instructions, notes, is_active, supplement_catalog(id, slug, name, category, default_amount, default_unit, amount_mg_equivalent, timing_guidance, usage_guidance, safety_note, source_name, source_url, requires_professional_guidance)"
        )
        .eq("user_id", authData.user.id)
        .eq("is_active", true)
        .order("created_at");

    if (userSupplementError) {
      setLoadError(`Nie udało się pobrać suplementów: ${userSupplementError.message}`);
      setLoading(false);
      return;
    }

    const { data: scheduleData, error: scheduleError } = await supabase
      .from("supplement_schedules")
      .select(
        "id, user_id, user_supplement_id, reminder_time, days_of_week, notification_enabled"
      )
      .eq("user_id", authData.user.id);

    if (scheduleError) {
      setLoadError(`Nie udało się pobrać harmonogramów: ${scheduleError.message}`);
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: intakeData, error: intakeError } = await supabase
      .from("supplement_intakes")
      .select(
        "id, user_id, user_supplement_id, schedule_id, planned_date, planned_time, status, taken_at, skipped_at"
      )
      .eq("user_id", authData.user.id)
      .gte("planned_date", today)
      .lte("planned_date", today);

    if (intakeError) {
      setLoadError(`Nie udało się pobrać odhaczeń suplementów: ${intakeError.message}`);
      setLoading(false);
      return;
    }

    if (!profileData) {
      setLoadError("Nie znaleziono profilu użytkownika.");
      setLoading(false);
      return;
    }

    setProfile({
      id: profileData.id,
      name: profileData.name as string,
      birth_date: profileData.birth_date as string,
      height_cm: profileData.height_cm as number,
      sex_for_calculation: profileData.sex_for_calculation as "male" | "female",
      activity_level: profileData.activity_level as Profile["activity_level"],
      workouts_per_week: profileData.workouts_per_week as number,
      goal: profileData.goal as Profile["goal"],
      target_weight: profileData.target_weight as number,
      weekly_rate_percent: profileData.weekly_rate_percent as number,
      calorie_mode: profileData.calorie_mode as "fixed" | "dynamic",
    });

    setMeasurements((measurementData ?? []) as DbMeasurement[]);
    setActivities((activityData ?? []) as DbActivity[]);
    setMeals((mealData ?? []) as DbMeal[]);
    setNutritionGoal((goalData as NutritionGoal | null) ?? null);
    setSupplementCatalog((catalogData ?? []) as SupplementCatalogItem[]);
    setUserSupplements((userSupplementData ?? []) as unknown as UserSupplement[]);
    setSupplementSchedules((scheduleData ?? []) as SupplementSchedule[]);
    setSupplementIntakes((intakeData ?? []) as SupplementIntake[]);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    const notified = new Set<string>();

    function checkReminders() {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const day = now.getDay() === 0 ? 7 : now.getDay();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      for (const schedule of supplementSchedules) {
        if (!schedule.notification_enabled || !schedule.days_of_week.includes(day)) {
          continue;
        }

        const [hours, minutes] = schedule.reminder_time
          .slice(0, 5)
          .split(":")
          .map(Number);
        const scheduleMinutes = hours * 60 + minutes;
        const notificationKey = `${schedule.id}-${today}`;

        if (
          currentMinutes >= scheduleMinutes &&
          currentMinutes <= scheduleMinutes + 2 &&
          !notified.has(notificationKey)
        ) {
          const supplement = userSupplements.find(
            (item) => item.id === schedule.user_supplement_id
          );
          const alreadyHandled = supplementIntakes.some(
            (intake) =>
              intake.user_supplement_id === schedule.user_supplement_id &&
              intake.planned_date === today &&
              intake.planned_time?.slice(0, 5) === schedule.reminder_time.slice(0, 5)
          );

          if (supplement && !alreadyHandled) {
            new Notification("FormTrack — pora na suplement", {
              body: `${supplementName(supplement)}: ${formatSupplementDose(supplement)}`,
              icon: "/icon-192.png",
            });
            notified.add(notificationKey);
          }
        }
      }
    }

    checkReminders();
    const interval = window.setInterval(checkReminders, 60_000);

    return () => window.clearInterval(interval);
  }, [supplementSchedules, userSupplements, supplementIntakes]);

  async function logout() {
    const supabase = createClient();

    if (supabase) {
      await supabase.auth.signOut();
    }

    router.replace("/auth");
  }

  function openNewMeasurement() {
    setMeasurementModal({
      open: true,
      measurement: null,
    });
  }

  function openEditMeasurement(measurement: DbMeasurement) {
    setMeasurementModal({
      open: true,
      measurement,
    });
  }

  function closeMeasurementModal() {
    setMeasurementModal({
      open: false,
      measurement: null,
    });
  }

  function openNewActivity() {
    setActivityModal({
      open: true,
      activity: null,
    });
  }

  function openEditActivity(activity: DbActivity) {
    setActivityModal({
      open: true,
      activity,
    });
  }

  function closeActivityModal() {
    setActivityModal({
      open: false,
      activity: null,
    });
  }

  function openNewMeal() {
    setMealModal({
      open: true,
      meal: null,
    });
  }

  function openEditMeal(meal: DbMeal) {
    setMealModal({
      open: true,
      meal,
    });
  }

  function closeMealModal() {
    setMealModal({
      open: false,
      meal: null,
    });
  }

  function openNewSupplement() {
    setSupplementModal({
      open: true,
      supplement: null,
    });
  }

  function openEditSupplement(supplement: UserSupplement) {
    setSupplementModal({
      open: true,
      supplement,
    });
  }

  function closeSupplementModal() {
    setSupplementModal({
      open: false,
      supplement: null,
    });
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center">
        <div className="loader" />
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="grid min-h-screen place-items-center p-4">
        <section className="card w-full max-w-lg p-6">
          <h1 className="text-xl font-black">
            Nie udało się załadować aplikacji
          </h1>

          <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
            {loadError}
          </p>

          <button
            type="button"
            className="btn btn-primary mt-5"
            onClick={() => void loadData()}
          >
            Spróbuj ponownie
          </button>
        </section>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  const weightMeasurements = measurements.filter(
    (measurement) => measurement.weight != null
  );

  const latest =
    weightMeasurements.length > 0
      ? weightMeasurements[weightMeasurements.length - 1]
      : undefined;

  const first =
    weightMeasurements.length > 0 ? weightMeasurements[0] : undefined;

  const currentBmi =
    latest?.weight != null
      ? bmi(latest.weight, profile.height_cm)
      : null;

  const change =
    latest?.weight != null && first?.weight != null
      ? latest.weight - first.weight
      : null;

  const content = {
    dashboard: (
      <Dashboard
        profile={profile}
        latest={latest}
        change={change}
        currentBmi={currentBmi}
        measurements={measurements}
        activities={activities}
        meals={meals}
        nutritionGoal={nutritionGoal}
        onMeasure={openNewMeasurement}
        onActivity={openNewActivity}
      />
    ),

    workout: (
      <Activities
        activities={activities}
        onAdd={openNewActivity}
        onEdit={openEditActivity}
        onDeleted={loadData}
      />
    ),

    measurements: (
      <Measurements
        measurements={measurements}
        onAdd={openNewMeasurement}
        onEdit={openEditMeasurement}
        onDeleted={loadData}
      />
    ),

    nutrition: (
      <Nutrition
        meals={meals}
        activities={activities}
        goal={nutritionGoal}
        onAddMeal={openNewMeal}
        onEditMeal={openEditMeal}
        onEditGoal={() => setGoalModalOpen(true)}
        onDeleted={loadData}
      />
    ),

    supplements: (
      <Supplements
        supplements={userSupplements}
        schedules={supplementSchedules}
        intakes={supplementIntakes}
        onAdd={openNewSupplement}
        onEdit={openEditSupplement}
        onChanged={loadData}
      />
    ),

    stats: (
      <Stats
        measurements={measurements}
        activities={activities}
        meals={meals}
        goal={nutritionGoal}
      />
    ),

    profile: <ProfileView profile={profile} onLogout={logout} />,
  }[tab];

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-emerald-900/40 bg-[#07120c]/95 p-5 lg:block">
        <div className="flex items-center gap-3 text-xl font-black">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300 text-[#07120c]">
            F
          </div>

          FormTrack
        </div>

        <div className="mt-8 space-y-2">
          {tabs.map(([id, label, Icon]) => (
            <button
              type="button"
              key={id}
              onClick={() => setTab(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold ${
                tab === id
                  ? "bg-emerald-300 text-[#07120c]"
                  : "text-slate-300 hover:bg-emerald-950"
              }`}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>

        <div className="card absolute bottom-5 left-5 right-5 p-4">
          <div className="text-sm font-bold">{profile.name}</div>

          <div className="muted text-xs">
            {getAge(profile.birth_date)} lat • {profile.height_cm} cm
          </div>
        </div>
      </aside>

      <main className="safe-bottom px-4 py-5 sm:px-6 lg:ml-64 lg:px-8 lg:py-7">
        <div className="mx-auto w-full max-w-[1500px]">
          <header className="mb-6 lg:mb-8">
            <div className="muted text-xs uppercase tracking-[.2em]">
              FormTrack
            </div>

            <h1 className="text-2xl font-black sm:text-3xl">
              {tabs.find((item) => item[0] === tab)?.[1]}
            </h1>
          </header>

          {content}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-emerald-900/60 bg-[#07120c]/95 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {tabs.slice(0, 4).map(([id, label, Icon]) => (
            <button
              type="button"
              key={id}
              onClick={() => {
                setTab(id);
                setMobileMoreOpen(false);
              }}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium ${
                tab === id
                  ? "bg-emerald-300 text-[#07120c]"
                  : "text-slate-400"
              }`}
            >
              <Icon size={20} />
              <span className="w-full truncate text-center">{label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setMobileMoreOpen((open) => !open)}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium ${
              mobileMoreOpen || ["supplements", "stats", "profile"].includes(tab)
                ? "bg-emerald-300 text-[#07120c]"
                : "text-slate-400"
            }`}
          >
            <MoreHorizontal size={20} />
            <span>Więcej</span>
          </button>
        </div>
      </nav>

      {mobileMoreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Zamknij menu"
            className="absolute inset-0 bg-black/55"
            onClick={() => setMobileMoreOpen(false)}
          />

          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl border-t border-emerald-800/60 bg-[#091a11] px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-emerald-900" />
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-lg font-black">Więcej</div>
                <div className="muted text-xs">Pozostałe sekcje aplikacji</div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMoreOpen(false)}
                className="rounded-xl border border-emerald-800/60 p-2 text-slate-300"
                aria-label="Zamknij"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {tabs.slice(4).map(([id, label, Icon]) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => {
                    setTab(id);
                    setMobileMoreOpen(false);
                  }}
                  className={`flex min-w-0 flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-sm font-bold ${
                    tab === id
                      ? "border-emerald-300 bg-emerald-300 text-[#07120c]"
                      : "border-emerald-900/70 bg-emerald-950/40 text-slate-200"
                  }`}
                >
                  <Icon size={24} />
                  <span className="w-full truncate text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {measurementModal.open && (
        <MeasurementModal
          measurement={measurementModal.measurement}
          onClose={closeMeasurementModal}
          onSaved={async () => {
            closeMeasurementModal();
            await loadData();
          }}
        />
      )}

      {activityModal.open && (
        <ActivityModal
          activity={activityModal.activity}
          onClose={closeActivityModal}
          onSaved={async () => {
            closeActivityModal();
            await loadData();
          }}
        />
      )}

      {mealModal.open && (
        <MealModal
          meal={mealModal.meal}
          onClose={closeMealModal}
          onSaved={async () => {
            closeMealModal();
            await loadData();
          }}
        />
      )}

      {goalModalOpen && (
        <NutritionGoalModal
          goal={nutritionGoal}
          onClose={() => setGoalModalOpen(false)}
          onSaved={async () => {
            setGoalModalOpen(false);
            await loadData();
          }}
        />
      )}

      {supplementModal.open && (
        <SupplementModal
          supplement={supplementModal.supplement}
          catalog={supplementCatalog}
          schedules={supplementSchedules}
          onClose={closeSupplementModal}
          onSaved={async () => {
            closeSupplementModal();
            await loadData();
          }}
        />
      )}
    </div>
  );
}


type MeasurementChartKey =
  | "weight"
  | "waist_cm"
  | "hips_cm"
  | "chest_cm"
  | "arm_cm"
  | "thigh_cm"
  | "body_fat_percentage";

const measurementChartOptions: Array<{
  key: MeasurementChartKey;
  label: string;
  unit: string;
}> = [
  { key: "weight", label: "Masa ciała", unit: "kg" },
  { key: "waist_cm", label: "Talia", unit: "cm" },
  { key: "hips_cm", label: "Biodra", unit: "cm" },
  { key: "chest_cm", label: "Klatka", unit: "cm" },
  { key: "arm_cm", label: "Ramię", unit: "cm" },
  { key: "thigh_cm", label: "Udo", unit: "cm" },
  { key: "body_fat_percentage", label: "Tkanka tłuszczowa", unit: "%" },
];

function shortDate(date: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${date}T12:00:00`));
}

function getLastDays(count: number) {
  const result: string[] = [];
  const now = new Date();

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    result.push(date.toISOString().slice(0, 10));
  }

  return result;
}

const chartTooltipStyle = {
  background: "#0a1b12",
  border: "1px solid #28523a",
  borderRadius: 12,
  color: "#ecfdf5",
};

function ChartEmpty({ text }: { text: string }) {
  return (
    <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-emerald-900/70 bg-emerald-950/20 p-6 text-center">
      <p className="muted max-w-sm text-sm">{text}</p>
    </div>
  );
}

function WeightTrendChart({
  measurements,
  compact = false,
}: {
  measurements: DbMeasurement[];
  compact?: boolean;
}) {
  const data = measurements
    .filter((measurement) => measurement.weight != null)
    .slice(compact ? -12 : -30)
    .map((measurement) => ({
      date: shortDate(measurement.measured_at),
      value: Number(measurement.weight),
    }));

  return (
    <section className="card p-5 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black">Trend masy ciała</h3>
          <p className="muted mt-1 text-sm">
            {compact ? "Ostatnie pomiary" : "Do 30 ostatnich pomiarów"}
          </p>
        </div>
        <Weight size={20} className="text-emerald-300" />
      </div>

      {data.length < 2 ? (
        <ChartEmpty text="Dodaj co najmniej dwa pomiary masy, aby zobaczyć trend." />
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#183123" vertical={false} />
              <XAxis dataKey="date" stroke="#789180" fontSize={11} />
              <YAxis
                stroke="#789180"
                fontSize={11}
                domain={["dataMin - 2", "dataMax + 2"]}
                width={48}
              />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`${value} kg`, "Masa"]} />
              <Area
                type="monotone"
                dataKey="value"
                name="Masa"
                stroke="#78e993"
                fill="#163c25"
                strokeWidth={3}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

function WeeklyCaloriesChart({
  meals,
  activities,
  goal,
}: {
  meals: DbMeal[];
  activities: DbActivity[];
  goal: NutritionGoal | null;
}) {
  const target = Math.round(Number(goal?.calories_target ?? 2000));
  const data = getLastDays(7).map((date) => {
    const consumed = Math.round(
      meals
        .filter((meal) => meal.meal_date === date)
        .reduce((sum, meal) => sum + Number(meal.calories ?? 0), 0)
    );
    const burned = Math.round(
      activities
        .filter((activity) => activity.activity_date === date)
        .reduce((sum, activity) => sum + Number(activity.calories_burned ?? 0), 0)
    );

    return {
      date: shortDate(date),
      consumed,
      burned,
      net: consumed > 0 ? consumed - burned : null,
      target,
    };
  });

  const completedDays = data.filter((item) => item.net != null);
  const averageNet = completedDays.length
    ? Math.round(
        completedDays.reduce((sum, item) => sum + Number(item.net), 0) /
          completedDays.length
      )
    : 0;
  const averageConsumed = completedDays.length
    ? Math.round(
        completedDays.reduce((sum, item) => sum + item.consumed, 0) /
          completedDays.length
      )
    : 0;
  const averageBurned = completedDays.length
    ? Math.round(
        completedDays.reduce((sum, item) => sum + item.burned, 0) /
          completedDays.length
      )
    : 0;

  const chartData = data.map((item) => ({
    ...item,
    average: completedDays.length ? averageNet : null,
  }));

  return (
    <section className="card p-5 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black">Bilans kalorii netto — 7 dni</h3>
          <p className="muted mt-1 text-sm">
            Spożyte kalorie pomniejszone o zarejestrowane spalanie
          </p>
        </div>
        <Salad size={20} className="text-emerald-300" />
      </div>

      {completedDays.length === 0 ? (
        <ChartEmpty text="Dodaj posiłki, aby zobaczyć rzeczywisty bilans kalorii." />
      ) : (
        <>
          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-950 bg-emerald-950/25 p-3">
              <div className="muted text-xs">Średni bilans netto</div>
              <div className="mt-1 font-black">{averageNet} kcal/dzień</div>
            </div>
            <div className="rounded-xl border border-emerald-950 bg-emerald-950/25 p-3">
              <div className="muted text-xs">Średnio spożyto</div>
              <div className="mt-1 font-black">{averageConsumed} kcal/dzień</div>
            </div>
            <div className="rounded-xl border border-emerald-950 bg-emerald-950/25 p-3">
              <div className="muted text-xs">Średnio spalono</div>
              <div className="mt-1 font-black">{averageBurned} kcal/dzień</div>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="#183123" vertical={false} />
                <XAxis dataKey="date" stroke="#789180" fontSize={11} />
                <YAxis stroke="#789180" fontSize={11} width={52} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value, name) => [`${value} kcal`, name]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "#dceee2" }}
                  formatter={(value) => <span style={{ color: "#dceee2" }}>{value}</span>}
                />
                <Bar
                  dataKey="net"
                  name="Bilans netto"
                  fill="#78e993"
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Cel"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="average"
                  name="Średnia netto"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  strokeDasharray="6 5"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="muted mt-3 text-xs">
            Dni bez zapisanych posiłków nie są liczone do średniej, żeby nie zaniżać wyniku.
          </p>
        </>
      )}
    </section>
  );
}

function MacroDonutChart({
  totals,
  goal,
}: {
  totals: { protein: number; fat: number; carbs: number; calories: number };
  goal: NutritionGoal | null;
}) {
  const data = [
    { name: "Białko", value: Number(totals.protein.toFixed(1)), fill: "#78e993" },
    { name: "Tłuszcze", value: Number(totals.fat.toFixed(1)), fill: "#fbbf24" },
    { name: "Węglowodany", value: Number(totals.carbs.toFixed(1)), fill: "#60a5fa" },
  ];
  const hasData = data.some((item) => item.value > 0);

  return (
    <section className="card p-5 md:p-6">
      <div className="mb-3">
        <h3 className="text-lg font-black">Dzisiejsze makro</h3>
        <p className="muted mt-1 text-sm">Podział spożytych gramów makroskładników</p>
      </div>

      {!hasData ? (
        <ChartEmpty text="Dodaj posiłek z makro, aby zobaczyć dzisiejszy podział." />
      ) : (
        <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={3}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  itemStyle={{ color: "#ecfdf5", fontWeight: 700 }}
                  labelStyle={{ color: "#a7f3d0" }}
                  cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
                  formatter={(value, name) => [`${value} g`, String(name)]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "#dceee2" }}
                  formatter={(value) => <span style={{ color: "#dceee2" }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-2">
            <NutritionMetric label="Białko" value={`${totals.protein.toFixed(1)} g`} target={goal?.protein_target != null ? `${goal.protein_target} g` : "brak celu"} />
            <NutritionMetric label="Tłuszcze" value={`${totals.fat.toFixed(1)} g`} target={goal?.fat_target != null ? `${goal.fat_target} g` : "brak celu"} />
            <NutritionMetric label="Węglowodany" value={`${totals.carbs.toFixed(1)} g`} target={goal?.carbs_target != null ? `${goal.carbs_target} g` : "brak celu"} />
          </div>
        </div>
      )}
    </section>
  );
}

function MeasurementTrendChart({ measurements }: { measurements: DbMeasurement[] }) {
  const [metric, setMetric] = useState<MeasurementChartKey>("waist_cm");
  const option = measurementChartOptions.find((item) => item.key === metric) ?? measurementChartOptions[0];
  const data = measurements
    .filter((measurement) => measurement[metric] != null)
    .slice(-30)
    .map((measurement) => ({
      date: shortDate(measurement.measured_at),
      value: Number(measurement[metric]),
    }));

  return (
    <section className="card mb-5 p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-black">Zmiana pomiarów</h3>
          <p className="muted mt-1 text-sm">Wybierz parametr, który chcesz śledzić</p>
        </div>
        <label className="block min-w-44 text-sm">
          <span className="sr-only">Rodzaj pomiaru</span>
          <select value={metric} onChange={(event) => setMetric(event.target.value as MeasurementChartKey)}>
            {measurementChartOptions.map((item) => (
              <option key={item.key} value={item.key}>{item.label}</option>
            ))}
          </select>
        </label>
      </div>

      {data.length < 2 ? (
        <ChartEmpty text={`Dodaj co najmniej dwa pomiary: ${option.label.toLowerCase()}.`} />
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#183123" vertical={false} />
              <XAxis dataKey="date" stroke="#789180" fontSize={11} />
              <YAxis stroke="#789180" fontSize={11} domain={["dataMin - 2", "dataMax + 2"]} width={48} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`${value} ${option.unit}`, option.label]} />
              <Line type="monotone" dataKey="value" name={option.label} stroke="#78e993" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

function ActivityWeeklyChart({ activities }: { activities: DbActivity[] }) {
  const data = getLastDays(7).map((date) => {
    const dayActivities = activities.filter((activity) => activity.activity_date === date);
    return {
      date: shortDate(date),
      minutes: dayActivities.reduce(
        (sum, activity) => sum + Number(activity.duration_minutes ?? 0),
        0
      ),
      calories: dayActivities.reduce(
        (sum, activity) => sum + Number(activity.calories_burned ?? 0),
        0
      ),
    };
  });
  const hasData = data.some((item) => item.minutes > 0 || item.calories > 0);
  const totalMinutes = data.reduce((sum, item) => sum + item.minutes, 0);
  const totalCalories = data.reduce((sum, item) => sum + item.calories, 0);

  return (
    <section className="card p-5 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black">Aktywność z 7 dni</h3>
          <p className="muted mt-1 text-sm">
            Spalone kalorie oraz czas treningu na jednym wykresie
          </p>
        </div>
        <Dumbbell size={20} className="text-emerald-300" />
      </div>

      {!hasData ? (
        <ChartEmpty text="Dodaj aktywność, aby zobaczyć tygodniowe podsumowanie." />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-emerald-950 bg-emerald-950/25 p-3">
              <div className="muted text-xs">Spalone w tygodniu</div>
              <div className="mt-1 font-black">{Math.round(totalCalories)} kcal</div>
            </div>
            <div className="rounded-xl border border-emerald-950 bg-emerald-950/25 p-3">
              <div className="muted text-xs">Czas aktywności</div>
              <div className="mt-1 font-black">{Math.round(totalMinutes)} min</div>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="#183123" vertical={false} />
                <XAxis dataKey="date" stroke="#789180" fontSize={11} />
                <YAxis
                  yAxisId="calories"
                  stroke="#789180"
                  fontSize={11}
                  width={48}
                  label={{
                    value: "kcal",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#789180",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  yAxisId="minutes"
                  orientation="right"
                  stroke="#789180"
                  fontSize={11}
                  width={42}
                  label={{
                    value: "min",
                    angle: 90,
                    position: "insideRight",
                    fill: "#789180",
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value, name) => [
                    `${value} ${name === "Czas treningu" ? "min" : "kcal"}`,
                    name,
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "#dceee2" }}
                  formatter={(value) => <span style={{ color: "#dceee2" }}>{value}</span>}
                />
                <Bar
                  yAxisId="calories"
                  dataKey="calories"
                  name="Spalone kalorie"
                  fill="#78e993"
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  yAxisId="minutes"
                  type="monotone"
                  dataKey="minutes"
                  name="Czas treningu"
                  stroke="#fbbf24"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}

function Dashboard({
  profile,
  latest,
  change,
  currentBmi,
  measurements,
  activities,
  meals,
  nutritionGoal,
  onMeasure,
  onActivity,
}: {
  profile: Profile;
  latest?: DbMeasurement;
  change: number | null;
  currentBmi: number | null;
  measurements: DbMeasurement[];
  activities: DbActivity[];
  meals: DbMeal[];
  nutritionGoal: NutritionGoal | null;
  onMeasure: () => void;
  onActivity: () => void;
}) {
  const latestFullMeasurement =
    measurements.length > 0
      ? measurements[measurements.length - 1]
      : undefined;

  const today = new Date().toISOString().slice(0, 10);
  const todayActivities = activities.filter(
    (activity) => activity.activity_date === today
  );
  const todayActivityCalories = todayActivities.reduce(
    (sum, activity) => sum + Number(activity.calories_burned ?? 0),
    0
  );
  const todaySteps = todayActivities.reduce(
    (sum, activity) => sum + Number(activity.steps ?? 0),
    0
  );
  const estimatedStepCalories = Math.round(todaySteps * 0.04);
  const totalBurnedToday = Math.round(
    todayActivityCalories + estimatedStepCalories
  );
  const todayMeals = meals.filter((meal) => meal.meal_date === today);
  const consumedToday = Math.round(
    todayMeals.reduce((sum, meal) => sum + Number(meal.calories ?? 0), 0)
  );
  const baseTarget = Number(nutritionGoal?.calories_target ?? 2000);
  const effectiveTarget =
    baseTarget +
    (nutritionGoal?.include_activity_calories ? totalBurnedToday : 0);
  const remainingToday = Math.round(effectiveTarget - consumedToday);
  const currentWeight = latest?.weight ?? null;
  const age = getAge(profile.birth_date);
  const calculatedBmr =
    currentWeight != null
      ? Math.round(
          calculateBmr(
            profile.sex_for_calculation,
            currentWeight,
            profile.height_cm,
            age
          )
        )
      : nutritionGoal?.calculated_bmr ?? null;
  const maintenance =
    nutritionGoal?.calculated_maintenance != null
      ? Math.round(nutritionGoal.calculated_maintenance)
      : null;

  return (
    <div className="space-y-6 lg:space-y-7">
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <section className="card flex h-full flex-col justify-between p-5 md:p-7">
          <div>
            <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-300">
              TWÓJ PROFIL
            </span>

            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
              Cześć, {profile.name} 👋
            </h2>

            <p className="muted mt-2 max-w-xl">
              Dodawaj regularne pomiary, aby śledzić zmiany masy i obwodów.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onMeasure}
              className="btn btn-primary"
            >
              <Plus size={18} />
              Dodaj pomiar
            </button>

            <button
              type="button"
              onClick={onActivity}
              className="btn btn-secondary"
            >
              <Dumbbell size={18} />
              Dodaj aktywność
            </button>
          </div>
        </section>

        <section className="card p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Zapotrzebowanie energetyczne</h2>
              <p className="muted mt-1 text-sm">
                Wzór Mifflina–St Jeora • tryb{" "}
                {profile.calorie_mode === "fixed" ? "stały" : "dynamiczny"}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-300/10 px-4 py-3 text-right">
              <div className="muted text-xs">Cel dzienny</div>
              <div className="text-2xl font-black">
                {Math.round(nutritionGoal?.calories_target ?? 2000)} kcal
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <NutritionMetric
              label="BMR"
              value={calculatedBmr != null ? `${calculatedBmr} kcal` : "—"}
              target="spoczynek"
            />
            <NutritionMetric
              label="Utrzymanie"
              value={maintenance != null ? `${maintenance} kcal` : "—"}
              target="szacunek"
            />
            <NutritionMetric
              label="Cel"
              value={goalLabel(profile.goal)}
              target={`${profile.target_weight} kg`}
            />
            <NutritionMetric
              label="Tempo"
              value={
                profile.goal === "maintain"
                  ? "utrzymanie"
                  : `${profile.weekly_rate_percent}% / tydz.`
              }
              target={`${profile.workouts_per_week} treningi/tydz.`}
            />
          </div>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
        <Metric
          label="Aktualna masa"
          value={latest?.weight != null ? `${latest.weight} kg` : "—"}
          icon={Weight}
        />

        <Metric
          label="Zmiana od początku"
          value={
            change == null
              ? "—"
              : `${change > 0 ? "+" : ""}${change.toFixed(1)} kg`
          }
          icon={Target}
        />

        <Metric
          label="BMI"
          value={currentBmi != null ? currentBmi.toFixed(1) : "—"}
          icon={Activity}
        />

        <Metric
          label="Spalone dzisiaj"
          value={`${totalBurnedToday} kcal`}
          note={`${todaySteps.toLocaleString("pl-PL")} kroków`}
          icon={Flame}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <WeightTrendChart measurements={measurements} compact />
        <WeeklyCaloriesChart meals={meals} activities={activities} goal={nutritionGoal} />
      </div>

      <div className="grid items-stretch gap-6 xl:grid-cols-2">
        <section className="card flex h-full items-center p-5 md:p-6">
          <div className="flex w-full flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black">Bilans kalorii dzisiaj</h2>
              <p className="muted mt-1 text-sm">
                Spożyto {consumedToday} kcal z celu {Math.round(effectiveTarget)} kcal.
              </p>
            </div>
            <div
              className={`rounded-2xl px-4 py-3 text-right ${
                remainingToday >= 0
                  ? "bg-emerald-300/10 text-emerald-200"
                  : "bg-red-500/10 text-red-200"
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-wide">
                {remainingToday >= 0 ? "Pozostało" : "Przekroczono"}
              </div>
              <div className="text-2xl font-black">
                {Math.abs(remainingToday)} kcal
              </div>
            </div>
          </div>
        </section>

        {latestFullMeasurement ? (
          <section className="card h-full p-5 md:p-6">
            <h2 className="text-lg font-black">Ostatni pomiar</h2>
            <p className="muted mt-1 text-sm">
              {formatDate(latestFullMeasurement.measured_at)}
            </p>

            <MeasurementValues measurement={latestFullMeasurement} compact />
          </section>
        ) : (
          <Empty
            title="Tu pojawi się Twój progres"
            text="Dodaj pierwszy pomiar masy lub obwodów."
            icon={<Flame size={28} />}
          />
        )}
      </div>
    </div>
  );
}


function Activities({
  activities,
  onAdd,
  onEdit,
  onDeleted,
}: {
  activities: DbActivity[];
  onAdd: () => void;
  onEdit: (activity: DbActivity) => void;
  onDeleted: () => Promise<void>;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const grouped = useMemo(() => {
    const result = new Map<string, DbActivity[]>();

    for (const activity of [...activities].reverse()) {
      const existing = result.get(activity.activity_date) ?? [];
      existing.push(activity);
      result.set(activity.activity_date, existing);
    }

    return Array.from(result.entries());
  }, [activities]);

  async function removeActivity(activity: DbActivity) {
    const confirmed = window.confirm(
      `Usunąć aktywność „${activity.activity_type}” z dnia ${formatDate(
        activity.activity_date
      )}?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(activity.id);
    setError("");

    const supabase = createClient();

    if (!supabase) {
      setError("Nie udało się połączyć z Supabase.");
      setDeletingId(null);
      return;
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setError("Sesja użytkownika wygasła.");
      setDeletingId(null);
      return;
    }

    const { error: deleteError } = await supabase
      .from("activities")
      .delete()
      .eq("id", activity.id)
      .eq("user_id", authData.user.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
    await onDeleted();
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Aktywności i treningi</h2>
          <p className="muted mt-1 text-sm">
            Czas, spalone kalorie, kroki i dzienny bilans aktywności.
          </p>
        </div>

        <button type="button" onClick={onAdd} className="btn btn-primary">
          <Plus size={18} />
          Dodaj aktywność
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <ActivityWeeklyChart activities={activities} />

      {activities.length === 0 ? (
        <Empty
          title="Brak aktywności"
          text="Dodaj pierwszy trening, spacer, bieg lub inną aktywność."
          icon={<Dumbbell size={28} />}
        />
      ) : (
        <div className="space-y-5">
          {grouped.map(([date, dayActivities]) => {
            const activityCalories = dayActivities.reduce(
              (sum, activity) =>
                sum + Number(activity.calories_burned ?? 0),
              0
            );
            const steps = dayActivities.reduce(
              (sum, activity) => sum + Number(activity.steps ?? 0),
              0
            );
            const stepCalories = Math.round(steps * 0.04);
            const total = Math.round(activityCalories + stepCalories);

            return (
              <section className="card p-5" key={date}>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-emerald-900/40 pb-4">
                  <div>
                    <h3 className="text-lg font-black">{formatDate(date)}</h3>
                    <p className="muted mt-1 text-sm">
                      {dayActivities.length} aktywności
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-right">
                    <div className="rounded-xl bg-emerald-950/50 px-3 py-2">
                      <div className="muted text-xs">Spalone razem</div>
                      <div className="font-black">{total} kcal</div>
                    </div>
                    <div className="rounded-xl bg-emerald-950/50 px-3 py-2">
                      <div className="muted text-xs">Kroki</div>
                      <div className="font-black">
                        {steps.toLocaleString("pl-PL")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {dayActivities.map((activity) => (
                    <article
                      key={activity.id}
                      className="rounded-2xl bg-emerald-950/35 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="font-black">
                            {activity.activity_type}
                          </h4>

                          <div className="muted mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                            {activity.duration_minutes != null && (
                              <span className="inline-flex items-center gap-1.5">
                                <Clock3 size={15} />
                                {activity.duration_minutes} min
                              </span>
                            )}

                            {activity.calories_burned != null && (
                              <span className="inline-flex items-center gap-1.5">
                                <Zap size={15} />
                                {activity.calories_burned} kcal
                              </span>
                            )}

                            {activity.steps != null && (
                              <span className="inline-flex items-center gap-1.5">
                                <Footprints size={15} />
                                {activity.steps.toLocaleString("pl-PL")} kroków
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="btn btn-secondary px-3"
                            onClick={() => onEdit(activity)}
                            aria-label="Edytuj aktywność"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary px-3 text-red-200"
                            onClick={() => void removeActivity(activity)}
                            disabled={deletingId === activity.id}
                            aria-label="Usuń aktywność"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>

                      {activity.notes?.trim() && (
                        <p className="muted mt-3 text-sm">{activity.notes}</p>
                      )}
                    </article>
                  ))}
                </div>

                {steps > 0 && (
                  <p className="muted mt-4 text-xs">
                    Szacunkowe kalorie z kroków: {stepCalories} kcal
                    (0,04 kcal na krok). Wpisane kalorie aktywności są
                    doliczane osobno.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Measurements({
  measurements,
  onAdd,
  onEdit,
  onDeleted,
}: {
  measurements: DbMeasurement[];
  onAdd: () => void;
  onEdit: (measurement: DbMeasurement) => void;
  onDeleted: () => Promise<void>;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function removeMeasurement(measurement: DbMeasurement) {
    const confirmed = window.confirm(
      `Usunąć pomiar z dnia ${formatDate(measurement.measured_at)}?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(measurement.id);
    setError("");

    const supabase = createClient();

    if (!supabase) {
      setError("Nie udało się połączyć z Supabase.");
      setDeletingId(null);
      return;
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setError("Sesja użytkownika wygasła.");
      setDeletingId(null);
      return;
    }

    const { error: deleteError } = await supabase
      .from("body_measurements")
      .delete()
      .eq("id", measurement.id)
      .eq("user_id", authData.user.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
    await onDeleted();
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Historia pomiarów</h2>
          <p className="muted mt-1 text-sm">
            Waga, obwody, poziom tkanki tłuszczowej i notatki.
          </p>
        </div>

        <button type="button" onClick={onAdd} className="btn btn-primary">
          <Plus size={18} />
          Dodaj pomiar
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <MeasurementTrendChart measurements={measurements} />

      {measurements.length === 0 ? (
        <Empty
          title="Brak pomiarów"
          text="Dodaj pierwszy zapis masy lub obwodów."
          icon={<Weight size={28} />}
        />
      ) : (
        <div className="grid gap-4">
          {[...measurements].reverse().map((measurement) => (
            <article className="card p-5" key={measurement.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="muted text-sm">
                    {formatDate(measurement.measured_at)}
                  </div>

                  <div className="mt-1 text-2xl font-black">
                    {measurement.weight != null
                      ? `${measurement.weight} kg`
                      : "Pomiar sylwetki"}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary px-3"
                    onClick={() => onEdit(measurement)}
                    aria-label="Edytuj pomiar"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary px-3 text-red-200"
                    onClick={() => void removeMeasurement(measurement)}
                    disabled={deletingId === measurement.id}
                    aria-label="Usuń pomiar"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>

              <MeasurementValues measurement={measurement} />

              {measurement.notes?.trim() && (
                <div className="mt-4 rounded-2xl bg-emerald-950/50 p-4 text-sm text-emerald-50">
                  {measurement.notes}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function MeasurementValues({
  measurement,
  compact = false,
}: {
  measurement: DbMeasurement;
  compact?: boolean;
}) {
  const values = [
    ["Masa", measurement.weight, "kg"],
    ["Pas", measurement.waist_cm, "cm"],
    ["Biodra", measurement.hips_cm, "cm"],
    ["Klatka", measurement.chest_cm, "cm"],
    ["Ramię", measurement.arm_cm, "cm"],
    ["Przedramię", measurement.forearm_cm, "cm"],
    ["Udo", measurement.thigh_cm, "cm"],
    ["Łydka", measurement.calf_cm, "cm"],
    ["Szyja", measurement.neck_cm, "cm"],
    ["Tkanka tłuszczowa", measurement.body_fat_percentage, "%"],
  ].filter(([, value]) => value != null);

  if (values.length === 0) {
    return (
      <p className="muted mt-4 text-sm">
        Ten wpis nie zawiera wartości liczbowych.
      </p>
    );
  }

  return (
    <div
      className={`mt-4 grid gap-2 ${
        compact ? "grid-cols-2 md:grid-cols-5" : "grid-cols-2 md:grid-cols-5"
      }`}
    >
      {values.map(([label, value, unit]) => (
        <div
          key={String(label)}
          className="rounded-2xl bg-emerald-950/50 p-3"
        >
          <div className="muted text-xs">{label}</div>
          <div className="mt-1 font-black">
            {value} {unit}
          </div>
        </div>
      ))}
    </div>
  );
}


function Nutrition({
  meals,
  activities,
  goal,
  onAddMeal,
  onEditMeal,
  onEditGoal,
  onDeleted,
}: {
  meals: DbMeal[];
  activities: DbActivity[];
  goal: NutritionGoal | null;
  onAddMeal: () => void;
  onEditMeal: (meal: DbMeal) => void;
  onEditGoal: () => void;
  onDeleted: () => Promise<void>;
}) {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const dayMeals = meals.filter((meal) => meal.meal_date === selectedDate);
  const dayActivities = activities.filter(
    (activity) => activity.activity_date === selectedDate
  );

  const totals = dayMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + Number(meal.calories ?? 0),
      protein: acc.protein + Number(meal.protein ?? 0),
      fat: acc.fat + Number(meal.fat ?? 0),
      carbs: acc.carbs + Number(meal.carbs ?? 0),
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  const activityCalories = dayActivities.reduce(
    (sum, activity) => sum + Number(activity.calories_burned ?? 0),
    0
  );
  const steps = dayActivities.reduce(
    (sum, activity) => sum + Number(activity.steps ?? 0),
    0
  );
  const stepCalories = Math.round(steps * 0.04);
  const burned = Math.round(activityCalories + stepCalories);
  const baseTarget = Number(goal?.calories_target ?? 2000);
  const target =
    baseTarget + (goal?.include_activity_calories ? burned : 0);
  const remaining = Math.round(target - totals.calories);

  async function removeMeal(meal: DbMeal) {
    const confirmed = window.confirm(`Usunąć posiłek „${meal.name}”?`);
    if (!confirmed) return;

    setDeletingId(meal.id);
    setError("");

    const supabase = createClient();
    if (!supabase) {
      setError("Nie udało się połączyć z Supabase.");
      setDeletingId(null);
      return;
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setError("Sesja użytkownika wygasła.");
      setDeletingId(null);
      return;
    }

    const { error: deleteError } = await supabase
      .from("meals")
      .delete()
      .eq("id", meal.id)
      .eq("user_id", authData.user.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
    await onDeleted();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="block text-sm">
          <span className="mb-2 block font-bold">Dzień</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn btn-secondary" onClick={onEditGoal}>
            <Target size={18} />
            Ustaw cel
          </button>
          <button type="button" className="btn btn-primary" onClick={onAddMeal}>
            <Plus size={18} />
            Dodaj posiłek
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <section className="card p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <NutritionMetric label="Kalorie" value={`${Math.round(totals.calories)} kcal`} target={`${Math.round(target)} kcal`} />
          <NutritionMetric label="Białko" value={`${totals.protein.toFixed(1)} g`} target={goal?.protein_target != null ? `${goal.protein_target} g` : "brak celu"} />
          <NutritionMetric label="Tłuszcze" value={`${totals.fat.toFixed(1)} g`} target={goal?.fat_target != null ? `${goal.fat_target} g` : "brak celu"} />
          <NutritionMetric label="Węglowodany" value={`${totals.carbs.toFixed(1)} g`} target={goal?.carbs_target != null ? `${goal.carbs_target} g` : "brak celu"} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-emerald-950/50 p-4">
            <div className="muted text-xs">Cel bazowy</div>
            <div className="mt-1 text-xl font-black">{Math.round(baseTarget)} kcal</div>
          </div>
          <div className="rounded-2xl bg-emerald-950/50 p-4">
            <div className="muted text-xs">Spalone aktywnością</div>
            <div className="mt-1 text-xl font-black">{burned} kcal</div>
          </div>
          <div className={`rounded-2xl p-4 ${remaining >= 0 ? "bg-emerald-300/10" : "bg-red-500/10"}`}>
            <div className="muted text-xs">
              {remaining >= 0 ? "Pozostało" : "Przekroczono"}
            </div>
            <div className="mt-1 text-xl font-black">
              {Math.abs(remaining)} kcal
            </div>
          </div>
        </div>

        <p className="muted mt-4 text-xs">
          {goal?.include_activity_calories
            ? "Spalone kalorie zwiększają dzienny limit."
            : "Spalone kalorie nie zwiększają dziennego limitu."}
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <MacroDonutChart totals={totals} goal={goal} />
        <WeeklyCaloriesChart meals={meals} activities={activities} goal={goal} />
      </div>

      {dayMeals.length === 0 ? (
        <Empty
          title="Brak posiłków"
          text="Dodaj posiłek albo ręcznie przepisz dzienne podsumowanie z Fitatu."
          icon={<Salad size={28} />}
        />
      ) : (
        <div className="grid gap-3">
          {dayMeals.map((meal) => (
            <article className="card p-5" key={meal.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="muted text-xs uppercase tracking-wide">
                    {meal.meal_type}
                  </div>
                  <h3 className="mt-1 text-lg font-black">{meal.name}</h3>
                  <div className="muted mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span>{meal.calories} kcal</span>
                    <span>B: {meal.protein} g</span>
                    <span>T: {meal.fat} g</span>
                    <span>W: {meal.carbs} g</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary px-3"
                    onClick={() => onEditMeal(meal)}
                    aria-label="Edytuj posiłek"
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary px-3 text-red-200"
                    onClick={() => void removeMeal(meal)}
                    disabled={deletingId === meal.id}
                    aria-label="Usuń posiłek"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>

              {meal.notes?.trim() && (
                <p className="muted mt-3 text-sm">{meal.notes}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function NutritionMetric({
  label,
  value,
  target,
}: {
  label: string;
  value: string;
  target: string;
}) {
  return (
    <div className="rounded-2xl bg-emerald-950/50 p-4">
      <div className="muted text-xs">{label}</div>
      <div className="mt-1 text-xl font-black">{value}</div>
      <div className="muted mt-1 text-xs">cel: {target}</div>
    </div>
  );
}


function Supplements({
  supplements,
  schedules,
  intakes,
  onAdd,
  onEdit,
  onChanged,
}: {
  supplements: UserSupplement[];
  schedules: SupplementSchedule[];
  intakes: SupplementIntake[];
  onAdd: () => void;
  onEdit: (supplement: UserSupplement) => void;
  onChanged: () => Promise<void>;
}) {
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const day = new Date().getDay() === 0 ? 7 : new Date().getDay();

  const todaysItems = supplements.flatMap((supplement) =>
    schedules
      .filter(
        (schedule) =>
          schedule.user_supplement_id === supplement.id &&
          schedule.days_of_week.includes(day)
      )
      .map((schedule) => ({
        supplement,
        schedule,
        intake: intakes.find(
          (intake) =>
            intake.user_supplement_id === supplement.id &&
            intake.schedule_id === schedule.id &&
            intake.planned_date === today
        ),
      }))
  );

  async function requestNotifications() {
    setError("");

    if (typeof Notification === "undefined") {
      setError("Ta przeglądarka nie obsługuje powiadomień.");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      setError("Nie przyznano zgody na powiadomienia.");
    }
  }

  async function markStatus(
    supplement: UserSupplement,
    schedule: SupplementSchedule,
    status: "taken" | "skipped"
  ) {
    setError("");
    const supabase = createClient();

    if (!supabase) {
      setError("Nie udało się połączyć z Supabase.");
      return;
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setError("Sesja użytkownika wygasła.");
      return;
    }

    const now = new Date().toISOString();

    const { error: saveError } = await supabase
      .from("supplement_intakes")
      .upsert(
        {
          user_id: authData.user.id,
          user_supplement_id: supplement.id,
          schedule_id: schedule.id,
          planned_date: today,
          planned_time: schedule.reminder_time,
          status,
          taken_at: status === "taken" ? now : null,
          skipped_at: status === "skipped" ? now : null,
        },
        {
          onConflict:
            "user_supplement_id,schedule_id,planned_date,planned_time",
        }
      );

    if (saveError) {
      setError(saveError.message);
      return;
    }

    await onChanged();
  }

  async function removeSupplement(supplement: UserSupplement) {
    if (!window.confirm(`Usunąć suplement „${supplementName(supplement)}”?`)) {
      return;
    }

    setDeletingId(supplement.id);
    setError("");

    const supabase = createClient();

    if (!supabase) {
      setError("Nie udało się połączyć z Supabase.");
      setDeletingId(null);
      return;
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setError("Sesja użytkownika wygasła.");
      setDeletingId(null);
      return;
    }

    const { error: deleteError } = await supabase
      .from("user_supplements")
      .delete()
      .eq("id", supplement.id)
      .eq("user_id", authData.user.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
    await onChanged();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Suplementacja</h2>
          <p className="muted mt-1 text-sm">
            Harmonogram, przypomnienia i codzienne odhaczanie.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void requestNotifications()}
          >
            <BellRing size={18} />
            Włącz powiadomienia
          </button>

          <button type="button" className="btn btn-primary" onClick={onAdd}>
            <Plus size={18} />
            Dodaj suplement
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <section className="card p-5">
        <h3 className="text-lg font-black">Plan na dzisiaj</h3>
        <p className="muted mt-1 text-sm">{formatDate(today)}</p>

        {todaysItems.length === 0 ? (
          <p className="muted mt-5 text-sm">
            Na dziś nie masz zaplanowanych suplementów.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {todaysItems
              .sort((a, b) =>
                a.schedule.reminder_time.localeCompare(
                  b.schedule.reminder_time
                )
              )
              .map(({ supplement, schedule, intake }) => (
                <article
                  key={schedule.id}
                  className="rounded-2xl bg-emerald-950/40 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="muted text-xs">
                        {schedule.reminder_time.slice(0, 5)}
                      </div>
                      <h4 className="mt-1 font-black">
                        {supplementName(supplement)}
                      </h4>
                      <p className="muted mt-1 text-sm">
                        {formatSupplementDose(supplement)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={`btn ${
                          intake?.status === "taken"
                            ? "btn-primary"
                            : "btn-secondary"
                        }`}
                        onClick={() =>
                          void markStatus(supplement, schedule, "taken")
                        }
                      >
                        <CheckCircle2 size={17} />
                        Wzięte
                      </button>

                      <button
                        type="button"
                        className={`btn ${
                          intake?.status === "skipped"
                            ? "btn-primary"
                            : "btn-secondary"
                        }`}
                        onClick={() =>
                          void markStatus(supplement, schedule, "skipped")
                        }
                      >
                        Pomiń
                      </button>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        )}
      </section>

      {supplements.length === 0 ? (
        <Empty
          title="Brak suplementów"
          text="Wybierz suplement z katalogu albo dodaj własny."
          icon={<Pill size={28} />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {supplements.map((supplement) => {
            const schedule = schedules.find(
              (item) => item.user_supplement_id === supplement.id
            );
            const catalog = supplement.supplement_catalog;

            return (
              <article className="card p-5" key={supplement.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="muted text-xs uppercase tracking-wide">
                      {catalog?.category ?? "Własny suplement"}
                    </div>
                    <h3 className="mt-1 text-lg font-black">
                      {supplementName(supplement)}
                    </h3>
                    <p className="mt-1 font-bold text-emerald-200">
                      {formatSupplementDose(supplement)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary px-3"
                      onClick={() => onEdit(supplement)}
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary px-3 text-red-200"
                      onClick={() => void removeSupplement(supplement)}
                      disabled={deletingId === supplement.id}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                {schedule && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-950/50 p-3 text-sm">
                    <Bell size={16} />
                    {schedule.reminder_time.slice(0, 5)} •{" "}
                    {formatDays(schedule.days_of_week)}
                  </div>
                )}

                {catalog?.timing_guidance && (
                  <p className="muted mt-4 text-sm">
                    <strong className="text-emerald-100">Kiedy:</strong>{" "}
                    {catalog.timing_guidance}
                  </p>
                )}

                {catalog?.usage_guidance && (
                  <p className="muted mt-3 text-sm">
                    <strong className="text-emerald-100">Informacja:</strong>{" "}
                    {catalog.usage_guidance}
                  </p>
                )}

                {catalog?.safety_note && (
                  <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-100">
                    {catalog.safety_note}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      <p className="muted text-xs">
        Katalog podaje wartości orientacyjne i jednostki właściwe dla danego
        składnika. Nie każdy suplement powinien być podawany w mg — część
        stosuje się w gramach, mikrogramach lub IU. Powiadomienia przeglądarkowe
        działają, gdy aplikacja jest otwarta; pełne powiadomienia w tle wymagają
        późniejszego wdrożenia web push.
      </p>
    </div>
  );
}

function Stats({
  measurements,
  activities,
  meals,
  goal,
}: {
  measurements: DbMeasurement[];
  activities: DbActivity[];
  meals: DbMeal[];
  goal: NutritionGoal | null;
}) {
  const hasAnyData =
    measurements.length > 0 || activities.length > 0 || meals.length > 0;

  if (!hasAnyData) {
    return (
      <Empty
        title="Brak danych do statystyk"
        text="Dodaj pomiary, aktywności lub posiłki, aby zobaczyć wykresy."
        icon={<BarChart3 size={28} />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black">Twoje statystyki</h2>
        <p className="muted mt-1 text-sm">
          Najważniejsze trendy masy, obwodów, aktywności i kalorii.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <WeightTrendChart measurements={measurements} />
        <ActivityWeeklyChart activities={activities} />
        <WeeklyCaloriesChart meals={meals} activities={activities} goal={goal} />
        <MeasurementTrendChart measurements={measurements} />
      </div>
    </div>
  );
}

function ProfileView({
  profile,
  onLogout,
}: {
  profile: Profile;
  onLogout: () => void;
}) {
  return (
    <div className="card max-w-xl p-5">
      <h2 className="text-xl font-black">{profile.name}</h2>

      <div className="muted mt-1">
        {getAge(profile.birth_date)} lat • {profile.height_cm} cm
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-emerald-950/60 p-4">
          <div className="muted text-xs">Cel</div>
          <div className="mt-1 font-black">{goalLabel(profile.goal)}</div>
          <div className="muted mt-1 text-sm">
            Docelowo {profile.target_weight} kg
          </div>
        </div>

        <div className="rounded-2xl bg-emerald-950/60 p-4">
          <div className="muted text-xs">Tryb kalorii</div>
          <div className="mt-1 font-black">
            {profile.calorie_mode === "fixed" ? "Stały" : "Dynamiczny"}
          </div>
          <div className="muted mt-1 text-sm">
            {activityLabel(profile.activity_level)}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="btn btn-secondary mt-6"
      >
        <LogOut size={18} />
        Wyloguj się
      </button>
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note?: string;
  icon: typeof Weight;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="muted text-sm">{label}</span>
        <Icon size={18} className="text-emerald-300" />
      </div>

      <div className="mt-2 text-2xl font-black">{value}</div>

      {note && <div className="muted mt-1 text-xs">{note}</div>}
    </div>
  );
}

function Empty({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card grid min-h-52 place-items-center p-8 text-center">
      <div>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-300">
          {icon}
        </div>

        <h2 className="mt-4 text-xl font-black">{title}</h2>

        <p className="muted mx-auto mt-2 max-w-md">{text}</p>
      </div>
    </div>
  );
}




function SupplementModal({
  supplement,
  catalog,
  schedules,
  onClose,
  onSaved,
}: {
  supplement: UserSupplement | null;
  catalog: SupplementCatalogItem[];
  schedules: SupplementSchedule[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const existingSchedule = supplement
    ? schedules.find(
        (item) => item.user_supplement_id === supplement.id
      ) ?? null
    : null;

  const [form, setForm] = useState<SupplementForm>(() => {
    if (!supplement) {
      return EMPTY_SUPPLEMENT_FORM;
    }

    return {
      catalog_id: supplement.catalog_id ?? "",
      custom_name: supplement.custom_name ?? "",
      amount: String(supplement.amount),
      unit: supplement.unit,
      instructions: supplement.instructions ?? "",
      notes: supplement.notes ?? "",
      reminder_time: existingSchedule?.reminder_time.slice(0, 5) ?? "08:00",
      days_of_week: existingSchedule?.days_of_week ?? [1, 2, 3, 4, 5, 6, 7],
      notification_enabled:
        existingSchedule?.notification_enabled ?? true,
    };
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedCatalog = catalog.find(
    (item) => item.id === form.catalog_id
  );

  function chooseCatalog(catalogId: string) {
    const item = catalog.find((catalogItem) => catalogItem.id === catalogId);

    setForm((current) => ({
      ...current,
      catalog_id: catalogId,
      custom_name: "",
      amount:
        item?.default_amount != null
          ? String(item.default_amount)
          : "",
      unit: item?.default_unit ?? "mg",
      instructions: item?.timing_guidance ?? "",
    }));
  }

  function toggleDay(day: number) {
    setForm((current) => ({
      ...current,
      days_of_week: current.days_of_week.includes(day)
        ? current.days_of_week.filter((value) => value !== day)
        : [...current.days_of_week, day].sort(),
    }));
  }

  async function save() {
    setError("");

    const amount = parseNumber(form.amount);

    if (!form.catalog_id && form.custom_name.trim().length < 2) {
      setError("Wybierz suplement z katalogu albo wpisz własną nazwę.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
      setError("Podaj prawidłową ilość.");
      return;
    }

    if (!form.unit.trim()) {
      setError("Podaj jednostkę.");
      return;
    }

    if (!form.reminder_time) {
      setError("Wybierz godzinę przypomnienia.");
      return;
    }

    if (form.days_of_week.length === 0) {
      setError("Wybierz przynajmniej jeden dzień tygodnia.");
      return;
    }

    setSaving(true);

    const supabase = createClient();

    if (!supabase) {
      setError("Nie udało się połączyć z Supabase.");
      setSaving(false);
      return;
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setError("Sesja użytkownika wygasła.");
      setSaving(false);
      return;
    }

    const mgEquivalent = calculateMgEquivalent(
      amount,
      form.unit,
      selectedCatalog
    );

    const payload = {
      user_id: authData.user.id,
      catalog_id: form.catalog_id || null,
      custom_name: form.catalog_id ? null : form.custom_name.trim(),
      amount,
      unit: form.unit.trim(),
      amount_mg_equivalent: mgEquivalent,
      instructions: form.instructions.trim() || null,
      notes: form.notes.trim() || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    let supplementId = supplement?.id ?? null;

    if (supplement) {
      const { error: updateError } = await supabase
        .from("user_supplements")
        .update(payload)
        .eq("id", supplement.id)
        .eq("user_id", authData.user.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("user_supplements")
        .insert(payload)
        .select("id")
        .single();

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }

      supplementId = inserted.id;
    }

    if (!supplementId) {
      setError("Nie udało się ustalić identyfikatora suplementu.");
      setSaving(false);
      return;
    }

    if (existingSchedule) {
      const { error: scheduleError } = await supabase
        .from("supplement_schedules")
        .update({
          reminder_time: form.reminder_time,
          days_of_week: form.days_of_week,
          notification_enabled: form.notification_enabled,
        })
        .eq("id", existingSchedule.id)
        .eq("user_id", authData.user.id);

      if (scheduleError) {
        setError(scheduleError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: scheduleError } = await supabase
        .from("supplement_schedules")
        .insert({
          user_id: authData.user.id,
          user_supplement_id: supplementId,
          reminder_time: form.reminder_time,
          days_of_week: form.days_of_week,
          notification_enabled: form.notification_enabled,
        });

      if (scheduleError) {
        setError(scheduleError.message);
        setSaving(false);
        return;
      }
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-0 md:p-4">
      <div className="mx-auto min-h-full w-full md:flex md:items-center md:justify-center">
        <section className="card min-h-screen w-full rounded-none p-5 md:min-h-0 md:max-w-3xl md:rounded-[20px] md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                {supplement ? "Edytuj suplement" : "Dodaj suplement"}
              </h2>
              <p className="muted mt-1 text-sm">
                Wartości w katalogu są orientacyjne, a nie indywidualną poradą
                medyczną.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-secondary px-3"
              onClick={onClose}
              disabled={saving}
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block text-sm md:col-span-2">
              <span className="mb-2 block font-bold">
                Suplement z katalogu
              </span>
              <select
                value={form.catalog_id}
                onChange={(event) => chooseCatalog(event.target.value)}
              >
                <option value="">Własny suplement</option>
                {catalog.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.category} — {item.name}
                  </option>
                ))}
              </select>
            </label>

            {!form.catalog_id && (
              <label className="block text-sm md:col-span-2">
                <span className="mb-2 block font-bold">Własna nazwa</span>
                <input
                  value={form.custom_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      custom_name: event.target.value,
                    }))
                  }
                  placeholder="Np. preparat zalecony przez lekarza"
                />
              </label>
            )}

            <label className="block text-sm">
              <span className="mb-2 block font-bold">Ilość</span>
              <input
                inputMode="decimal"
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                placeholder="Np. 5"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-2 block font-bold">Jednostka</span>
              <select
                value={form.unit}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    unit: event.target.value,
                  }))
                }
              >
                <option value="mg">mg</option>
                <option value="g">g</option>
                <option value="mcg">mcg</option>
                <option value="IU">IU</option>
                <option value="ml">ml</option>
                <option value="kaps.">kaps.</option>
                <option value="tabl.">tabl.</option>
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-2 block font-bold">
                Godzina przypomnienia
              </span>
              <input
                type="time"
                value={form.reminder_time}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    reminder_time: event.target.value,
                  }))
                }
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl bg-emerald-950/50 p-4 text-sm">
              <input
                type="checkbox"
                checked={form.notification_enabled}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notification_enabled: event.target.checked,
                  }))
                }
                className="h-5 w-5"
              />
              <span className="font-bold">Powiadomienie aktywne</span>
            </label>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-sm font-bold">Dni tygodnia</div>
            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map((day) => (
                <button
                  type="button"
                  key={day.value}
                  className={`rounded-xl px-3 py-2 text-sm font-bold ${
                    form.days_of_week.includes(day.value)
                      ? "bg-emerald-300 text-[#07120c]"
                      : "bg-emerald-950 text-emerald-100"
                  }`}
                  onClick={() => toggleDay(day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <label className="mt-5 block text-sm">
            <span className="mb-2 block font-bold">
              Instrukcja przyjmowania
            </span>
            <textarea
              value={form.instructions}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  instructions: event.target.value,
                }))
              }
              rows={3}
            />
          </label>

          <label className="mt-5 block text-sm">
            <span className="mb-2 block font-bold">Własna notatka</span>
            <textarea
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              rows={3}
              placeholder="Np. marka, liczba kapsułek, zalecenie lekarza"
            />
          </label>

          {selectedCatalog && (
            <div className="mt-5 space-y-3">
              {selectedCatalog.amount_mg_equivalent != null && (
                <p className="rounded-xl bg-emerald-950/50 p-3 text-sm">
                  Wartość domyślna odpowiada{" "}
                  <strong>
                    {selectedCatalog.amount_mg_equivalent} mg
                  </strong>
                  .
                </p>
              )}

              {selectedCatalog.usage_guidance && (
                <p className="muted text-sm">
                  {selectedCatalog.usage_guidance}
                </p>
              )}

              {selectedCatalog.safety_note && (
                <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">
                  {selectedCatalog.safety_note}
                </p>
              )}

              {selectedCatalog.requires_professional_guidance && (
                <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">
                  Ten suplement wymaga indywidualnego doboru przez lekarza lub
                  dietetyka na podstawie wskazań i badań.
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className="btn btn-secondary flex-1"
              onClick={onClose}
              disabled={saving}
            >
              Anuluj
            </button>
            <button
              type="button"
              className="btn btn-primary flex-1"
              onClick={() => void save()}
              disabled={saving}
            >
              {saving ? "Zapisywanie…" : "Zapisz suplement"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function MealModal({
  meal,
  onClose,
  onSaved,
}: {
  meal: DbMeal | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<MealForm>(() =>
    meal ? mealToForm(meal) : EMPTY_MEAL_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField(key: keyof MealForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setError("");

    const calories = parseNumber(form.calories);
    const protein = parseNumber(form.protein || "0");
    const fat = parseNumber(form.fat || "0");
    const carbs = parseNumber(form.carbs || "0");

    if (!form.meal_date) {
      setError("Wybierz datę.");
      return;
    }
    if (!form.name.trim()) {
      setError("Wpisz nazwę posiłku lub podsumowania.");
      return;
    }
    if (!Number.isFinite(calories) || calories < 0 || calories > 20000) {
      setError("Kalorie muszą mieścić się od 0 do 20000 kcal.");
      return;
    }
    for (const [label, value] of [
      ["Białko", protein],
      ["Tłuszcze", fat],
      ["Węglowodany", carbs],
    ] as const) {
      if (!Number.isFinite(value) || value < 0 || value > 2000) {
        setError(`${label}: podaj wartość od 0 do 2000 g.`);
        return;
      }
    }

    setSaving(true);
    const supabase = createClient();

    if (!supabase) {
      setError("Nie udało się połączyć z Supabase.");
      setSaving(false);
      return;
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setError("Sesja użytkownika wygasła.");
      setSaving(false);
      return;
    }

    const payload = {
      user_id: authData.user.id,
      meal_date: form.meal_date,
      meal_type: form.meal_type,
      name: form.name.trim(),
      calories,
      protein,
      fat,
      carbs,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const request = meal
      ? supabase
          .from("meals")
          .update(payload)
          .eq("id", meal.id)
          .eq("user_id", authData.user.id)
      : supabase.from("meals").insert(payload);

    const { error: saveError } = await request;

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-0 md:p-4">
      <div className="mx-auto min-h-full w-full md:flex md:items-center md:justify-center">
        <section className="card min-h-screen w-full rounded-none p-5 md:min-h-0 md:max-w-2xl md:rounded-[20px] md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                {meal ? "Edytuj posiłek" : "Dodaj posiłek"}
              </h2>
              <p className="muted mt-1 text-sm">
                Możesz też dodać jeden wpis jako dzienne podsumowanie z Fitatu.
              </p>
            </div>
            <button type="button" className="btn btn-secondary px-3" onClick={onClose} disabled={saving}>
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-2 block font-bold">Data</span>
              <input type="date" value={form.meal_date} onChange={(e) => updateField("meal_date", e.target.value)} />
            </label>

            <label className="block text-sm">
              <span className="mb-2 block font-bold">Typ posiłku</span>
              <select value={form.meal_type} onChange={(e) => updateField("meal_type", e.target.value)}>
                {MEAL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>

            <label className="block text-sm md:col-span-2">
              <span className="mb-2 block font-bold">Nazwa</span>
              <input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Np. Owsianka albo Podsumowanie Fitatu" />
            </label>

            {[
              ["calories", "Kalorie", "kcal"],
              ["protein", "Białko", "g"],
              ["fat", "Tłuszcze", "g"],
              ["carbs", "Węglowodany", "g"],
            ].map(([key, label, unit]) => (
              <label className="block text-sm" key={key}>
                <span className="mb-2 block font-bold">{label}</span>
                <div className="relative">
                  <input
                    inputMode="decimal"
                    value={form[key as keyof MealForm] as string}
                    onChange={(e) => updateField(key as keyof MealForm, e.target.value)}
                    placeholder="0"
                    className="pr-16"
                  />
                  <span className="muted absolute right-4 top-1/2 -translate-y-1/2 font-bold">{unit}</span>
                </div>
              </label>
            ))}
          </div>

          <label className="mt-5 block text-sm">
            <span className="mb-2 block font-bold">Notatka</span>
            <textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} rows={4} placeholder="Opcjonalna notatka" />
          </label>

          {error && <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

          <div className="mt-6 flex gap-3">
            <button type="button" className="btn btn-secondary flex-1" onClick={onClose} disabled={saving}>Anuluj</button>
            <button type="button" className="btn btn-primary flex-1" onClick={() => void save()} disabled={saving}>
              {saving ? "Zapisywanie…" : "Zapisz posiłek"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function NutritionGoalModal({
  goal,
  onClose,
  onSaved,
}: {
  goal: NutritionGoal | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initialCalories = Number(goal?.calories_target ?? 2000);
  const initialProteinPercent =
    goal?.protein_target != null && initialCalories > 0
      ? Math.round((Number(goal.protein_target) * 4 * 100) / initialCalories)
      : 30;
  const initialFatPercent =
    goal?.fat_target != null && initialCalories > 0
      ? Math.round((Number(goal.fat_target) * 9 * 100) / initialCalories)
      : 25;
  const initialCarbsPercent =
    goal?.carbs_target != null && initialCalories > 0
      ? Math.round((Number(goal.carbs_target) * 4 * 100) / initialCalories)
      : Math.max(0, 100 - initialProteinPercent - initialFatPercent);

  const [form, setForm] = useState<GoalForm>({
    calories_target: String(initialCalories),
    protein_percent: String(initialProteinPercent),
    fat_percent: String(initialFatPercent),
    carbs_percent: String(initialCarbsPercent),
    include_activity_calories: goal?.include_activity_calories ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const calories = parseNumber(form.calories_target);
  const proteinPercent = parseNumber(form.protein_percent);
  const fatPercent = parseNumber(form.fat_percent);
  const carbsPercent = parseNumber(form.carbs_percent);
  const percentSum = proteinPercent + fatPercent + carbsPercent;

  const calculatedProtein =
    Number.isFinite(calories) && Number.isFinite(proteinPercent)
      ? Math.round((calories * proteinPercent) / 100 / 4)
      : 0;
  const calculatedFat =
    Number.isFinite(calories) && Number.isFinite(fatPercent)
      ? Math.round((calories * fatPercent) / 100 / 9)
      : 0;
  const calculatedCarbs =
    Number.isFinite(calories) && Number.isFinite(carbsPercent)
      ? Math.round((calories * carbsPercent) / 100 / 4)
      : 0;

  function applySuggestedMacro() {
    setForm((current) => ({
      ...current,
      protein_percent: "30",
      fat_percent: "25",
      carbs_percent: "45",
    }));
    setError("");
  }

  async function save() {
    setError("");

    if (!Number.isFinite(calories) || calories < 800 || calories > 10000) {
      setError("Cel kalorii musi mieścić się od 800 do 10000 kcal.");
      return;
    }

    const percentages = [proteinPercent, fatPercent, carbsPercent];
    if (
      percentages.some(
        (value) => !Number.isFinite(value) || value < 0 || value > 100
      )
    ) {
      setError("Każda wartość makro musi mieścić się od 0% do 100%.");
      return;
    }

    if (Math.abs(percentSum - 100) > 0.01) {
      setError(`Suma makro musi wynosić 100%. Obecnie wynosi ${percentSum.toFixed(1)}%.`);
      return;
    }

    setSaving(true);
    const supabase = createClient();

    if (!supabase) {
      setError("Nie udało się połączyć z Supabase.");
      setSaving(false);
      return;
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setError("Sesja użytkownika wygasła.");
      setSaving(false);
      return;
    }

    const { error: saveError } = await supabase
      .from("nutrition_goals")
      .upsert(
        {
          user_id: authData.user.id,
          calories_target: calories,
          protein_target: calculatedProtein,
          fat_target: calculatedFat,
          carbs_target: calculatedCarbs,
          include_activity_calories: form.include_activity_calories,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-0 md:p-4">
      <div className="mx-auto min-h-full w-full md:flex md:items-center md:justify-center">
        <section className="card min-h-screen w-full rounded-none p-5 md:min-h-0 md:max-w-2xl md:rounded-[20px] md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">Cel kalorii i makro</h2>
              <p className="muted mt-1 text-sm">
                Wpisz własny podział procentowy. Aplikacja automatycznie przeliczy go na gramy.
              </p>
            </div>
            <button type="button" className="btn btn-secondary px-3" onClick={onClose} disabled={saving}>
              <X size={18} />
            </button>
          </div>

          <label className="mt-6 block text-sm">
            <span className="mb-2 block font-bold">Dzienne kalorie</span>
            <div className="relative">
              <input
                inputMode="decimal"
                value={form.calories_target}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    calories_target: event.target.value,
                  }))
                }
                placeholder="2000"
                className="pr-20"
              />
              <span className="muted absolute right-4 top-1/2 -translate-y-1/2 font-bold">kcal</span>
            </div>
          </label>

          <div className="mt-5 rounded-2xl border border-emerald-300/15 bg-emerald-300/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-black">Proponowany podział</div>
                <div className="muted mt-1 text-sm">
                  Białko 30% · tłuszcze 25% · węglowodany 45%
                </div>
              </div>
              <button type="button" className="btn btn-secondary" onClick={applySuggestedMacro}>
                Ustaw proponowane
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              ["protein_percent", "Białko", calculatedProtein],
              ["fat_percent", "Tłuszcze", calculatedFat],
              ["carbs_percent", "Węglowodany", calculatedCarbs],
            ].map(([key, label, grams]) => (
              <label className="block text-sm" key={String(key)}>
                <span className="mb-2 block font-bold">{String(label)}</span>
                <div className="relative">
                  <input
                    inputMode="decimal"
                    value={form[key as keyof GoalForm] as string}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    placeholder="0"
                    className="pr-12"
                  />
                  <span className="muted absolute right-4 top-1/2 -translate-y-1/2 font-bold">%</span>
                </div>
                <span className="muted mt-2 block text-xs">
                  Około {Number(grams)} g dziennie
                </span>
              </label>
            ))}
          </div>

          <div className={`mt-5 rounded-2xl p-4 ${Math.abs(percentSum - 100) < 0.01 ? "bg-emerald-300/10" : "bg-amber-500/10"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold">Suma udziałów</span>
              <span className="text-lg font-black">{Number.isFinite(percentSum) ? percentSum.toFixed(1) : "0.0"}%</span>
            </div>
            <p className="muted mt-1 text-sm">
              {Math.abs(percentSum - 100) < 0.01
                ? `Wyliczone cele: ${calculatedProtein} g białka, ${calculatedFat} g tłuszczu i ${calculatedCarbs} g węglowodanów.`
                : "Białko, tłuszcze i węglowodany muszą łącznie dawać 100%."}
            </p>
          </div>

          <label className="mt-5 flex items-start gap-3 rounded-2xl bg-emerald-950/50 p-4">
            <input
              type="checkbox"
              checked={form.include_activity_calories}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  include_activity_calories: event.target.checked,
                }))
              }
              className="mt-1 h-5 w-5"
            />
            <span>
              <span className="block font-bold">Zwiększaj limit o aktywność</span>
              <span className="muted mt-1 block text-sm">
                Spalone kalorie z treningów i kroków będą dodawane do dziennego limitu.
              </span>
            </span>
          </label>

          <p className="muted mt-4 text-xs">
            Proponowany podział jest punktem startowym. Własne wartości możesz dopasować do preferencji, tolerancji diety i sposobu treningu.
          </p>

          {error && <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

          <div className="mt-6 flex gap-3">
            <button type="button" className="btn btn-secondary flex-1" onClick={onClose} disabled={saving}>Anuluj</button>
            <button type="button" className="btn btn-primary flex-1" onClick={() => void save()} disabled={saving || Math.abs(percentSum - 100) > 0.01}>
              {saving ? "Zapisywanie…" : "Zapisz cel"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function ActivityModal({
  activity,
  onClose,
  onSaved,
}: {
  activity: DbActivity | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ActivityForm>(() =>
    activity ? activityToForm(activity) : EMPTY_ACTIVITY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField(key: keyof ActivityForm, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function save() {
    setError("");

    if (!form.activity_date) {
      setError("Wybierz datę aktywności.");
      return;
    }

    if (!form.activity_type.trim()) {
      setError("Wybierz lub wpisz rodzaj aktywności.");
      return;
    }

    const duration = nullableNumber(form.duration_minutes);
    const calories = nullableNumber(form.calories_burned);
    const steps = nullableInteger(form.steps);

    if (
      duration == null &&
      calories == null &&
      steps == null
    ) {
      setError(
        "Podaj przynajmniej czas, spalone kalorie albo liczbę kroków."
      );
      return;
    }

    if (
      duration != null &&
      (!Number.isFinite(duration) || duration < 1 || duration > 1440)
    ) {
      setError("Czas aktywności musi wynosić od 1 do 1440 minut.");
      return;
    }

    if (
      calories != null &&
      (!Number.isFinite(calories) || calories < 0 || calories > 10000)
    ) {
      setError("Spalone kalorie muszą mieścić się od 0 do 10000 kcal.");
      return;
    }

    if (
      steps != null &&
      (!Number.isInteger(steps) || steps < 0 || steps > 200000)
    ) {
      setError("Liczba kroków musi mieścić się od 0 do 200000.");
      return;
    }

    setSaving(true);

    const supabase = createClient();

    if (!supabase) {
      setError("Nie udało się połączyć z Supabase.");
      setSaving(false);
      return;
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setError("Sesja użytkownika wygasła.");
      setSaving(false);
      return;
    }

    const payload = {
      user_id: authData.user.id,
      activity_date: form.activity_date,
      activity_type: form.activity_type.trim(),
      duration_minutes: duration,
      calories_burned: calories,
      steps,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (activity) {
      const { error: updateError } = await supabase
        .from("activities")
        .update(payload)
        .eq("id", activity.id)
        .eq("user_id", authData.user.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("activities")
        .insert(payload);

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-0 md:p-4">
      <div className="mx-auto min-h-full w-full md:flex md:items-center md:justify-center">
        <section className="card min-h-screen w-full rounded-none p-5 md:min-h-0 md:max-w-2xl md:rounded-[20px] md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                {activity ? "Edytuj aktywność" : "Dodaj aktywność"}
              </h2>
              <p className="muted mt-1 text-sm">
                Możesz zapisać czas, spalone kcal i opcjonalnie kroki.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-secondary px-3"
              onClick={onClose}
              disabled={saving}
              aria-label="Zamknij"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-2 block font-bold">Data</span>
              <input
                type="date"
                value={form.activity_date}
                onChange={(event) =>
                  updateField("activity_date", event.target.value)
                }
              />
            </label>

            <label className="block text-sm">
              <span className="mb-2 block font-bold">
                Rodzaj aktywności
              </span>
              <input
                list="activity-types"
                value={form.activity_type}
                onChange={(event) =>
                  updateField("activity_type", event.target.value)
                }
                placeholder="Np. Trening siłowy"
              />
              <datalist id="activity-types">
                {ACTIVITY_TYPES.map((type) => (
                  <option value={type} key={type} />
                ))}
              </datalist>
            </label>

            <label className="block text-sm">
              <span className="mb-2 block font-bold">Czas trwania</span>
              <div className="relative">
                <input
                  inputMode="numeric"
                  value={form.duration_minutes}
                  onChange={(event) =>
                    updateField("duration_minutes", event.target.value)
                  }
                  placeholder="Np. 60"
                  className="pr-16"
                />
                <span className="muted absolute right-4 top-1/2 -translate-y-1/2 font-bold">
                  min
                </span>
              </div>
            </label>

            <label className="block text-sm">
              <span className="mb-2 block font-bold">Spalone kalorie</span>
              <div className="relative">
                <input
                  inputMode="decimal"
                  value={form.calories_burned}
                  onChange={(event) =>
                    updateField("calories_burned", event.target.value)
                  }
                  placeholder="Np. 450"
                  className="pr-16"
                />
                <span className="muted absolute right-4 top-1/2 -translate-y-1/2 font-bold">
                  kcal
                </span>
              </div>
            </label>

            <label className="block text-sm md:col-span-2">
              <span className="mb-2 block font-bold">
                Kroki tego dnia (opcjonalnie)
              </span>
              <div className="relative">
                <input
                  inputMode="numeric"
                  value={form.steps}
                  onChange={(event) =>
                    updateField("steps", event.target.value)
                  }
                  placeholder="Np. 8500"
                  className="pr-20"
                />
                <span className="muted absolute right-4 top-1/2 -translate-y-1/2 font-bold">
                  kroków
                </span>
              </div>
              <p className="muted mt-2 text-xs">
                Aplikacja szacuje 0,04 kcal za każdy krok i dolicza je do
                dziennego spalania.
              </p>
            </label>
          </div>

          <label className="mt-5 block text-sm">
            <span className="mb-2 block font-bold">Notatka</span>
            <textarea
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Np. trening nóg, umiarkowana intensywność"
              rows={4}
            />
          </label>

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={saving}
            >
              Anuluj
            </button>

            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="btn btn-primary flex-1"
            >
              {saving ? "Zapisywanie…" : "Zapisz aktywność"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function MeasurementModal({
  measurement,
  onClose,
  onSaved,
}: {
  measurement: DbMeasurement | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<MeasurementForm>(() =>
    measurement ? measurementToForm(measurement) : EMPTY_MEASUREMENT_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const hasAnyNumericValue = useMemo(
    () =>
      MEASUREMENT_FIELDS.some(({ key }) => {
        const value = form[key].trim();
        return value !== "" && Number.isFinite(parseNumber(value));
      }),
    [form]
  );

  function updateField(key: keyof MeasurementForm, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function save() {
    setError("");

    if (!form.measured_at) {
      setError("Wybierz datę pomiaru.");
      return;
    }

    if (!hasAnyNumericValue) {
      setError("Wpisz przynajmniej jeden pomiar.");
      return;
    }

    for (const field of MEASUREMENT_FIELDS) {
      const rawValue = form[field.key].trim();

      if (!rawValue) {
        continue;
      }

      const value = parseNumber(rawValue);

      if (
        !Number.isFinite(value) ||
        value < field.min ||
        value > field.max
      ) {
        setError(
          `${field.label}: podaj wartość od ${field.min} do ${field.max} ${field.unit}.`
        );
        return;
      }
    }

    setSaving(true);

    const supabase = createClient();

    if (!supabase) {
      setError("Nie udało się połączyć z Supabase.");
      setSaving(false);
      return;
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setError("Sesja użytkownika wygasła.");
      setSaving(false);
      return;
    }

    const payload = {
      user_id: authData.user.id,
      measured_at: form.measured_at,
      weight: nullableNumber(form.weight),
      waist_cm: nullableNumber(form.waist_cm),
      hips_cm: nullableNumber(form.hips_cm),
      chest_cm: nullableNumber(form.chest_cm),
      arm_cm: nullableNumber(form.arm_cm),
      forearm_cm: nullableNumber(form.forearm_cm),
      thigh_cm: nullableNumber(form.thigh_cm),
      calf_cm: nullableNumber(form.calf_cm),
      neck_cm: nullableNumber(form.neck_cm),
      body_fat_percentage: nullableNumber(form.body_fat_percentage),
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (measurement) {
      const { error: updateError } = await supabase
        .from("body_measurements")
        .update(payload)
        .eq("id", measurement.id)
        .eq("user_id", authData.user.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("body_measurements")
        .insert(payload);

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-0 md:p-4">
      <div className="mx-auto min-h-full w-full md:flex md:items-center md:justify-center">
        <section className="card min-h-screen w-full rounded-none p-5 md:min-h-0 md:max-w-3xl md:rounded-[20px] md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                {measurement ? "Edytuj pomiar" : "Dodaj pomiar"}
              </h2>
              <p className="muted mt-1 text-sm">
                Obowiązkowa jest data i przynajmniej jedna wartość.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-secondary px-3"
              onClick={onClose}
              disabled={saving}
              aria-label="Zamknij"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6">
            <label className="block text-sm">
              <span className="mb-2 block font-bold">Data pomiaru</span>
              <input
                type="date"
                value={form.measured_at}
                onChange={(event) =>
                  updateField("measured_at", event.target.value)
                }
              />
            </label>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {MEASUREMENT_FIELDS.map((field) => (
              <label className="block text-sm" key={field.key}>
                <span className="mb-2 block font-bold">{field.label}</span>

                <div className="relative">
                  <input
                    inputMode="decimal"
                    value={form[field.key]}
                    onChange={(event) =>
                      updateField(field.key, event.target.value)
                    }
                    placeholder={field.placeholder}
                    className="pr-16"
                  />

                  <span className="muted absolute right-4 top-1/2 -translate-y-1/2 font-bold">
                    {field.unit}
                  </span>
                </div>
              </label>
            ))}
          </div>

          <label className="mt-5 block text-sm">
            <span className="mb-2 block font-bold">Notatka</span>

            <textarea
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Np. pomiar rano, na czczo"
              rows={4}
            />
          </label>

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={saving}
            >
              Anuluj
            </button>

            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || !form.measured_at || !hasAnyNumericValue}
              className="btn btn-primary flex-1"
            >
              {saving ? "Zapisywanie…" : "Zapisz pomiar"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}




function supplementName(supplement: UserSupplement) {
  return (
    supplement.supplement_catalog?.name ??
    supplement.custom_name ??
    "Suplement"
  );
}

function formatSupplementDose(supplement: UserSupplement) {
  const native = `${supplement.amount} ${supplement.unit}`;

  if (
    supplement.amount_mg_equivalent != null &&
    supplement.unit !== "mg"
  ) {
    return `${native} (${supplement.amount_mg_equivalent} mg)`;
  }

  return native;
}

function formatDays(days: number[]) {
  if (days.length === 7) return "codziennie";

  return DAY_OPTIONS.filter((day) => days.includes(day.value))
    .map((day) => day.label)
    .join(", ");
}

function calculateMgEquivalent(
  amount: number,
  unit: string,
  catalog: SupplementCatalogItem | undefined
) {
  if (unit === "mg") return amount;
  if (unit === "g") return amount * 1000;
  if (unit === "mcg") return amount / 1000;

  if (
    catalog?.default_amount != null &&
    catalog.amount_mg_equivalent != null &&
    catalog.default_unit === unit
  ) {
    return (
      amount *
      (catalog.amount_mg_equivalent / catalog.default_amount)
    );
  }

  return null;
}

function mealToForm(meal: DbMeal): MealForm {
  return {
    meal_date: meal.meal_date,
    meal_type: meal.meal_type,
    name: meal.name,
    calories: numberToInput(meal.calories),
    protein: numberToInput(meal.protein),
    fat: numberToInput(meal.fat),
    carbs: numberToInput(meal.carbs),
    notes: meal.notes ?? "",
  };
}

function activityToForm(activity: DbActivity): ActivityForm {
  return {
    activity_date: activity.activity_date,
    activity_type: activity.activity_type,
    duration_minutes: numberToInput(activity.duration_minutes),
    calories_burned: numberToInput(activity.calories_burned),
    steps: numberToInput(activity.steps),
    notes: activity.notes ?? "",
  };
}

function measurementToForm(measurement: DbMeasurement): MeasurementForm {
  return {
    measured_at: measurement.measured_at,
    weight: numberToInput(measurement.weight),
    waist_cm: numberToInput(measurement.waist_cm),
    hips_cm: numberToInput(measurement.hips_cm),
    chest_cm: numberToInput(measurement.chest_cm),
    arm_cm: numberToInput(measurement.arm_cm),
    forearm_cm: numberToInput(measurement.forearm_cm),
    thigh_cm: numberToInput(measurement.thigh_cm),
    calf_cm: numberToInput(measurement.calf_cm),
    neck_cm: numberToInput(measurement.neck_cm),
    body_fat_percentage: numberToInput(measurement.body_fat_percentage),
    notes: measurement.notes ?? "",
  };
}

function numberToInput(value: number | null) {
  return value == null ? "" : String(value);
}

function parseNumber(value: string) {
  return Number(value.replace(",", "."));
}

function nullableNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return parseNumber(trimmed);
}

function nullableInteger(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return Number(trimmed.replace(/\s/g, ""));
}

function formatDate(dateString: string) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("pl-PL");
}


function calculateBmr(
  sex: "male" | "female",
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

function goalLabel(goal: Profile["goal"]) {
  if (goal === "lose") return "Redukcja";
  if (goal === "gain") return "Budowanie masy";
  return "Utrzymanie";
}

function activityLabel(level: Profile["activity_level"]) {
  const labels: Record<Profile["activity_level"], string> = {
    sedentary: "Głównie siedzący",
    light: "Lekko aktywny",
    moderate: "Umiarkowanie aktywny",
    high: "Bardzo aktywny",
    very_high: "Wyjątkowo aktywny",
  };

  return labels[level];
}

function getAge(dateString: string) {
  const birthDate = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    return 0;
  }

  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}
