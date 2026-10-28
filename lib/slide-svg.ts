import { plain, slideText, type SlideT, type Theme } from "@/lib/slide-schema";
import { illustrationMarkup } from "@/lib/doodles";

export const NODE_PALETTE: Record<string, string> = { blue: "#a5d8ff", green: "#b2f2bb", yellow: "#ffec99", red: "#ffc9c9", gray: "#e9ecef" };
const palette = NODE_PALETTE;

// Shared by the SVG thumbnail and the PowerPoint export, so a deck looks the same in both.
export const SLIDE_THEMES: Record<Theme, { bg: string; fg: string; muted: string; accent: string; font: string; card: string }> = {
  notebook: { bg: "#fbf8f0", fg: "#1f2937", muted: "#4b5563", accent: "#e8590c", font: "'Comic Sans MS', 'Segoe Print', cursive", card: "#fff3bf" },
  clean: { bg: "#ffffff", fg: "#111827", muted: "#4b5563", accent: "#4f46e5", font: "Helvetica, Arial, sans-serif", card: "#eef2ff" },
  midnight: { bg: "#0f172a", fg: "#f1f5f9", muted: "#cbd5e1", accent: "#38bdf8", font: "Helvetica, Arial, sans-serif", card: "#1e293b" },
};
const themes = SLIDE_THEMES;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// SVG has no text wrapping, so wrap by character count.
function wrap(text: string, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if ((line + " " + word).trim().length > width) { if (line) lines.push(line); line = word; }
    else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines;
}

function diagram(slide: Extract<SlideT, { layout: "diagram" }>, fg: string) {
  const box = new Map(slide.nodes.map(n => [n.id, { x: n.x, y: n.y, w: n.w ?? 240, h: n.h ?? 110 }]));
  const center = (id: string) => { const b = box.get(id)!; return [b.x + b.w / 2, b.y + b.h / 2]; };
  const edges = slide.edges.filter(e => box.has(e.from) && box.has(e.to)).map(e => {
    const [x1, y1] = center(e.from), [x2, y2] = center(e.to);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${fg}" stroke-width="3" marker-end="url(#a)"/>`;
  });
  const nodes = slide.nodes.map(n => {
    const { x, y, w, h } = box.get(n.id)!;
    const text = `<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="middle" font-size="24" fill="#1f2937">${esc(n.label)}</text>`;
    if (n.kind === "text") return text.replace('fill="#1f2937"', `fill="${fg}"`);
    const shape = n.kind === "ellipse"
      ? `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}"`
      : n.kind === "diamond"
        ? `<polygon points="${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}"`
        : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12"`;
    return `${shape} fill="${palette[n.color ?? "blue"]}" stroke="#343a40" stroke-width="2"/>${text}`;
  });
  return `<defs><marker id="a" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${fg}"/></marker></defs>${edges.join("")}${nodes.join("")}`;
}

// Flat SVG preview of a slide, rendered server-side for the ImageKit thumbnail.
export function slideToSvg(slide: SlideT, theme: Theme = "notebook") {
  const t = themes[theme];
  const isTitle = slide.layout === "title";
  const ill = slide.illustration?.items.length ? slide.illustration : null;
  const titleLines = wrap(plain(slide.title), isTitle ? 28 : 40).slice(0, 2);
  const titleY = isTitle ? (ill ? 230 : 360) : 120;
  const title = titleLines.map((l, i) =>
    `<text x="${isTitle || theme === "notebook" ? 800 : 100}" y="${titleY + i * 80}" ${isTitle || theme === "notebook" ? 'text-anchor="middle"' : ""} font-size="${isTitle ? 76 : 60}" font-weight="bold" fill="${t.fg}">${esc(l)}</text>`).join("");

  let body: string;
  if (slide.layout === "diagram") body = diagram(slide, t.fg);
  else {
    // slideText includes the illustration labels and drawing text; the strip is drawn separately below.
    const text = slideText({ ...slide, illustration: null, drawing: null } as SlideT);
    const lines = text.flatMap(s => wrap(s, isTitle ? 50 : 60)).slice(0, isTitle ? 3 : ill ? 4 : 9);
    const startY = isTitle ? titleY + titleLines.length * 80 + 40 : 280;
    body = lines.map((l, i) =>
      `<text x="${isTitle ? 800 : 100}" y="${startY + i * 62}" ${isTitle ? 'text-anchor="middle"' : ""} font-size="38" fill="${t.muted}">${isTitle ? "" : "• "}${esc(l)}</text>`).join("");
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" font-family="${t.font}">
<rect width="1600" height="900" fill="${t.bg}"/>
${theme === "notebook" ? '<defs><pattern id="dots" width="35" height="35" patternUnits="userSpaceOnUse"><circle cx="17" cy="17" r="2" fill="#d6d1c4"/></pattern></defs><rect width="1600" height="900" fill="url(#dots)"/>' : ""}
<rect x="0" y="0" width="1600" height="12" fill="${t.accent}"/>
${title}
${body}
${ill && slide.layout !== "diagram" ? `<g transform="translate(100 ${isTitle ? 560 : 540}) scale(1.4)">${illustrationMarkup(ill, "t", t.font)}</g>` : ""}
</svg>`;
}

// Uploads via ImageKit's REST upload API (no SDK needed).
export async function uploadToImageKit(svg: string, fileName: string, folder: string) {
  const form = new FormData();
  form.append("file", new Blob([svg], { type: "image/svg+xml" }), fileName);
  form.append("fileName", fileName);
  form.append("folder", folder);
  form.append("useUniqueFileName", "false");
  form.append("overwriteFile", "true");
  const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY}:`).toString("base64")}` },
    body: form,
  });
  if (!res.ok) throw new Error(`ImageKit upload failed: ${res.status} ${await res.text()}`);
  return ((await res.json()) as { url: string }).url;
}
