import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Connexion — Budget App",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-graphite/5 px-5">
      <div className="w-full max-w-[400px] rounded-3xl bg-background p-6 shadow-sm">
        <div className="mb-6 text-center">
          <span className="text-4xl" aria-hidden>
            💜
          </span>
          <h1 className="mt-2 font-display text-2xl font-extrabold text-plum">
            Budget App
          </h1>
          <p className="text-sm text-graphite/60">
            Connecte-toi pour accéder à tes finances.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
