import PptxGenJS from "pptxgenjs";
import { plain, type SlideT, type Theme } from "@/lib/slide-schema";
import { NODE_PALETTE, SLIDE_THEMES } from "@/lib/slide-svg";

// Slides are authored on a 1600x900 grid; a 16:9 PowerPoint page is 10in x 5.625in, so 160 units = 1in.
const inch = (units: number) => units / 160;
const hex = (color: string) => color.replace("#", "").toUpperCase();

// PowerPoint wants a real installed font name, not a CSS stack.
const fontOf = (theme: Theme) => (theme === "notebook" ? "Comic Sans MS" : "Calibri");

type Box = { x: number; y: number; w: number; h: number };
const box = (x: number, y: number, w: number, h: number): Box => ({ x: inch(x), y: inch(y), w: inch(w), h: inch(h) });

type TextOpts = {
  size: number;
  bold?: boolean;
  color?: string;
  align?: "left" | "center";
  valign?: "top" | "middle";
  italic?: boolean;
  mono?: boolean;
};

export type ExportSlide = { title: string; notes: string | null; card: SlideT };

// Every text box and shape here is a native PowerPoint object, so the deck opens fully editable.
// Claude's SVG illustrations and the hand-drawn doodle strips are deliberately left out:
// pptxgenjs cannot rasterize SVG outside a browser, so an embedded one arrives broken in
// PowerPoint. The PDF export prints the real slide and keeps every picture.
export function deckToPptx(deck: { title: string; slides: ExportSlide[] }, theme: Theme): Promise<Buffer> {
  const t = SLIDE_THEMES[theme];
  const font = fontOf(theme);
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.title = deck.title;
  pptx.author = "DeckAI";

  for (const { card, notes } of deck.slides) {
    const slide = pptx.addSlide();
    slide.background = { color: hex(t.bg) };
    if (notes) slide.addNotes(notes);

    // The accent rule along the top edge, as on the slide itself.
    slide.addShape(pptx.ShapeType.rect, { ...box(0, 0, 1600, 12), fill: { color: hex(t.accent) }, line: { width: 0 } });

    const text = (value: string, at: Box, opts: TextOpts) => {
      if (!value.trim()) return;
      slide.addText(plain(value), {
        ...at,
        fontFace: opts.mono ? "Consolas" : font,
        fontSize: opts.size,
        bold: opts.bold,
        italic: opts.italic,
        color: hex(opts.color ?? t.fg),
        align: opts.align ?? "left",
        valign: opts.valign ?? "top",
        margin: 0,
        fit: "shrink",
      });
    };

    const list = (items: string[], at: Box, size: number, color: string) => {
      const lines = items.filter((i) => i.trim());
      if (!lines.length) return;
      slide.addText(
        lines.map((p) => ({ text: plain(p), options: { bullet: true, breakLine: true } })),
        { ...at, fontFace: font, fontSize: size, color: hex(color), lineSpacing: size * 1.7, margin: 0, fit: "shrink" },
      );
    };

    // Every layout but "title" and "quote" shares the same heading slot.
    const heading = () => text(card.title, box(110, 70, 1380, 110), { size: 30, bold: true });

    switch (card.layout) {
      case "title": {
        text(card.title, box(160, 280, 1280, 200), { size: 48, bold: true, align: "center", valign: "middle" });
        text(card.subtitle, box(260, 500, 1080, 140), { size: 20, color: t.muted, align: "center", valign: "middle" });
        break;
      }
      case "bullets": {
        heading();
        text(card.intro ?? "", box(110, 220, 1380, 70), { size: 18, color: t.muted });
        const top = card.intro ? 320 : 240;
        list(card.bullets, box(110, top, 1380, 820 - top), 18, t.fg);
        break;
      }
      case "cards": {
        heading();
        const cards = card.cards.slice(0, 4);
        const gap = 28;
        const w = (1380 - gap * (cards.length - 1)) / cards.length;
        cards.forEach((c, i) => {
          const x = 110 + i * (w + gap);
          slide.addShape(pptx.ShapeType.roundRect, {
            ...box(x, 240, w, 420),
            rectRadius: 0.08,
            fill: { color: hex(t.card) },
            line: { color: hex(t.accent), width: 1 },
          });
          text(`${c.emoji} ${plain(c.heading)}`, box(x + 28, 272, w - 56, 110), { size: 18, bold: true });
          text(c.body, box(x + 28, 392, w - 56, 240), { size: 15, color: t.muted });
        });
        break;
      }
      case "stats": {
        heading();
        const stats = card.stats.slice(0, 4);
        const w = 1380 / stats.length;
        stats.forEach((s, i) => {
          const x = 110 + i * w;
          text(s.value, box(x, 300, w, 150), { size: 54, bold: true, color: t.accent, align: "center" });
          text(s.label, box(x + 20, 470, w - 40, 140), { size: 15, color: t.muted, align: "center" });
        });
        text(card.caption ?? "", box(110, 700, 1380, 70), { size: 14, color: t.muted, italic: true });
        break;
      }
      case "timeline": {
        heading();
        const steps = card.steps.slice(0, 6);
        const w = 1380 / steps.length;
        slide.addShape(pptx.ShapeType.line, {
          ...box(110 + w / 2, 330, 1380 - w, 1),
          line: { color: hex(t.accent), width: 2 },
        });
        steps.forEach((s, i) => {
          const cx = 110 + w * (i + 0.5);
          slide.addShape(pptx.ShapeType.ellipse, {
            ...box(cx - 26, 304, 52, 52),
            fill: { color: hex(t.accent) },
            line: { width: 0 },
          });
          text(String(i + 1), box(cx - 26, 316, 52, 40), { size: 16, bold: true, color: t.bg, align: "center" });
          text(s.heading, box(cx - w / 2 + 16, 390, w - 32, 90), { size: 16, bold: true, align: "center" });
          text(s.body, box(cx - w / 2 + 16, 480, w - 32, 220), { size: 14, color: t.muted, align: "center" });
        });
        break;
      }
      case "comparison": {
        heading();
        [card.left, card.right].forEach((col, i) => {
          const x = 110 + i * 710;
          slide.addShape(pptx.ShapeType.roundRect, {
            ...box(x, 240, 670, 420),
            rectRadius: 0.08,
            fill: { color: hex(i === 0 ? t.card : t.bg) },
            line: { color: hex(t.accent), width: 1 },
          });
          text(col.heading, box(x + 32, 272, 606, 80), { size: 20, bold: true });
          list(col.points, box(x + 32, 360, 606, 270), 15, t.muted);
        });
        break;
      }
      case "quote": {
        text(`“${plain(card.quote)}”`, box(200, 260, 1200, 300), { size: 34, bold: true, align: "center", valign: "middle" });
        text(card.attribution ?? "", box(200, 600, 1200, 80), { size: 17, color: t.muted, align: "center" });
        break;
      }
      case "code": {
        heading();
        slide.addShape(pptx.ShapeType.roundRect, {
          ...box(110, 230, 880, 560),
          rectRadius: 0.04,
          fill: { color: hex(theme === "midnight" ? "#0b1120" : "#f3f4f6") },
          line: { color: hex(t.muted), width: 0.5 },
        });
        text(card.code, box(140, 256, 820, 508), { size: 13, mono: true });
        list(card.points, box(1030, 240, 460, 540), 15, t.muted);
        break;
      }
      case "diagram": {
        const nodes = new Map(card.nodes.map((n) => [n.id, { ...n, w: n.w ?? 240, h: n.h ?? 110 }]));
        heading();
        // Edges first so the shapes sit on top of the connector lines.
        for (const e of card.edges) {
          const from = nodes.get(e.from);
          const to = nodes.get(e.to);
          if (!from || !to) continue;
          const [x1, y1] = [from.x + from.w / 2, from.y + from.h / 2];
          const [x2, y2] = [to.x + to.w / 2, to.y + to.h / 2];
          slide.addShape(pptx.ShapeType.line, {
            ...box(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1) || 1, Math.abs(y2 - y1) || 1),
            flipH: x2 < x1,
            flipV: y2 < y1,
            line: { color: hex(t.fg), width: 1.5, endArrowType: "triangle" },
          });
        }
        for (const n of nodes.values()) {
          const at = box(n.x, n.y, n.w, n.h);
          if (n.kind !== "text") {
            const shape =
              n.kind === "ellipse" ? pptx.ShapeType.ellipse : n.kind === "diamond" ? pptx.ShapeType.diamond : pptx.ShapeType.roundRect;
            slide.addShape(shape, {
              ...at,
              rectRadius: 0.06,
              fill: { color: hex(NODE_PALETTE[n.color ?? "blue"]) },
              line: { color: "343A40", width: 1 },
            });
          }
          text(n.label, at, { size: 14, align: "center", valign: "middle", color: n.kind === "text" ? t.fg : "#1F2937" });
        }
        text(card.caption ?? "", box(110, 810, 1380, 60), { size: 14, color: t.muted, italic: true });
        break;
      }
    }
  }

  return pptx.write({ outputType: "nodebuffer" }) as Promise<Buffer>;
}
