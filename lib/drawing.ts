// Turns the generated pictures on a slide (diagram, doodle strip, illustration) into Excalidraw
// elements so they can be moved, recolored and drawn over like a whiteboard.
import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";
import type { FileId } from "@excalidraw/excalidraw/element/types";
import type { BinaryFiles, DataURL } from "@excalidraw/excalidraw/types";
import { ILLUSTRATION_PILLS, iconSvg, type Illustration } from "@/lib/doodles";
import type { Drawing, Edge, Node, SlideT } from "@/lib/slide-schema";

// Maps a picture's own coordinates onto the 1600x900 slide: slide = (x + vx*s, y + vy*s).
type Place = { x: number; y: number; s: number };
const identity: Place = { x: 0, y: 0, s: 1 };

const palette: Record<string, string> = { blue: "#a5d8ff", green: "#b2f2bb", yellow: "#ffec99", red: "#ffc9c9", gray: "#e9ecef" };

export function diagramSkeleton(nodes: Node[], edges: Edge[], p: Place = identity): ExcalidrawElementSkeleton[] {
  const box = new Map(nodes.map(n => [n.id, { x: p.x + n.x * p.s, y: p.y + n.y * p.s, w: (n.w ?? 240) * p.s, h: (n.h ?? 110) * p.s }]));
  // Excalidraw doesn't position bound arrows from a skeleton, so place each one
  // from the edge of its start shape to the edge of its end shape.
  const arrow = (from: string, to: string) => {
    const a = box.get(from)!, b = box.get(to)!;
    const [ax, ay, bx, by] = [a.x + a.w / 2, a.y + a.h / 2, b.x + b.w / 2, b.y + b.h / 2];
    const dx = bx - ax, dy = by - ay;
    const edge = (r: typeof a) => Math.min(r.w / 2 / Math.abs(dx || 1e-9), r.h / 2 / Math.abs(dy || 1e-9));
    const gap = 8 / Math.hypot(dx, dy);
    const t0 = edge(a) + gap, t1 = 1 - edge(b) - gap;
    return { x: ax + dx * t0, y: ay + dy * t0, width: dx * (t1 - t0), height: dy * (t1 - t0) };
  };
  const fontSize = 28 * p.s;
  return [
    ...nodes.map((n): ExcalidrawElementSkeleton => {
      const { x, y, w, h } = box.get(n.id)!;
      return n.kind === "text"
        ? { type: "text", id: n.id, x, y, text: n.label, fontSize }
        : { type: n.kind, id: n.id, x, y, width: w, height: h,
            backgroundColor: palette[n.color ?? "blue"], fillStyle: "solid", label: { text: n.label, fontSize } };
    }),
    // Skip edges the model pointed at nodes that don't exist.
    ...edges.filter(e => box.has(e.from) && box.has(e.to) && e.from !== e.to).map((e): ExcalidrawElementSkeleton => ({
      type: "arrow", ...arrow(e.from, e.to),
      start: { id: e.from }, end: { id: e.to }, label: e.label ? { text: e.label, fontSize: fontSize * 0.85 } : undefined })),
  ];
}

// Same layout as illustrationMarkup() in doodles.ts, as elements. Icons become images.
function illustrationSkeleton(ill: Illustration, p: Place, files: BinaryFiles): ExcalidrawElementSkeleton[] {
  const items = ill.items.slice(0, 5);
  const area = ill.callout ? 700 : 1000;
  const xs = items.map((_, i) => (area * (i + 0.5)) / items.length);
  const at = (x: number, y: number) => ({ x: p.x + x * p.s, y: p.y + y * p.s });
  const out: ExcalidrawElementSkeleton[] = [];

  const arrow = (x1: number, x2: number) =>
    x2 - x1 > 50 && out.push({ type: "arrow", ...at(x1, 62), width: (x2 - x1) * p.s, height: 0, strokeStyle: "dashed" });
  if (ill.flow) xs.slice(1).forEach((x, i) => arrow(xs[i] + 64, x - 64));
  if (ill.callout && xs.length) arrow(xs[xs.length - 1] + 64, area + 20);

  items.forEach((it, i) => {
    const fileId = `icon-${it.icon}` as FileId;
    files[fileId] ??= { id: fileId, mimeType: "image/svg+xml", created: Date.now(),
      dataURL: `data:image/svg+xml;base64,${btoa(iconSvg(it.icon))}` as DataURL };
    // iconSvg pads the 100 box by 4 on each side for the stroke.
    out.push({ type: "image", fileId, status: "saved", ...at(xs[i] - 59.4, 11.6), width: 118.8 * p.s, height: 118.8 * p.s });
    if (it.label) {
      const w = Math.min(it.label.length * 12 + 28, area / items.length - 12);
      out.push({ type: "rectangle", ...at(xs[i] - w / 2, 152), width: w * p.s, height: 40 * p.s, roundness: { type: 3 },
        backgroundColor: ILLUSTRATION_PILLS[i % ILLUSTRATION_PILLS.length], fillStyle: "solid", strokeColor: "transparent",
        label: { text: it.label, fontSize: 24 * p.s } });
    }
  });

  if (ill.callout) {
    const h = 160;
    out.push({ type: "rectangle", ...at(area + 34, 56), width: 262 * p.s, height: h * p.s, backgroundColor: "#a5d8ff", fillStyle: "solid", strokeColor: "transparent" });
    out.push({ type: "rectangle", ...at(area + 28, 50), width: 262 * p.s, height: h * p.s, backgroundColor: "#ffffff", fillStyle: "solid",
      label: { text: ill.callout, fontSize: 25 * p.s } });
  }
  return out;
}

// Where an <svg viewBox> is drawn inside the slide, in slide units (default "xMidYMid meet").
function placeOf(svg: SVGSVGElement, slide: HTMLElement): Place {
  const root = slide.getBoundingClientRect(), r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
  const k = 1600 / root.width;
  const s = Math.min(r.width / vb.width, r.height / vb.height);
  return {
    x: (r.left - root.left + (r.width - vb.width * s) / 2 - vb.x * s) * k,
    y: (r.top - root.top + (r.height - vb.height * s) / 2 - vb.y * s) * k,
    s: s * k,
  };
}

// Claude's illustration as an image element, where object-contain draws it inside the <img>.
function pictureSkeleton(img: HTMLImageElement, slide: HTMLElement, url: string, files: BinaryFiles): ExcalidrawElementSkeleton {
  const root = slide.getBoundingClientRect(), r = img.getBoundingClientRect();
  const k = 1600 / root.width;
  const s = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
  const [w, h] = [img.naturalWidth * s, img.naturalHeight * s];
  const fileId = "picture" as FileId;
  files[fileId] = { id: fileId, mimeType: "image/svg+xml", created: Date.now(), dataURL: url as DataURL };
  return { type: "image", fileId, status: "saved",
    x: (r.left - root.left + (r.width - w) / 2) * k, y: (r.top - root.top + (r.height - h) / 2) * k, width: w * k, height: h * k };
}

// First time a slide is drawn on: lift its pictures, measured where they render now, into a drawing.
export async function seedDrawing(slide: SlideT, el: HTMLElement): Promise<Drawing> {
  const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
  const files: BinaryFiles = {};
  const skeleton: ExcalidrawElementSkeleton[] = [];
  const diagram = el.querySelector<SVGSVGElement>('[data-drawing="diagram"]');
  const strip = el.querySelector<SVGSVGElement>('[data-drawing="illustration"]');
  if (slide.layout === "diagram" && diagram) skeleton.push(...diagramSkeleton(slide.nodes, slide.edges, placeOf(diagram, el)));
  if (slide.illustration?.items.length && strip) skeleton.push(...illustrationSkeleton(slide.illustration, placeOf(strip, el), files));
  const picture = el.querySelector<HTMLImageElement>('[data-drawing="image"]');
  if (slide.image && picture?.naturalWidth) skeleton.push(pictureSkeleton(picture, el, slide.image.url, files));
  return { elements: convertToExcalidrawElements(skeleton, { regenerateIds: false }), files };
}
