"use client";

import { createContext, useContext, useId, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CARD_VIEWBOX, ILLUSTRATION_VIEWBOX, cardMarkup, decorationMarkup, illustrationMarkup } from "@/lib/doodles";
import { DrawingLayer } from "@/components/slide-drawing";
import type { SlideT, Theme } from "@/lib/slide-schema";

type Path = (string | number)[];
type Edit = ((path: Path, value: string) => void) | null;
const EditContext = createContext<Edit>(null);
// A slide shown as a picture (landing page) keeps its titles out of the page's heading outline.
const FigureContext = createContext(false);
function Heading(props: HTMLAttributes<HTMLHeadingElement>) {
  const Tag = useContext(FigureContext) ? "p" : "h2";
  return <Tag {...props} />;
}

// Returns a copy of obj with the value at path replaced.
export function setIn<T>(obj: T, path: Path, value: string): T {
  if (path.length === 0) return value as T;
  const [key, ...rest] = path;
  const copy = (Array.isArray(obj) ? [...obj] : { ...obj }) as Record<string | number, unknown>;
  copy[key] = setIn(copy[key], rest, value);
  return copy as T;
}

// Renders ==marked== words as highlighter pills, cycling colors.
function Highlighted({ text }: { text: string }) {
  let n = 0;
  return text.split(/(==[^=]+==)/g).map((part, i) =>
    part.startsWith("==") && part.endsWith("==") && part.length > 4
      ? <mark key={i} className={`hl hl-${n++ % 5}`} style={{ color: "inherit" }}>{part.slice(2, -2)}</mark>
      : part);
}

// Text that becomes editable in place when the slide is editable.
// While editing it shows the raw text, so the ==highlight== marks can be changed too.
function T({ path, value, className, style }: { path: Path; value: string; className?: string; style?: CSSProperties }) {
  const edit = useContext(EditContext);
  const [editing, setEditing] = useState(false);
  if (!edit) return <span className={className} style={style}><Highlighted text={value} /></span>;
  return (
    <span contentEditable suppressContentEditableWarning className={cn("rounded-[0.3cqw]", className)} style={style}
      onFocus={() => setEditing(true)}
      onBlur={(e) => { setEditing(false); const text = e.currentTarget.innerText.trim(); if (text !== value) edit(path, text); }}
      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } }}>
      {editing ? value : <Highlighted text={value} />}
    </span>
  );
}

// The doodle strip: icons, labels in pills, dashed arrows, callout box.
// Once the slide has a drawing the strip lives there; the empty svg keeps the layout in place.
function IllustrationStrip({ slide, className }: { slide: SlideT; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (!slide.illustration?.items.length) return null;
  return (
    <svg viewBox={ILLUSTRATION_VIEWBOX} className={cn("min-h-0 w-full", className)} aria-hidden data-drawing="illustration"
      dangerouslySetInnerHTML={{ __html: slide.drawing ? "" : illustrationMarkup(slide.illustration, uid, "var(--slide-body)") }} />
  );
}

const startsWithEmoji = (s: string) => /^\p{Extended_Pictographic}/u.test(s);

const cardColors = ["var(--slide-card)", "var(--slide-card-alt)", "var(--slide-card-alt2)"];

// hideDrawing: the drawing editor is open on top and shows the drawing itself.
export function SlideView({ slide, theme, onEdit, hideDrawing, figure, className }: {
  slide: SlideT; theme: Theme; onEdit?: (path: Path, value: string) => void; hideDrawing?: boolean; figure?: boolean; className?: string;
}) {
  return (
    <EditContext.Provider value={onEdit ?? null}>
    <FigureContext.Provider value={!!figure}>
      <div className={cn("slide", `theme-${theme}`, className)}>
        {theme === "notebook" && (
          <svg viewBox="0 0 1600 900" className="pointer-events-none absolute inset-0 size-full" aria-hidden
            dangerouslySetInnerHTML={{ __html: decorationMarkup(slide.title.length) }} />
        )}
        {slide.layout === "title" ? <TitleSlide slide={slide} /> : (
          <div className="relative flex h-full flex-col gap-[2cqw] px-[7cqw] py-[3.5cqw]">
            <Heading className="slide-heading slide-title text-[4.6cqw] leading-tight font-bold">
              <T path={["title"]} value={slide.title} className="marker" />
            </Heading>
            <WithPicture slide={slide} className="min-h-0 flex-1">
              <div className="h-full min-h-0 text-[2.3cqw] leading-snug"><Body slide={slide} /></div>
            </WithPicture>
          </div>
        )}
        {slide.drawing && !hideDrawing && <DrawingLayer drawing={slide.drawing} />}
      </div>
    </FigureContext.Provider>
    </EditContext.Provider>
  );
}

// Claude's illustration in a column beside the content. Once the slide has a drawing the picture
// lives there (movable); the invisible <img> keeps the layout in place.
function WithPicture({ slide, className, children }: { slide: SlideT; className?: string; children: ReactNode }) {
  if (!slide.card && !slide.image) return <div className={className}>{children}</div>;
  return (
    <div className={cn("grid grid-cols-[3fr_2fr] gap-[2.5cqw]", className)}>
      {children}
      {/* A card is drawn rather than generated, so it wins the column when the slide has one. */}
      {slide.card ? <CardPicture slide={slide} /> : (
        /* eslint-disable-next-line @next/next/no-img-element -- generated illustration, not a local asset */
        <img src={slide.image!.url} alt={slide.image!.prompt} data-drawing="image"
          className={cn("size-full min-h-0 object-contain", slide.drawing && "invisible")} />
      )}
    </div>
  );
}

// The labelled mock-up: vector, so its text stays sharp and correctly spelled at any size.
function CardPicture({ slide }: { slide: SlideT }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (!slide.card) return null;
  return (
    <svg viewBox={CARD_VIEWBOX} className={cn("size-full min-h-0", slide.drawing && "invisible")}
      aria-hidden data-drawing="card"
      dangerouslySetInnerHTML={{ __html: cardMarkup(slide.card, uid, "var(--slide-body)") }} />
  );
}

function TitleSlide({ slide }: { slide: Extract<SlideT, { layout: "title" }> }) {
  return (
    <WithPicture slide={slide} className="h-full pr-[5cqw]">
      <TitleText slide={slide} />
    </WithPicture>
  );
}

function TitleText({ slide }: { slide: Extract<SlideT, { layout: "title" }> }) {
  return (
    <div className={cn("relative flex h-full flex-col items-center justify-center gap-[2cqw] py-[4cqw] text-center", slide.image ? "pl-[6cqw]" : "px-[10cqw]")}>
      <Heading className="slide-heading text-[7cqw] leading-none font-bold"><T path={["title"]} value={slide.title} className="marker" /></Heading>
      <p className="text-[2.8cqw] text-[var(--slide-muted)]"><T path={["subtitle"]} value={slide.subtitle} /></p>
      {slide.illustration?.items.length ? <IllustrationStrip slide={slide} className="max-h-[22cqw]" /> : (
        <svg viewBox="0 0 200 12" className="w-[22cqw] text-[var(--slide-accent)]" aria-hidden>
          <path d="M2 8 C 40 2, 80 12, 120 6 S 180 4, 198 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}

function Grid({ count, children, className = "h-full" }: { count: number; children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-[2cqw]", className)} style={{ gridTemplateColumns: `repeat(${Math.min(count, 4)}, minmax(0, 1fr))` }}>{children}</div>;
}

function Body({ slide }: { slide: Exclude<SlideT, { layout: "title" }> }) {
  switch (slide.layout) {
    case "bullets":
      return (
        <div className="flex h-full flex-col gap-[1.4cqw]">
          {slide.intro && <p className="font-bold"><T path={["intro"]} value={slide.intro} /></p>}
          <ul className="flex flex-col gap-[1cqw]">
            {slide.bullets.map((b, i) => (
              <li key={i} className="flex gap-[1cqw]">
                <span className={startsWithEmoji(b) ? "" : "text-[var(--slide-accent)]"}>•</span><T path={["bullets", i]} value={b} />
              </li>
            ))}
          </ul>
          <IllustrationStrip slide={slide} className="flex-1" />
        </div>
      );
    case "cards":
      return (
        <Grid count={slide.cards.length}>
          {slide.cards.map((c, i) => (
            <div key={i} className="sketch sticky flex flex-col gap-[1cqw] p-[2cqw]" style={{ background: cardColors[i % 3] }}>
              <T path={["cards", i, "emoji"]} value={c.emoji} className="text-[4cqw]" />
              <T path={["cards", i, "heading"]} value={c.heading} className="slide-heading text-[3cqw] leading-tight font-bold" />
              <T path={["cards", i, "body"]} value={c.body} className="text-[1.8cqw]" />
            </div>
          ))}
        </Grid>
      );
    case "stats":
      return (
        <div className="flex h-full flex-col gap-[2cqw]">
          <Grid count={slide.stats.length} className="min-h-0 flex-1">
            {slide.stats.map((s, i) => (
              <div key={i} className="sketch flex flex-col items-center justify-center gap-[0.8cqw] p-[2cqw] text-center">
                <T path={["stats", i, "value"]} value={s.value} className="slide-heading text-[6.5cqw] leading-none font-bold text-[var(--slide-accent)]" />
                <T path={["stats", i, "label"]} value={s.label} className="text-[1.9cqw] text-[var(--slide-muted)]" />
              </div>
            ))}
          </Grid>
          {slide.caption && <p className="text-center text-[var(--slide-muted)]"><T path={["caption"]} value={slide.caption} /></p>}
          <IllustrationStrip slide={slide} className="max-h-[17cqw]" />
        </div>
      );
    case "timeline":
      return (
        <ol className="relative flex h-full items-start gap-[1.5cqw] pt-[3cqw]">
          <span className="absolute top-[4.4cqw] right-[2cqw] left-[2cqw] border-t-[0.25cqw] border-dashed border-[var(--slide-accent)]" aria-hidden />
          {slide.steps.map((s, i) => (
            <li key={i} className="relative flex flex-1 flex-col items-center gap-[1cqw] text-center">
              <span className="sketch slide-heading flex size-[3cqw] items-center justify-center bg-[var(--slide-bg)] text-[2cqw] font-bold">{i + 1}</span>
              <T path={["steps", i, "heading"]} value={s.heading} className="slide-heading text-[2.6cqw] leading-tight font-bold" />
              <T path={["steps", i, "body"]} value={s.body} className="text-[1.7cqw] text-[var(--slide-muted)]" />
            </li>
          ))}
        </ol>
      );
    case "comparison":
      return (
        <div className="grid h-full grid-cols-2 gap-[3cqw]">
          {(["left", "right"] as const).map((side, i) => (
            <div key={side} className="sketch sticky flex flex-col gap-[1.4cqw] p-[2.4cqw]" style={{ background: cardColors[i + 1] }}>
              <T path={[side, "heading"]} value={slide[side].heading} className="slide-heading text-[3.2cqw] font-bold" />
              <ul className="flex flex-col gap-[1cqw]">
                {slide[side].points.map((p, j) => (
                  <li key={j} className="flex gap-[1cqw]"><span>{i === 0 ? "•" : "→"}</span><T path={[side, "points", j]} value={p} /></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    case "quote":
      return (
        <figure className="flex h-full flex-col items-center justify-center gap-[2cqw] px-[4cqw] text-center">
          <blockquote className="slide-heading text-[4.4cqw] leading-tight">
            <span className="text-[var(--slide-accent)]">“</span><T path={["quote"]} value={slide.quote} /><span className="text-[var(--slide-accent)]">”</span>
          </blockquote>
          {slide.attribution && <figcaption className="text-[var(--slide-muted)]">— <T path={["attribution"]} value={slide.attribution} /></figcaption>}
          <IllustrationStrip slide={slide} className="max-h-[18cqw]" />
        </figure>
      );
    case "code":
      return (
        <div className="grid h-full grid-cols-[3fr_2fr] gap-[2.5cqw]">
          <pre className="sketch overflow-hidden bg-[var(--slide-code-bg)] p-[2cqw] font-mono text-[1.6cqw] leading-relaxed whitespace-pre-wrap">
            <T path={["code"]} value={slide.code} />
          </pre>
          <ul className="flex flex-col gap-[1.4cqw]">
            {slide.points.map((p, i) => (
              <li key={i} className="flex gap-[1cqw]"><span className="text-[var(--slide-accent)]">✦</span><T path={["points", i]} value={p} /></li>
            ))}
          </ul>
        </div>
      );
    case "diagram":
      return <Diagram slide={slide} />;
  }
}

const nodeFill: Record<string, string> = { blue: "#d0ebff", green: "#d3f9d8", yellow: "#fff3bf", red: "#ffe3e3", gray: "#f1f3f5" };

// Diagram coordinates are on a 1600x900 canvas whose top band holds the title, so crop it.
function Diagram({ slide }: { slide: Extract<SlideT, { layout: "diagram" }> }) {
  const box = new Map(slide.nodes.map(n => [n.id, { x: n.x, y: n.y, w: n.w ?? 240, h: n.h ?? 110 }]));
  const center = (id: string) => { const b = box.get(id)!; return [b.x + b.w / 2, b.y + b.h / 2]; };
  // Unique SVG ids: several slides (thumbnails) render on one page.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <div className="flex h-full flex-col gap-[1cqw]">
      <svg viewBox="0 140 1600 720" className="min-h-0 w-full flex-1" style={{ fontFamily: "var(--slide-body)" }} data-drawing="diagram">
        {!slide.drawing && <>
          <defs>
            <marker id={`${uid}a`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--slide-fg)" />
            </marker>
            {/* Slight wobble so shapes look hand-drawn. */}
            <filter id={`${uid}w`} filterUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900"><feTurbulence baseFrequency="0.02" numOctaves="2" seed="3" /><feDisplacementMap in="SourceGraphic" scale="4" /></filter>
          </defs>
          {slide.edges.filter(e => box.has(e.from) && box.has(e.to)).map((e, i) => {
            const [x1, y1] = center(e.from), [x2, y2] = center(e.to);
            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--slide-fg)" strokeWidth="3" markerEnd={`url(#${uid}a)`} filter={`url(#${uid}w)`} />
                {e.label && <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 12} textAnchor="middle" fontSize="24" fill="var(--slide-muted)">{e.label}</text>}
              </g>
            );
          })}
          {slide.nodes.map(n => {
            const { x, y, w, h } = box.get(n.id)!;
            const label = <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="middle" fontSize="28"
              fill={n.kind === "text" ? "var(--slide-fg)" : "#22252b"}>{n.label}</text>;
            if (n.kind === "text") return <g key={n.id}>{label}</g>;
            const props = { fill: nodeFill[n.color ?? "blue"], stroke: "#22252b", strokeWidth: 3, filter: `url(#${uid}w)` };
            return (
              <g key={n.id}>
                {n.kind === "ellipse" ? <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} {...props} />
                  : n.kind === "diamond" ? <polygon points={`${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}`} {...props} />
                  : <rect x={x} y={y} width={w} height={h} rx={14} {...props} />}
                {label}
              </g>
            );
          })}
        </>}
      </svg>
      {slide.caption && <p className="text-center text-[var(--slide-muted)]"><T path={["caption"]} value={slide.caption} /></p>}
    </div>
  );
}
