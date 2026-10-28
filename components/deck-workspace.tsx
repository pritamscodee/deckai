"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { saveSlide, setDeckTheme } from "@/app/actions";
import { SlideEditor, type SlideData } from "@/components/slide-editor";
import { SlideView, setIn } from "@/components/slide-view";
import { DrawingEditor } from "@/components/slide-drawing";
import { DeckExport } from "@/components/deck-export";
import { isCardScene, THEMES, type Drawing, type SlideT, type Theme } from "@/lib/slide-schema";
import { seedDrawing } from "@/lib/drawing";
import { PREMIUM_THEMES } from "@/lib/plans";

export function DeckWorkspace({ deckId, slug, slides, theme: initialTheme, premium, editableExport }:
  { deckId: string; slug: string; slides: SlideData[]; theme: Theme; premium: boolean; editableExport: boolean }) {
  const [activeId, setActiveId] = useState(slides[0]?.id);
  const [theme, setTheme] = useState(initialTheme);
  const [presenting, setPresenting] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const slideBox = useRef<HTMLDivElement>(null);
  // Local edits win over server data so typing isn't undone by the refresh while generating.
  const [edited, setEdited] = useState<Record<string, SlideT>>({});

  // Slides keep arriving while the deck generates; fall back to the first one.
  const active = slides.find((s) => s.id === activeId) ?? slides[0];
  if (!active) return <p className="p-6">This deck has no slides.</p>;

  const card = (s: SlideData) => edited[s.id] ?? (isCardScene(s.scene) ? s.scene.slide : null);
  const cards = slides.map(card).filter((c): c is SlideT => c !== null);
  const activeCard = card(active);

  function update(id: string, next: SlideT) {
    setEdited((e) => ({ ...e, [id]: next }));
    saveSlide(id, { v: 2, slide: next });
  }

  function edit(path: (string | number)[], value: string) {
    if (activeCard) update(active.id, setIn(activeCard, path, value));
  }

  // The first time, the slide's diagram and doodles are lifted into the drawing so they can be edited.
  async function startDrawing() {
    if (!activeCard) return;
    if (!activeCard.drawing) {
      const el = slideBox.current?.querySelector<HTMLElement>(".slide");
      if (el) update(active.id, { ...activeCard, drawing: await seedDrawing(activeCard, el) });
    }
    setDrawing(true);
  }

  function select(id: string) {
    setActiveId(id);
    setDrawing(false);
  }

  function changeTheme(next: Theme) {
    setTheme(next);
    setDeckTheme(deckId, next);
  }

  const tool = "focusable h-9 rounded-lg px-3 text-[16px] transition-colors hover:bg-[var(--ground-2)]";

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <nav aria-label="Slides" className="flex gap-3 overflow-x-auto border-b border-[var(--rule)] p-3 md:w-56 md:flex-col md:overflow-y-auto md:border-r md:border-b-0">
        {slides.map((s, i) => {
          const c = card(s);
          const current = s.id === active.id;
          return (
            <button key={s.id} type="button" onClick={() => select(s.id)} aria-current={current ? "true" : undefined}
              className={cn("focusable flex w-40 shrink-0 gap-2 rounded-xl p-1.5 text-left transition-colors hover:bg-[var(--ground-2)] md:w-full",
                current && "bg-[var(--tint-100)] hover:bg-[var(--tint-100)]")}>
              <span className="w-5 shrink-0 pt-0.5 text-right text-[15px] tabular-nums text-[var(--ink-soft)]">{i + 1}</span>
              {c ? <SlideView figure slide={c} theme={theme} className="pointer-events-none flex-1 rounded-md" />
                : <span className="flex aspect-video flex-1 items-center justify-center rounded-md bg-white p-2 text-[13px]">{s.title}</span>}
            </button>
          );
        })}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <div role="toolbar" aria-label="Slide tools" className="flex flex-wrap items-center gap-1 border-b border-[var(--rule)] px-3 py-2">
          <div role="radiogroup" aria-label="Theme" className="flex rounded-xl bg-[var(--ground-2)] p-1">
            {THEMES.map((t) => {
              const locked = PREMIUM_THEMES.includes(t) && !premium;
              return (
                <button key={t} type="button" role="radio" aria-checked={t === theme} disabled={locked}
                  title={locked ? "Premium theme: on Pro and Ultra" : undefined}
                  onClick={() => changeTheme(t)}
                  className={cn("focusable h-8 rounded-lg px-3 text-[16px] capitalize transition-colors disabled:cursor-not-allowed disabled:text-[var(--ink-soft)]",
                    t === theme && "bg-white")}>
                  {t}{locked && " · Pro"}
                </button>
              );
            })}
          </div>
          <span className="flex-1" />
          {activeCard && (
            <button type="button" aria-pressed={drawing} onClick={() => (drawing ? setDrawing(false) : startDrawing())}
              className={cn(tool, drawing && "bg-[var(--tint-100)] hover:bg-[var(--tint-100)]")}>
              {drawing ? "Done drawing" : "Draw & shapes"}
            </button>
          )}
          {cards.length > 0 && (
            <>
              <DeckExport deckId={deckId} slug={slug} editable={editableExport} />
              <button type="button" onClick={() => setPresenting(true)} className="hl-btn ml-1 min-h-9 text-[17px]">Present</button>
            </>
          )}
        </div>

        {activeCard ? (
          <div className="flex flex-1 flex-col items-center gap-3 overflow-y-auto bg-[var(--ground-2)] p-4 md:p-8">
            {/* Clicking a picture (diagram, doodles) opens draw mode so it can be dragged and edited. */}
            <div ref={slideBox} className={cn("relative w-full max-w-[min(100%,calc((100vh-15rem)*16/9))]",
              !drawing && "[&_[data-drawing]]:cursor-pointer")}
              onClick={(e) => { if (!drawing && (e.target as Element).closest("[data-drawing]")) startDrawing(); }}>
              {/* key resets the editable text when switching slides */}
              <SlideView key={active.id} slide={activeCard} theme={theme} onEdit={drawing ? undefined : edit} hideDrawing={drawing}
                className="rounded-lg shadow-[0_2px_12px_rgb(31_35_40/0.08)]" />
              {drawing && activeCard.drawing && (
                <DrawingEditor key={`${active.id}-draw`} drawing={activeCard.drawing}
                  onChange={(d: Drawing) => update(active.id, { ...activeCard, drawing: d })} />
              )}
            </div>
            <p className="text-[15px] text-[var(--ink-soft)]">
              {drawing ? "Add shapes, arrows, text and images; select anything to move, resize or recolor it."
                : "Click any text to edit it. Click a picture to move, resize and recolor it."}
            </p>
          </div>
        ) : (
          // Legacy whiteboard slide; key remounts Excalidraw so each slide loads its own scene.
          <SlideEditor key={active.id} slide={active} onSave={(scene) => saveSlide(active.id, scene)} />
        )}
        {active.notes && (
          <section aria-labelledby="notes-title" className="border-t border-[var(--rule)] px-4 py-3">
            <h2 id="notes-title" className="font-[family-name:var(--body)] text-[15px] font-normal tracking-normal text-[var(--ink-soft)]">Speaker notes</h2>
            <p className="max-w-[80ch] text-[17px]">{active.notes}</p>
          </section>
        )}
      </div>

      {presenting && (
        <Presenter cards={cards} theme={theme} start={Math.max(0, cards.indexOf(activeCard!))} onClose={() => setPresenting(false)} />
      )}
    </div>
  );
}

function Presenter({ cards, theme, start, onClose }: { cards: SlideT[]; theme: Theme; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const close = useEffectEvent(onClose);

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", " ", "PageDown"].includes(e.key)) setIndex((i) => Math.min(i + 1, cards.length - 1));
      else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) setIndex((i) => Math.max(i - 1, 0));
      else if (e.key === "Escape") close();
    };
    // Leaving browser fullscreen (Esc) also ends the presentation.
    const onFullscreen = () => { if (!document.fullscreenElement) close(); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFullscreen);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [cards.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      onClick={() => setIndex((i) => Math.min(i + 1, cards.length - 1))}>
      <SlideView slide={cards[index]} theme={theme} className="w-[min(100vw,calc(100vh*16/9))]" />
      <span className="absolute right-4 bottom-3 text-xs text-white/60">{index + 1} / {cards.length} · ← → to move · Esc to exit</span>
    </div>
  );
}
