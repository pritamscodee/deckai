"use client";

import { useRef, useState } from "react";
import { renameDeck } from "@/app/actions";

// The deck's name in the header, editable in place. Enter or clicking away saves it;
// Escape puts back what was there.
export function DeckTitle({ deckId, title }: { deckId: string; title: string }) {
  const [value, setValue] = useState(title);
  const saved = useRef(title);

  async function save(next: string) {
    const clean = next.trim();
    if (!clean || clean === saved.current) return setValue(saved.current);
    saved.current = clean;
    setValue(clean);
    const res = await renameDeck(deckId, clean);
    if ("error" in res) setValue(saved.current);
  }

  return (
    <h1 className="min-w-0 flex-1 font-[family-name:var(--body)] text-[19px] font-normal tracking-normal">
      <input
        aria-label="Deck title"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => save(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          else if (e.key === "Escape") { setValue(saved.current); e.currentTarget.blur(); }
        }}
        maxLength={120}
        className="focusable w-full truncate rounded-lg bg-transparent px-2 py-1 outline-none hover:bg-[var(--ground-2)] focus:bg-[var(--ground-2)]"
      />
    </h1>
  );
}
