"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

type Mode = "login" | "signup";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Déjà connectée ? → directement dans l'app.
  useEffect(() => {
    if (!supabaseConfigured) return;
    createClient()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session) {
          router.replace("/");
        }
      });
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!supabaseConfigured) {
      setError(
        "Supabase n'est pas encore configuré. Ajoute tes clés dans .env.local.",
      );
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          // Confirmation e-mail désactivée → connectée immédiatement.
          router.push("/");
          router.refresh();
        } else {
          setInfo(
            "Compte créé. Vérifie tes e-mails pour confirmer, puis connecte-toi.",
          );
          setMode("login");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {!supabaseConfigured && (
        <p className="rounded-xl bg-warning/10 px-3.5 py-2.5 text-xs font-medium text-warning">
          ⚙️ Supabase n&apos;est pas encore connecté — la connexion sera active
          une fois les clés ajoutées dans <code>.env.local</code>.
        </p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-graphite/60">E-mail</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl bg-graphite/5 px-4 py-3 text-graphite outline-none ring-plum/30 focus:ring-2"
          placeholder="toi@exemple.fr"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-graphite/60">
          Mot de passe
        </span>
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl bg-graphite/5 px-4 py-3 text-graphite outline-none ring-plum/30 focus:ring-2"
          placeholder="••••••••"
        />
      </label>

      {error && (
        <p className="rounded-xl bg-error/10 px-3.5 py-2.5 text-xs font-medium text-error">
          {error}
        </p>
      )}
      {info && (
        <p className="rounded-xl bg-success/10 px-3.5 py-2.5 text-xs font-medium text-success">
          {info}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex items-center justify-center rounded-2xl bg-plum py-3.5 text-[15px] font-bold text-white shadow-md shadow-plum/20 transition active:scale-[0.99] disabled:opacity-50"
      >
        {loading
          ? "…"
          : mode === "login"
            ? "Se connecter"
            : "Créer mon compte"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === "login" ? "signup" : "login"));
          setError(null);
          setInfo(null);
        }}
        className="text-center text-xs font-medium text-violet"
      >
        {mode === "login"
          ? "Pas encore de compte ? En créer un"
          : "J'ai déjà un compte — me connecter"}
      </button>
    </form>
  );
}
