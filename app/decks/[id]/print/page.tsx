import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { SlideView } from "@/components/slide-view";
import { PrintOnReady } from "@/components/print-on-ready";
import { isCardScene, type SlideT, type Theme } from "@/lib/slide-schema";

// The PDF export: every slide at 16:9 on its own page, printed by the browser so the
// notebook fonts, doodles and Claude's illustrations all come through exactly as on screen.
export default function PrintDeckPage({ params }: PageProps<"/decks/[id]/print">) {
  return (
    <Suspense fallback={<p className="p-8">Getting the slides ready to print…</p>}>
      <PrintDeck params={params} />
    </Suspense>
  );
}

async function PrintDeck({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const deck = await db.deck.findFirst({
    where: { id, ownerId: user.id },
    include: { slides: { orderBy: { order: "asc" } } },
  });
  if (!deck) notFound();

  const cards = deck.slides.flatMap<SlideT>((s) => (isCardScene(s.scene) ? [s.scene.slide] : []));
  if (cards.length === 0) return <p className="p-8">This deck has no slides to export yet.</p>;

  return (
    <div className="print-deck">
      <PrintOnReady />
      {cards.map((card, i) => (
        <div key={i} className="print-page">
          <SlideView figure slide={card} theme={deck.theme as Theme} />
        </div>
      ))}
    </div>
  );
}
