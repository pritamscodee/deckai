import { Suspense } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import type { DeckStatus } from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";

const PER_PAGE = 24;

const status: Record<DeckStatus, { label: string; className: string }> = {
  QUEUED: { label: "Waiting", className: "bg-[var(--ground-2)]" },
  GENERATING: { label: "Drawing", className: "bg-[var(--tint-100)]" },
  READY: { label: "Ready", className: "bg-[var(--hl-mint)]" },
  FAILED: { label: "Stopped", className: "bg-[var(--hl-pink)]" },
};

export default function DecksPage({ searchParams }: PageProps<"/decks">) {
  return (
    <Suspense fallback={<p className="p-8">Loading…</p>}>
      <AppShell active="decks">
        <Suspense fallback={<p className="p-8">Loading your decks…</p>}>
          <AllDecks searchParams={searchParams} />
        </Suspense>
      </AppShell>
    </Suspense>
  );
}

async function AllDecks({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const user = await requireUser();
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const page = Math.max(1, Number(params.page) || 1);

  // Matches the deck's own title and prompt, and the text on any of its slides.
  const where: Prisma.DeckWhereInput = {
    ownerId: user.id,
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { prompt: { contains: q, mode: "insensitive" } },
        { slides: { some: { searchText: { contains: q, mode: "insensitive" } } } },
      ],
    }),
  };

  const [decks, total] = await Promise.all([
    db.deck.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        _count: { select: { slides: true } },
        slides: { orderBy: { order: "asc" }, take: 1, select: { thumbnailUrl: true } },
      },
    }),
    db.deck.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const href = (p: number) => `/decks?${new URLSearchParams({ ...(q && { q }), ...(p > 1 && { page: String(p) }) })}`;

  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-8 px-4 py-8 md:py-[72px]">
      <section className="flex flex-col gap-5">
        <h1 className="text-[clamp(32px,4vw,48px)] leading-tight">Your decks</h1>
        <form action="/decks" className="flex flex-wrap items-center gap-3">
          <label htmlFor="q" className="sr-only">Search your decks</label>
          <input id="q" name="q" defaultValue={q} type="search" placeholder="Search titles and slide text…"
            className="h-12 min-w-0 flex-1 rounded-[10px] border border-[var(--rule)] bg-white px-3 text-[18px] outline-none focus:border-[var(--accent)]" />
          <button type="submit" className="hl-btn min-h-12 text-[18px]">Search</button>
          {q && <Link href="/decks" className="focusable underline decoration-2 underline-offset-4">Clear</Link>}
        </form>
        <p className="text-[var(--ink-soft)]">
          {q ? `${total} ${total === 1 ? "deck matches" : "decks match"} “${q}”` : `${total} ${total === 1 ? "deck" : "decks"}, newest first`}
        </p>
      </section>

      {decks.length === 0 ? (
        <p className="py-6 text-[var(--ink-soft)]">
          {q ? "Nothing matched. Try a different word." : "No decks yet."}{" "}
          <Link href="/dashboard" className="underline decoration-2 underline-offset-4">Start one</Link>.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {decks.map((d) => (
            <li key={d.id}>
              <Link href={`/decks/${d.id}`} className="focusable panel flex h-full flex-col gap-2 overflow-hidden p-0 transition-colors hover:bg-[var(--tint-50)]">
                {d.slides[0]?.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- slide thumbnail served by ImageKit
                  <img src={d.slides[0].thumbnailUrl} alt="" width={320} height={180} className="aspect-video w-full object-cover" />
                ) : <span className="aspect-video w-full bg-[var(--ground-2)]" />}
                <span className="flex flex-1 flex-col gap-1 p-3">
                  <span className="line-clamp-2 text-[18px]">{d.title}</span>
                  <span className="mt-auto flex items-center gap-2 text-[15px] text-[var(--ink-soft)]">
                    {d._count.slides} slides · {format(d.createdAt, "d MMM yyyy")}
                    <span className={`pill ml-auto ${status[d.status].className}`}>{status[d.status].label}</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between gap-4">
          {page > 1
            ? <Link href={href(page - 1)} className="focusable underline decoration-2 underline-offset-4">← Newer</Link>
            : <span className="text-[var(--ink-soft)]">← Newer</span>}
          <span className="tabular-nums text-[var(--ink-soft)]">Page {page} of {pages}</span>
          {page < pages
            ? <Link href={href(page + 1)} className="focusable underline decoration-2 underline-offset-4">Older →</Link>
            : <span className="text-[var(--ink-soft)]">Older →</span>}
        </nav>
      )}
    </main>
  );
}
