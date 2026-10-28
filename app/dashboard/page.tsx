import { Suspense } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { activePlan, FROM_PRICE, MIN_DECK_SLIDES } from "@/lib/plans";
import { AppShell } from "@/components/app-shell";
import { DeckComposer } from "@/components/deck-composer";
import type { DeckStatus } from "@/lib/generated/prisma/enums";

const status: Record<DeckStatus, { label: string; className: string }> = {
  QUEUED: { label: "Waiting", className: "bg-[var(--ground-2)]" },
  GENERATING: { label: "Drawing", className: "bg-[var(--tint-100)]" },
  READY: { label: "Ready", className: "bg-[var(--hl-mint)]" },
  FAILED: { label: "Stopped", className: "bg-[var(--hl-pink)]" },
};

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <Suspense fallback={<p className="p-8">Loading…</p>}>
      <AppShell active="home">
        <Suspense fallback={<p className="p-8">Loading your decks…</p>}>
          <Home searchParams={searchParams} />
        </Suspense>
      </AppShell>
    </Suspense>
  );
}

async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { limit, welcome } = await searchParams;
  const user = await getCurrentUser();
  const { id } = user;
  const plan = activePlan(user);
  // Both at once: each trip to the database is ~250ms from India.
  const [decks, total] = await Promise.all([
    db.deck.findMany({
      where: { ownerId: id },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { _count: { select: { slides: true } }, slides: { orderBy: { order: "asc" }, take: 1, select: { thumbnailUrl: true } } },
    }),
    db.deck.count({ where: { ownerId: id } }),
  ]);
  // The same test createDeck applies, so the composer never promises a deck it would refuse.
  const out = plan && (user.decksUsed >= plan.decks || plan.slides - user.slidesUsed < MIN_DECK_SLIDES);
  const blocked = !plan ? "Choose a plan to start making decks." : out ? "You've used this month's allowance." : null;
  const firstName = user.name.split(" ")[0];

  return (
    // 12-column centred column: 1100px = 12 × 77 + 11 × 16 (+ 2px rounding), so 3/3/3/3, 9/3 and 12 share column lines.
    <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-12 px-4 py-8 md:py-[72px]">
      <section aria-labelledby="ask" className="flex flex-col gap-5">
        <h1 id="ask" className="rise text-[clamp(32px,4vw,48px)] leading-tight">What should we draw, {firstName}?</h1>
        {welcome && plan && <p className="rounded-xl bg-[var(--hl-mint)] px-4 py-3">You&apos;re on {plan.name}. {plan.decks} decks and {plan.slides} slides a month — have fun.</p>}
        {(limit || out) && plan && (
          <p className="rounded-xl bg-[var(--tint-100)] px-4 py-3">
            You&apos;ve made {user.decksUsed} of {plan.decks} decks and {user.slidesUsed} of {plan.slides} slides this month.
            {user.decksUsed < plan.decks && plan.slides - user.slidesUsed < MIN_DECK_SLIDES
              ? ` There are ${plan.slides - user.slidesUsed} slides left — not quite enough for a whole deck, so nothing is started half-finished.`
              : ""}
            {" "}Your plan renews {user.periodEnd ? format(user.periodEnd, "d MMMM") : "soon"}, or <Link href="/pricing" className="underline decoration-2 underline-offset-4">upgrade now</Link>.
          </p>
        )}
        {!plan && (
          <p className="flex flex-wrap items-center gap-4 rounded-xl bg-[var(--tint-100)] px-4 py-3">
            Every deck is made on a monthly plan, from ₹{FROM_PRICE}. <Link href="/pricing" className="hl-btn min-h-10 text-[18px]">See plans</Link>
          </p>
        )}
        <DeckComposer disabled={blocked} />
      </section>

      <section aria-label="This month" className="grid grid-cols-2 gap-4 md:grid-cols-12">
        <Count label="Decks made this month" value={plan ? `${user.decksUsed} / ${plan.decks}` : "—"} caption={plan ? `${plan.decks - user.decksUsed} more this month` : "No plan"} />
        <Count label="Slides made this month" value={plan ? `${user.slidesUsed} / ${plan.slides}` : "—"} caption={plan ? `${plan.slides - user.slidesUsed} more this month` : "No plan"} />
        <Count label="Plan" value={plan?.name ?? "None"} caption={plan && user.periodEnd ? `${user.subscriptionStatus === "cancelled" ? "Ends" : "Renews"} ${format(user.periodEnd, "d MMM")}` : `From ₹${FROM_PRICE}/mo`} />
        <Count label="Decks you have" value={String(total)} caption={total ? "Kept until you delete them" : "Ready when you are"} href={total ? "/decks" : undefined} />
      </section>

      <section aria-labelledby="decks-title" className="panel flex flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <h2 id="decks-title" className="text-[22px]">Recent decks</h2>
          <span className="pill bg-[var(--ground-2)]">{total}</span>
          {total > decks.length && (
            <Link href="/decks" className="focusable ml-auto underline decoration-2 underline-offset-4">See all {total}</Link>
          )}
        </div>
        {decks.length === 0 ? (
          <p className="py-6 text-[var(--ink-soft)]">No decks yet. Your first one appears here while it&apos;s being drawn.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {decks.map((d) => (
              <li key={d.id}>
                <Link href={`/decks/${d.id}`} className="focusable flex items-center gap-4 rounded-xl border border-[var(--rule)] bg-[var(--ground)] p-2 pr-4 transition-colors hover:bg-[var(--tint-50)]">
                  {d.slides[0]?.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- slide thumbnail served by ImageKit
                    <img src={d.slides[0].thumbnailUrl} alt="" width={96} height={54} className="h-[54px] w-24 shrink-0 rounded-md object-cover" />
                  ) : <span className="h-[54px] w-24 shrink-0 rounded-md bg-[var(--ground-2)]" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[18px]">{d.title}</span>
                    <span className="text-[15px] text-[var(--ink-soft)]">{d._count.slides} slides · {format(d.createdAt, "d MMM")}</span>
                  </span>
                  <span className={`pill ${status[d.status].className}`}>{status[d.status].label}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Count({ label, value, caption, href }: { label: string; value: string; caption: string; href?: "/decks" }) {
  const shell = "rise focusable flex min-h-[128px] flex-col justify-between rounded-2xl bg-[var(--tint-50)] p-4 md:col-span-3";
  const inside = (
    <>
      <span className="text-[15px]">{label}</span>
      <span className="font-[family-name:var(--head)] text-[30px] font-bold tabular-nums">{value}</span>
      <span className="text-[15px] text-[var(--ink-soft)]">{caption}</span>
    </>
  );
  return href
    ? <Link href={href} className={`${shell} transition-colors hover:bg-[var(--tint-100)]`}>{inside}</Link>
    : <div className={shell}>{inside}</div>;
}
