import { z } from "zod";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { BinaryFiles } from "@excalidraw/excalidraw/types";
import { ICONS, type Illustration } from "@/lib/doodles";

// Diagram pieces: used by the "diagram" layout and by legacy whiteboard slides.
export const Node = z.object({
  id: z.string(),
  kind: z.enum(["rectangle", "ellipse", "diamond", "text"]),
  label: z.string(),
  x: z.number(), y: z.number(),          // grid 0..1600 x 0..900
  w: z.number().nullable(), h: z.number().nullable(),
  color: z.enum(["blue", "green", "yellow", "red", "gray"]).nullable(),
});
export const Edge = z.object({ from: z.string(), to: z.string(), label: z.string().nullable() });
export type Node = z.infer<typeof Node>;
export type Edge = z.infer<typeof Edge>;

// Legacy whiteboard slide (first decks), still opened in the Excalidraw editor.
export const SlideSpec = z.object({
  title: z.string(),
  nodes: z.array(Node).max(14),
  edges: z.array(Edge).max(16),
  notes: z.string(),
});

export const LAYOUTS = ["title", "bullets", "cards", "stats", "timeline", "comparison", "quote", "code", "diagram"] as const;

const Column = z.object({ heading: z.string(), points: z.array(z.string()) });
const Step = z.object({ heading: z.string(), body: z.string() });

// Gamma-style slide: one layout per slide, rendered as HTML.
export const Slide = z.discriminatedUnion("layout", [
  z.object({ layout: z.literal("title"), title: z.string(), subtitle: z.string() }),
  z.object({ layout: z.literal("bullets"), title: z.string(), intro: z.string().nullable(), bullets: z.array(z.string()) }),
  z.object({ layout: z.literal("cards"), title: z.string(),
    cards: z.array(z.object({ emoji: z.string(), heading: z.string(), body: z.string() })) }),
  z.object({ layout: z.literal("stats"), title: z.string(),
    stats: z.array(z.object({ value: z.string(), label: z.string() })), caption: z.string().nullable() }),
  z.object({ layout: z.literal("timeline"), title: z.string(), steps: z.array(Step) }),
  z.object({ layout: z.literal("comparison"), title: z.string(), left: Column, right: Column }),
  z.object({ layout: z.literal("quote"), title: z.string(), quote: z.string(), attribution: z.string().nullable() }),
  z.object({ layout: z.literal("code"), title: z.string(), language: z.string(), code: z.string(), points: z.array(z.string()) }),
  z.object({ layout: z.literal("diagram"), title: z.string(), nodes: z.array(Node), edges: z.array(Edge), caption: z.string().nullable() }),
]);
// Excalidraw shapes drawn over the slide, in 1600x900 slide units. Once a slide has one,
// its diagram and doodle strip live in here (editable) instead of being drawn from the spec.
export type Drawing = { elements: readonly ExcalidrawElement[]; files: BinaryFiles };

// Every layout can carry a doodle strip; the renderer shows it where there is room.
export type SlideT = z.infer<typeof Slide> & {
  illustration?: Illustration | null;
  drawing?: Drawing | null;
  image?: SlideImage | null;
};
export const ILLUSTRATED: SlideT["layout"][] = ["title", "bullets", "quote", "stats"];

// Illustration Claude drew for the slide, shown beside the content; only these layouts have room.
// url is an SVG data URL (Claude writes SVG; Anthropic has no image model).
export type SlideImage = { url: string; prompt: string };
export const IMAGED: SlideT["layout"][] = ["title", "bullets", "quote"];

// Text may mark key words as ==highlighted==; strip the marks for plain text.
export const plain = (s: string) => s.replace(/==/g, "");

// What the model returns per slide. Kept flat: a union of every layout compiles
// to a grammar too large for structured outputs. toSlide() maps it to a SlideT.
export const SlideOutput = z.object({
  layout: z.enum(LAYOUTS),
  title: z.string(),
  text: z.string().nullable(),
  caption: z.string().nullable(),
  items: z.array(z.object({
    emoji: z.string().nullable(),
    heading: z.string().nullable(),
    body: z.string(),
    points: z.array(z.string()),
  })),
  nodes: z.array(Node),
  edges: z.array(Edge),
  illustration: z.object({
    items: z.array(z.object({ icon: z.enum(ICONS), label: z.string().nullable() })),
    flow: z.boolean(),
    callout: z.string().nullable(),
  }).nullable(),
  imagePrompt: z.string().nullable(),
  notes: z.string(),
});

export function toSlide(o: z.infer<typeof SlideOutput>): SlideT {
  return { ...layoutSlide(o), illustration: ILLUSTRATED.includes(o.layout) ? o.illustration : null };
}

function layoutSlide(o: z.infer<typeof SlideOutput>): SlideT {
  const { title, text, caption, items } = o;
  const column = (i: number) => ({
    heading: items[i]?.heading ?? "",
    points: items[i]?.points.length ? items[i].points : [items[i]?.body ?? ""],
  });
  switch (o.layout) {
    case "title": return { layout: "title", title, subtitle: text ?? items[0]?.body ?? "" };
    case "bullets": return { layout: "bullets", title, intro: text, bullets: items.map(i => i.body) };
    case "cards": return { layout: "cards", title,
      cards: items.map(i => ({ emoji: i.emoji ?? "✏️", heading: i.heading ?? "", body: i.body })) };
    case "stats": return { layout: "stats", title, caption,
      stats: items.map(i => ({ value: i.heading ?? "", label: i.body })) };
    case "timeline": return { layout: "timeline", title, steps: items.map(i => ({ heading: i.heading ?? "", body: i.body })) };
    case "comparison": return { layout: "comparison", title, left: column(0), right: column(1) };
    case "quote": return { layout: "quote", title, quote: text ?? items[0]?.body ?? "", attribution: caption };
    case "code": return { layout: "code", title, language: caption ?? "", code: text ?? "", points: items.map(i => i.body) };
    case "diagram": return { layout: "diagram", title, nodes: o.nodes, edges: o.edges, caption };
  }
}

// Stored in Slide.scene for Gamma-style slides; legacy slides hold { spec } or Excalidraw data.
export type CardScene = { v: 2; slide: SlideT };
export const isCardScene = (scene: unknown): scene is CardScene =>
  typeof scene === "object" && scene !== null && (scene as { v?: unknown }).v === 2;

export const Outline = z.object({
  deckTitle: z.string(),
  slides: z.array(z.object({ title: z.string(), keyIdea: z.string(), layout: z.enum(LAYOUTS) })).min(3).max(15),
});

export const THEMES = ["notebook", "clean", "midnight"] as const;
export type Theme = (typeof THEMES)[number];

// Every piece of text on a slide, for search and thumbnails.
export function slideText(slide: SlideT): string[] {
  const ill = slide.illustration;
  const extra = ill ? [...ill.items.map(i => i.label ?? ""), ill.callout ?? ""].filter(Boolean) : [];
  const drawn = slide.drawing?.elements.flatMap(e => e.type === "text" && !e.isDeleted ? [e.text] : []) ?? [];
  return [...layoutText(slide), ...extra, ...drawn].map(plain);
}

function layoutText(slide: SlideT): string[] {
  switch (slide.layout) {
    case "title": return [slide.subtitle];
    case "bullets": return [slide.intro ?? "", ...slide.bullets].filter(Boolean);
    case "cards": return slide.cards.flatMap(c => [`${c.emoji} ${c.heading}`, c.body]);
    case "stats": return [...slide.stats.map(s => `${s.value} ${s.label}`), slide.caption ?? ""].filter(Boolean);
    case "timeline": return slide.steps.flatMap(s => [s.heading, s.body]);
    case "comparison": return [slide.left.heading, ...slide.left.points, slide.right.heading, ...slide.right.points];
    case "quote": return [slide.quote, slide.attribution ?? ""].filter(Boolean);
    case "code": return [...slide.points, slide.code];
    case "diagram": return [...slide.nodes.map(n => n.label), slide.caption ?? ""].filter(Boolean);
  }
}
