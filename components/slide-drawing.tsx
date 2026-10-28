"use client";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import { useEffect, useRef, useState } from "react";
import type { ExcalidrawImperativeAPI, NormalizedZoomValue } from "@excalidraw/excalidraw/types";
import type { Drawing } from "@/lib/slide-schema";

const Excalidraw = dynamic(() => import("@excalidraw/excalidraw").then(m => m.Excalidraw), { ssr: false });

// Read-only render of a drawing (thumbnails, presenting, text editing), placed in slide units.
export function DrawingLayer({ drawing }: { drawing: Drawing }) {
  const [svg, setSvg] = useState<{ html: string; x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const { exportToSvg, getCommonBounds } = await import("@excalidraw/excalidraw");
      const elements = drawing.elements.filter(e => !e.isDeleted);
      if (!elements.length) return live && setSvg(null);
      const [x, y] = getCommonBounds(elements);
      // Inlining fonts runs a subsetting web worker that Turbopack can't serve (it resolves to file://);
      // the fonts are only needed for a standalone file, not for drawing on the page.
      const el = await exportToSvg({ elements, files: drawing.files, appState: { exportBackground: false }, exportPadding: 0, skipInliningFonts: true });
      const { width: w, height: h } = el.viewBox.baseVal;
      el.setAttribute("width", "100%");
      el.setAttribute("height", "100%");
      if (live) setSvg({ html: el.outerHTML, x, y, w, h });
    })();
    return () => { live = false; };
  }, [drawing]);

  if (!svg) return null;
  return (
    <div className="pointer-events-none absolute" aria-hidden dangerouslySetInnerHTML={{ __html: svg.html }}
      style={{ left: `${svg.x / 16}%`, top: `${svg.y / 9}%`, width: `${svg.w / 16}%`, height: `${svg.h / 9}%` }} />
  );
}

// Excalidraw laid exactly over the slide: scene units are slide units, so the view is pinned.
export function DrawingEditor({ drawing, onChange }: { drawing: Drawing; onChange: (drawing: Drawing) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const api = useRef<ExcalidrawImperativeAPI>(null);
  const pending = useRef<Drawing>(null);
  const save = useRef(onChange);
  useEffect(() => { save.current = onChange; });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const version = useRef(drawing.elements.reduce((n, e) => n + e.version, 0));

  const view = () => ({ scrollX: 0, scrollY: 0, zoom: { value: (box.current!.clientWidth / 1600) as NormalizedZoomValue } });

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      api.current?.refresh();
      api.current?.updateScene({ appState: view() });
    });
    observer.observe(box.current!);
    // Excalidraw only tracks page scroll; the slide sits in a scrolling panel, and a stale
    // offset makes clicks miss the shapes (they can't be grabbed), so re-measure on any scroll.
    const refresh = () => api.current?.refresh();
    window.addEventListener("scroll", refresh, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", refresh, true);
      // Don't lose the last strokes when leaving draw mode before the save fires.
      clearTimeout(timer.current);
      if (pending.current) save.current(pending.current);
    };
  }, []);

  return (
    // Re-measure as the pointer arrives too, in case the layout moved the slide since mount.
    <div ref={box} className="absolute inset-0" onPointerEnter={() => api.current?.refresh()}>
      <Excalidraw
        excalidrawAPI={(a) => { api.current = a; }}
        initialData={() => ({
          elements: drawing.elements, files: drawing.files, scrollToContent: false,
          appState: { ...view(), viewBackgroundColor: "transparent", currentItemFontSize: 36 },
        })}
        UIOptions={{ canvasActions: { changeViewBackgroundColor: false, export: false, loadScene: false, saveToActiveFile: false, saveAsImage: false, toggleTheme: false } }}
        // Panning or zooming would slide the drawing off the slide underneath, so snap back.
        onScrollChange={(x, y, zoom) => {
          const v = view();
          if (x !== 0 || y !== 0 || zoom.value !== v.zoom.value) api.current?.updateScene({ appState: v });
        }}
        onChange={(elements, _appState, files) => {
          const next = elements.reduce((n, e) => n + e.version, 0);
          if (next === version.current) return;    // selection, hover, etc.
          version.current = next;
          pending.current = JSON.parse(JSON.stringify({ elements, files }));
          clearTimeout(timer.current);
          timer.current = setTimeout(() => { save.current(pending.current!); pending.current = null; }, 800);
        }}
      />
    </div>
  );
}
