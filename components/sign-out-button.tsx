"use client";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button type="button" className="focusable shrink-0 underline decoration-2 underline-offset-4 hover:text-[var(--accent)]"
      onClick={async () => { await signOut(); router.push("/"); }}>
      Sign out
    </button>
  );
}
