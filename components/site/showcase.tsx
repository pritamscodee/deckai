"use client";
import { useState } from "react";
import { SlideView, setIn } from "@/components/slide-view";
import { SAMPLE_DECK } from "@/lib/sample-deck";
import type { SlideT } from "@/lib/slide-schema";

// The live thing: pick a layout, see the real slide, and edit any word on it like in the app.
export function Showcase() {
  const [active, setActive] = useState(0);
  const [slides, setSlides] = useState<SlideT[]>(() => SAMPLE_DECK.map((s) => s.slide));
  const item = SAMPLE_DECK[active];

  return (
    <div className="grid items-end gap-10 md:grid-cols-12">
      <div className="rise order-2 md:order-1 md:col-span-4" style={{ ["--i" as string]: 1 }}>
        <h2 id="slides-title" className="mb-1 text-[clamp(28px,2.9vw,44px)] leading-[1.2] text-[var(--ink-soft)]">See a slide</h2>
        <ul className="flex flex-wrap gap-x-6 md:flex-col md:gap-0" aria-labelledby="slides-title">
          {SAMPLE_DECK.map((s, i) => (
            <li key={s.name}>
              <button type="button" onClick={() => setActive(i)} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)}
                aria-pressed={i === active}
                className="relative font-[family-name:var(--head)] text-[clamp(26px,2.9vw,44px)] leading-[1.15] font-bold whitespace-nowrap text-[var(--ink-soft)] transition-colors aria-pressed:text-[var(--ink)]">
                {i === active && <span aria-hidden className="stroke absolute inset-x-[-0.15em] bottom-[0.12em] -z-10 h-[0.42em] -rotate-1" style={{ background: s.color }} />}
                {s.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative order-1 md:order-2 md:col-span-8">
        {/* The motif at stage size: a highlighter stroke behind the slide, in the chosen color. */}
        <div aria-hidden className="stroke absolute inset-x-0 inset-y-[8%] -rotate-2 transition-colors duration-300" style={{ background: item.color }} />
        <div data-ui className="relative mx-[4%] -translate-y-[6%]">
          <SlideView figure key={active} slide={slides[active]} theme="notebook" className="rounded-md"
            onEdit={(path, value) => setSlides((all) => all.map((s, i) => (i === active ? setIn(s, path, value) : s)))} />
        </div>
        <p className="relative mt-4 max-w-[46ch] text-(length:--s-small) md:ml-auto md:text-right">{item.fact} Click any word on it to change it.</p>
      </div>
    </div>
  );
}
