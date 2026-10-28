"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth-client";
import { AuthCard, authField } from "@/components/site/auth-card";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email"));
    const { error } = await requestPasswordReset({ email, redirectTo: "/reset-password" });
    setPending(false);
    // The API answers the same way whether or not the address exists, so the reply here
    // can't be used to find out who has an account.
    if (error) return setError(error.message ?? "Couldn't send the email. Try again in a moment.");
    setSent(true);
  }

  return (
    <AuthCard
      title={sent ? "Check your email" : "Forgot your password?"}
      blurb={sent
        ? "If that address has an account, a link to choose a new password is on its way."
        : "Type the address you signed up with and we'll send a link to set a new password."}
      slide={2}
    >
      {sent ? (
        <div className="flex flex-col gap-4">
          <p className="rounded-[10px] bg-[var(--hl-mint)] px-3 py-2">
            The link works once and expires in an hour. It can take a minute to arrive — check spam too.
          </p>
          <Link href="/sign-in" className="hl-btn w-full">Back to sign in</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-[16px]">Email
            <input name="email" type="email" required autoComplete="email" autoFocus className={authField} />
          </label>
          {error && <p role="alert" className="rounded-[10px] bg-[var(--hl-pink)] px-3 py-2">{error}</p>}
          <button type="submit" disabled={pending} className="hl-btn mt-2 w-full">
            {pending ? "Sending…" : "Send the link"}
          </button>
          <p className="text-[17px]">
            Remembered it?{" "}
            <Link href="/sign-in" className="focusable underline decoration-2 underline-offset-4 hover:text-[var(--accent)]">Sign in</Link>
          </p>
        </form>
      )}
    </AuthCard>
  );
}
