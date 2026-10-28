import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { activePlan } from "@/lib/plans";
import { SignOutButton } from "@/components/sign-out-button";
import { Reveal } from "@/components/site/reveal";
import { LEGAL_PAGES } from "@/lib/legal";

const nav = [
  { href: "/dashboard", label: "New deck", key: "home" },
  { href: "/decks", label: "Your decks", key: "decks" },
  { href: "/pricing", label: "Plan & billing", key: "billing" },
] as const;

// Open plane shell: a labelled sidebar on the page ground, no top bar. On a phone it folds into a 48px bar.
export async function AppShell({ active, children }: { active: (typeof nav)[number]["key"]; children: React.ReactNode }) {
  const user = await getCurrentUser();
  const plan = activePlan(user);

  return (
    <div className="site app flex min-h-svh flex-col md:flex-row">
      <Reveal />
      <aside className="flex shrink-0 flex-col gap-6 px-3 py-6 max-md:h-12 max-md:flex-row max-md:items-center max-md:justify-between max-md:py-0 md:sticky md:top-0 md:h-svh md:w-[240px]">
        <Link href="/" className="focusable flex items-center gap-2 px-3 font-[family-name:var(--head)] text-[24px] font-bold">
          <Mark /> DeckAI
        </Link>
        <nav aria-label="App" className="flex gap-1 md:flex-col">
          {nav.map((n) => (
            <Link key={n.key} href={n.href} aria-current={n.key === active ? "page" : undefined} className="nav-row">{n.label}</Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3 px-3 max-md:hidden">
          {plan ? (
            <Link href="/pricing" className="focusable rounded-xl bg-[var(--tint-50)] p-3 text-[15px]">
              <span className="font-[family-name:var(--head)] text-[18px] font-bold">{plan.name}</span>
              <span className="mt-2 block">{user.decksUsed} of {plan.decks} decks made this month</span>
              <span className="track mt-1.5 block"><span style={{ width: `${Math.min(100, (user.decksUsed / plan.decks) * 100)}%` }} /></span>
            </Link>
          ) : (
            <Link href="/pricing" className="focusable rounded-xl bg-[var(--tint-100)] p-3 text-[15px]">
              <span className="font-[family-name:var(--head)] text-[18px] font-bold">No plan yet</span>
              <span className="mt-1 block">Choose one to start making decks.</span>
            </Link>
          )}
          <div className="flex items-center justify-between gap-2 text-[15px]">
            <span className="truncate" title={user.email}>{user.name}</span>
            <SignOutButton />
          </div>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-[var(--ink-soft)]">
            {LEGAL_PAGES.map((p) => <Link key={p.href} href={p.href} className="focusable underline-offset-4 hover:underline">{p.label}</Link>)}
          </nav>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

// The mark: a highlighter stroke, the one shape the whole product uses.
export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 20" aria-hidden className={`h-5 w-8 ${className}`}>
      <path d="M3 5 Q4 2 9 2.5 L27 3 Q30 3.5 29.5 9 L29 15 Q28.5 18 24 17.5 L6 17 Q2.5 16.5 2.6 12 Z" fill="#e8590c" transform="rotate(-4 16 10)" />
    </svg>
  );
}
