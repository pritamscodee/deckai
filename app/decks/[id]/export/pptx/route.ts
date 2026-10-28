import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { activePlan } from "@/lib/plans";
import { deckToPptx, type ExportSlide } from "@/lib/export-pptx";
import { isCardScene, type Theme } from "@/lib/slide-schema";

// Editable PowerPoint export. Pro and Ultra only; Starter exports to PDF from /decks/[id]/print.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const plan = activePlan(user);
  if (!plan) return new Response("Choose a plan to export.", { status: 402 });
  if (!plan.editableExport) {
    return new Response("Editable PowerPoint export is on Pro and Ultra. Every plan can export a PDF.", { status: 402 });
  }

  const deck = await db.deck.findFirst({
    where: { id, ownerId: user.id },
    include: { slides: { orderBy: { order: "asc" } } },
  });
  if (!deck) return new Response("Not found", { status: 404 });

  const slides = deck.slides.flatMap<ExportSlide>((s) =>
    isCardScene(s.scene) ? [{ title: s.title, notes: s.notes, card: s.scene.slide }] : [],
  );
  if (!slides.length) return new Response("This deck has no slides to export yet.", { status: 409 });

  const file = await deckToPptx({ title: deck.title, slides }, deck.theme as Theme);
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${deck.slug || "deck"}.pptx"`,
      "Cache-Control": "no-store",
    },
  });
}
