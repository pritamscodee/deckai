"use client";

import { useEffect, useState } from "react";

// Opens the browser's print dialog once fonts and images have settled, so the first
// page isn't captured mid-load. "Save as PDF" in that dialog is the PDF export.
export function PrintOnReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const images = Array.from(document.images).map((img) =>
      img.complete ? Promise.resolve() : new Promise<void>((done) => {
        img.addEventListener("load", () => done(), { once: true });
        img.addEventListener("error", () => done(), { once: true });
      }),
    );
    // Never wait forever on a font or an image that will not settle — the dialog matters
    // more than the last picture.
    const settled = Promise.race([
      Promise.all([document.fonts.ready, ...images]),
      new Promise((done) => setTimeout(done, 5000)),
    ]);
    settled.then(() => {
      if (cancelled) return;
      setReady(true);
      // A timer, not requestAnimationFrame: the print view opens in a new tab, and if the
      // browser puts that tab in the background rAF never fires, so the dialog never opens.
      timer = setTimeout(() => window.print(), 150);
    });
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  return (
    <div className="print-hint" aria-live="polite">
      <p>
        {ready
          ? "Choose “Save as PDF” in the print dialog. Keep the paper size as-is so slides fill the page."
          : "Getting the slides ready to print…"}
      </p>
      <button type="button" onClick={() => window.print()} className="hl-btn min-h-10 text-[17px]">Print again</button>
    </div>
  );
}
