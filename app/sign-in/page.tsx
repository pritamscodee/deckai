"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";
import { AuthCard, authField as field } from "@/components/site/auth-card";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const signingUp = mode === "sign-up";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setPending(true);
    setError(null);
    const { error } = signingUp
      ? await signUp.email({ email, password, name: String(form.get("name") || email.split("@")[0]) })
      : await signIn.email({ email, password });
    setPending(false);
    if (error) return setError(error.message ?? "Something went wrong");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthCard
      title={signingUp ? "Make an account" : "Welcome back"}
      blurb={signingUp ? "Then pick a plan and draw your first deck." : "Sign in to your decks."}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {signingUp && (
          <label className="flex flex-col gap-2 text-[16px]">Name
            <input name="name" autoComplete="name" className={field} />
          </label>
        )}
        <label className="flex flex-col gap-2 text-[16px]">Email
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
        <label className="flex flex-col gap-2 text-[16px]">Password
          <input name="password" type="password" required minLength={signingUp ? 8 : undefined}
            aria-describedby={signingUp ? "pw-rule" : undefined}
            autoComplete={signingUp ? "new-password" : "current-password"} className={field} />
          {signingUp && <span id="pw-rule" className="text-[15px] text-[var(--ink-soft)]">At least 8 characters.</span>}
        </label>
        {error && <p role="alert" className="rounded-[10px] bg-[var(--hl-pink)] px-3 py-2">{error}</p>}
        <button type="submit" disabled={pending} className="hl-btn mt-2 w-full">
          {pending ? "One moment…" : signingUp ? "Create account" : "Sign in"}
        </button>
      </form>
      {!signingUp && (
        <Link href="/forgot-password" className="focusable -mt-2 self-start underline decoration-2 underline-offset-4 hover:text-[var(--accent)]">
          Forgot your password?
        </Link>
      )}
      <p className="text-[17px]">
        {signingUp ? "Already have an account? " : "New to DeckAI? "}
        <button type="button" className="focusable underline decoration-2 underline-offset-4 hover:text-[var(--accent)]"
          onClick={() => { setMode(signingUp ? "sign-in" : "sign-up"); setError(null); }}>
          {signingUp ? "Sign in" : "Make an account"}
        </button>
      </p>
      {signingUp && (
        <p className="text-[15px] text-[var(--ink-soft)]">
          By making an account you agree to our{" "}
          <Link href="/terms" className="underline decoration-2 underline-offset-4">terms</Link> and{" "}
          <Link href="/privacy" className="underline decoration-2 underline-offset-4">privacy policy</Link>.
        </p>
      )}
    </AuthCard>
  );
}
