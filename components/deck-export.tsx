"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const PPTX_TYPE = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

// Export: PDF on every plan (the browser prints the real slides), editable PowerPoint on Pro and Ultra.
export function DeckExport({ deckId, slug, editable, className }: { deckId: string; slug: string; editable: boolean; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function downloadPptx() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/decks/${deckId}/export/pptx`, { credentials: "same-origin" });
      // A signed-out request is redirected to /sign-in, which answers 200 with HTML. Without
      // this check that HTML gets saved as a .pptx that PowerPoint then refuses to open.
      const type = res.headers.get("content-type") ?? "";
      if (res.redirected || type.startsWith("text/html")) {
        throw new Error("Your session has expired. Reload the page and sign in again.");
      }
      if (!res.ok) throw new Error((await res.text()).slice(0, 200) || `Export failed (${res.status}).`);
      if (!type.startsWith(PPTX_TYPE)) throw new Error("The server didn't return a PowerPoint file. Try again.");

      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug || "deck"}.pptx`;
      // In the document and revoked a tick later: a link that is never attached, or whose blob
      // URL is revoked in the same frame as the click, downloads nothing in some browsers.
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 10_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const tool = "focusable h-9 rounded-lg px-3 text-[16px] transition-colors hover:bg-[var(--ground-2)]";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <a href={`/decks/${deckId}/print`} target="_blank" rel="noopener" className={tool}>PDF</a>
      {editable ? (
        <button type="button" onClick={downloadPptx} disabled={busy} className={cn(tool, "disabled:opacity-60")}>
          {busy ? "Building…" : "PowerPoint"}
        </button>
      ) : (
        <button type="button" disabled title="Editable PowerPoint export is on Pro and Ultra"
          className={cn(tool, "cursor-not-allowed text-[var(--ink-soft)] hover:bg-transparent")}>
          PowerPoint · Pro
        </button>
      )}
      {error && <span role="alert" className="max-w-[40ch] text-[14px] text-[var(--accent)]">{error}</span>}
    </div>
  );
}
