import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { activePlan } from "@/lib/plans";
import { deleteDeck, retryDeck } from "@/app/actions";
import { DeckWorkspace } from "@/components/deck-workspace";
import { DeckTitle } from "@/components/deck-title";
import { RefreshWhilePending } from "@/components/refresh-while-pending";
import { Mark } from "@/components/app-shell";
import { Reveal } from "@/components/site/reveal";
import type { Theme } from "@/lib/slide-schema";

export default function DeckPage({ params }: PageProps<"/decks/[id]">) {
  return (
    <Suspense fallback={<p className="p-6">Loading deck…</p>}>
      <Deck params={params} />
    </Suspense>
  );
}

async function Deck({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const deck = await db.deck.findFirst({
    where: { id, ownerId: user.id },
    include: { slides: { orderBy: { order: "asc" } }, owner: true },
  });
  if (!deck) notFound();
  const plan = activePlan(deck.owner);

  const pending = deck.status === "QUEUED" || deck.status === "GENERATING";
  const made = deck.slides.length;
  const total = (deck.outline as { slides?: unknown[] } | null)?.slides?.length;

  return (
    <div className="site app flex min-h-svh flex-col">
      <Reveal />
      <header className="flex h-14 items-center gap-3 border-b border-[var(--rule)] px-4">
        <Link href="/dashboard" className="focusable flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-[var(--ground-2)]" aria-label="Back to your decks">
          <Mark /> <span className="max-sm:hidden">Decks</span>
        </Link>
        <span aria-hidden className="text-[var(--ink-soft)]">/</span>
        <DeckTitle deckId={deck.id} title={deck.title} />
        <form action={deleteDeck.bind(null, deck.id)}>
          <button type="submit" title="Deletes the deck for good. It was already generated, so this doesn't give back any of the month's allowance."
            className="focusable rounded-lg px-3 py-1 text-[16px] hover:bg-[var(--hl-pink)]">Delete</button>
        </form>
      </header>

      {made === 0 ? (
        // Before the first slide: the conversation so far.
        <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-5 px-4 py-10">
          <div className="rise max-w-[85%] self-end rounded-2xl rounded-br-md bg-[var(--tint-100)] px-4 py-3 text-[19px]">{deck.prompt}</div>
          <div className="rise flex max-w-[85%] flex-col gap-3 rounded-2xl rounded-bl-md bg-white px-4 py-3" style={{ ["--i" as string]: 1 }}>
            {deck.status === "FAILED" ? (
              <>
                <p>I stopped before drawing anything. {deck.error}</p>
                <form action={retryDeck.bind(null, deck.id)}><button type="submit" className="hl-btn min-h-10 text-[18px]">Try again</button></form>
              </>
            ) : (
              <>
                <p className="flex items-center gap-3"><RefreshWhilePending />{total ? `Outline ready: ${total} slides. Drawing the first one…` : "Planning the outline…"}</p>
                <p className="text-[15px] text-[var(--ink-soft)]">Slides appear here one by one, usually within two minutes.</p>
              </>
            )}
          </div>
        </main>
      ) : (
        <>
          {pending && (
            <div className="flex items-center gap-3 bg-[var(--tint-50)] px-4 py-2 text-[16px]">
              <RefreshWhilePending />
              <span className="tabular-nums">Drawing… {made}{total ? ` of ${total}` : ""} slides ready</span>
              {total && <span className="track w-40 max-sm:hidden"><span style={{ width: `${(made / total) * 100}%` }} /></span>}
              <span className="text-[var(--ink-soft)] max-md:hidden">You can open and edit them now.</span>
            </div>
          )}
          {deck.status === "FAILED" && (
            <div className="flex flex-wrap items-center gap-3 bg-[var(--hl-pink)] px-4 py-2 text-[16px]">
              <span>Stopped at {made}{total ? ` of ${total}` : ""} slides. {deck.error}</span>
              <form action={retryDeck.bind(null, deck.id)} className="ml-auto">
                <button type="submit" className="hl-btn min-h-9 text-[17px]">Continue the rest</button>
              </form>
            </div>
          )}
          <DeckWorkspace
            deckId={deck.id}
            slug={deck.slug}
            theme={deck.theme as Theme}
            premium={!!plan?.premiumThemes}
            editableExport={!!plan?.editableExport}
            slides={deck.slides.map((s) => ({ id: s.id, title: s.title, notes: s.notes, scene: s.scene }))}
          />
        </>
      )}
    </div>
  );
}
