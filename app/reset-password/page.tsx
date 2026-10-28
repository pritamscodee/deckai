"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/auth-client";
import { AuthCard, authField } from "@/components/site/auth-card";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthCard title="Set a new password" blurb="One moment…" slide={2}><span /></AuthCard>}>
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const linkError = params.get("error");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("password"));
    if (newPassword !== String(form.get("confirm"))) return setError("Those two passwords don't match.");
    setPending(true);
    setError(null);
    const { error } = await resetPassword({ newPassword, token });
    setPending(false);
    if (error) return setError(error.message ?? "That link didn't work. Ask for a new one.");
    setDone(true);
    // Signing in uses the new password, so send them to the form rather than the app.
    setTimeout(() => router.push("/sign-in"), 1500);
  }

  // An expired or already-used link comes back from the callback with ?error=INVALID_TOKEN.
  if (!token || linkError) {
    return (
      <AuthCard title="That link has expired" blurb="Reset links work once and last an hour." slide={2}>
        <div className="flex flex-col gap-4">
          <p className="rounded-[10px] bg-[var(--hl-pink)] px-3 py-2">Ask for a fresh one and it&apos;ll work.</p>
          <Link href="/forgot-password" className="hl-btn w-full">Send a new link</Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={done ? "Password changed" : "Set a new password"}
      blurb={done ? "Taking you to sign in…" : "At least eight characters. You'll use this to sign in from now on."}
      slide={2}
    >
      {done ? (
        <Link href="/sign-in" className="hl-btn w-full">Sign in</Link>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-[16px]">New password
            <input name="password" type="password" required minLength={8} autoComplete="new-password" autoFocus className={authField} />
          </label>
          <label className="flex flex-col gap-2 text-[16px]">Again, to be sure
            <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={authField} />
          </label>
          {error && <p role="alert" className="rounded-[10px] bg-[var(--hl-pink)] px-3 py-2">{error}</p>}
          <button type="submit" disabled={pending} className="hl-btn mt-2 w-full">
            {pending ? "Saving…" : "Save password"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
