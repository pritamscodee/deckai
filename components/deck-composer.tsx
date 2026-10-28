"use client";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createDeck } from "@/app/actions";

const ideas = [
  "How HTTPS keeps your data private",
  "Photosynthesis for a class of 12-year-olds",
  "Pitch: a cafe loyalty app",
  "What a neural network learns",
];

// The chat box: say what the deck is about, Enter sends it.
export function DeckComposer({ disabled }: { disabled?: string | null }) {
  const [text, setText] = useState("");
  const form = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-3">
      <form ref={form} action={createDeck}
        className="panel flex flex-col gap-2 p-3 shadow-[0_8px_24px_rgb(31_35_40/0.08)] focus-within:border-[var(--accent)]">
        <label htmlFor="prompt" className="sr-only">What should the deck be about?</label>
        <textarea id="prompt" name="prompt" required minLength={3} rows={3} value={text} disabled={!!disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && text.trim().length >= 3) { e.preventDefault(); form.current?.requestSubmit(); } }}
          placeholder="A topic, a question, or the talk you need to give…"
          className="w-full resize-none bg-transparent px-2 py-1 text-[20px] leading-snug outline-none placeholder:text-[var(--ink-soft)] disabled:cursor-not-allowed" />
        <div className="flex items-center justify-between gap-3 px-1">
          <span className="text-[15px] text-[var(--ink-soft)]">{disabled ?? "Enter to send · Shift+Enter for a new line"}</span>
          <Send ready={text.trim().length >= 3 && !disabled} />
        </div>
      </form>
      <ul className="flex flex-wrap gap-2" aria-label="Ideas to start from">
        {ideas.map((idea) => (
          <li key={idea}>
            <button type="button" onClick={() => setText(idea)} disabled={!!disabled}
              className="focusable pill h-8 bg-[var(--tint-50)] text-[16px] transition-colors hover:bg-[var(--tint-100)] disabled:opacity-60">
              {idea}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Send({ ready }: { ready: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={!ready || pending} className="hl-btn min-h-11 text-[19px] disabled:cursor-not-allowed disabled:opacity-50">
      {pending ? "Starting…" : "Draw it"}
    </button>
  );
}
