"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase?.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router]);

  async function submit() {
    setLoading(true); setMessage("");
    const supabase = createClient();
    if (!supabase) { setMessage("Uzupełnij zmienne Supabase w pliku .env.local."); setLoading(false); return; }
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (result.error) { setMessage(result.error.message); setLoading(false); return; }
    if (mode === "register" && !result.data.session) {
      setMessage("Konto utworzone. Potwierdź adres w wiadomości e-mail, a następnie się zaloguj.");
      setLoading(false); return;
    }
    router.replace("/");
    router.refresh();
  }

  return <main className="grid min-h-screen place-items-center p-4"><div className="card w-full max-w-md p-6"><div className="mb-6 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-300 text-2xl font-black text-[#07120c]">F</div><h1 className="mt-4 text-2xl font-black">FormTrack</h1><p className="muted">{mode === "login" ? "Zaloguj się do swojego profilu" : "Utwórz prywatny profil"}</p></div><div className="space-y-4"><input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} /><input type="password" placeholder="Hasło" value={password} onChange={e => setPassword(e.target.value)} /><button onClick={submit} disabled={loading || !email || password.length < 6} className="btn btn-primary w-full">{loading ? "Chwila…" : mode === "login" ? "Zaloguj" : "Zarejestruj"}</button><button onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }} className="w-full text-sm text-emerald-300">{mode === "login" ? "Nie masz konta? Zarejestruj się" : "Masz konto? Zaloguj się"}</button>{message && <p className="rounded-xl bg-emerald-950 p-3 text-sm">{message}</p>}</div></div></main>;
}
