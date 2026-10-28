// Hand-drawn doodle icons and the illustration strip drawn under a slide, chaidocs style.
// Plain SVG strings so the same drawing is used in the app and in ImageKit thumbnails.

const ink = "#1f2328";

// Each icon is drawn in a 100x100 box; elements without a fill are outlines only.
const icons = {
  server: `<rect x="22" y="12" width="56" height="22" rx="4" fill="#a5d8ff"/><rect x="22" y="39" width="56" height="22" rx="4" fill="#a5d8ff"/><rect x="22" y="66" width="56" height="22" rx="4" fill="#a5d8ff"/><circle cx="32" cy="23" r="2.5" fill="${ink}"/><circle cx="32" cy="50" r="2.5" fill="${ink}"/><circle cx="32" cy="77" r="2.5" fill="${ink}"/><path d="M46 23h22M46 50h22M46 77h22"/>`,
  database: `<path d="M22 24v52c0 7 12.5 12 28 12s28-5 28-12V24" fill="#b2f2bb"/><ellipse cx="50" cy="24" rx="28" ry="11" fill="#d3f9d8"/><path d="M22 42c0 7 12.5 12 28 12s28-5 28-12M22 60c0 7 12.5 12 28 12s28-5 28-12"/>`,
  cloud: `<path d="M28 72h46a16 16 0 0 0 0-32 22 22 0 0 0-42-6 18 18 0 0 0-4 38z" fill="#d0ebff"/>`,
  browser: `<rect x="12" y="20" width="76" height="60" rx="6" fill="#ffffff"/><path d="M12 34h76"/><circle cx="21" cy="27" r="2.5" fill="#ff8787"/><circle cx="29" cy="27" r="2.5" fill="#ffd43b"/><circle cx="37" cy="27" r="2.5" fill="#69db7c"/><rect x="22" y="44" width="26" height="24" rx="3" fill="#d0bfff"/><path d="M56 48h22M56 58h22M56 68h14"/>`,
  laptop: `<rect x="22" y="22" width="56" height="40" rx="4" fill="#a5d8ff"/><path d="M12 72h76l-6 8H18z" fill="#e9ecef"/>`,
  phone: `<rect x="34" y="12" width="32" height="76" rx="7" fill="#ffffff"/><rect x="39" y="22" width="22" height="50" rx="2" fill="#a5d8ff"/><circle cx="50" cy="80" r="3" fill="${ink}"/>`,
  person: `<circle cx="50" cy="22" r="13" fill="#ffffff"/><circle cx="45" cy="20" r="1.6" fill="${ink}"/><circle cx="55" cy="20" r="1.6" fill="${ink}"/><path d="M44 26q6 5 12 0"/><path d="M38 38h24l4 32H34z" fill="#b2f2bb"/><path d="M42 70l-4 20M58 70l4 20M38 44l-14 16M62 44l14-16"/>`,
  people: `<g transform="translate(-14 10) scale(.8)"><circle cx="50" cy="22" r="13" fill="#ffffff"/><path d="M44 26q6 5 12 0"/><path d="M38 38h24l4 32H34z" fill="#fcc2d7"/><path d="M42 70l-4 20M58 70l4 20"/></g><g transform="translate(34 10) scale(.8)"><circle cx="50" cy="22" r="13" fill="#ffffff"/><path d="M44 26q6 5 12 0"/><path d="M38 38h24l4 32H34z" fill="#a5d8ff"/><path d="M42 70l-4 20M58 70l4 20"/></g>`,
  box: `<path d="M18 36l32-14 32 14v38l-32 14-32-14z" fill="#ffc078"/><path d="M18 36l32 14 32-14M50 50v38M34 29l32 14"/>`,
  key: `<circle cx="32" cy="50" r="16" fill="#ffec99"/><circle cx="32" cy="50" r="5" fill="#ffffff"/><path d="M48 50h38M74 50v12M84 50v9"/>`,
  lock: `<path d="M34 44V34a16 16 0 0 1 32 0v10"/><rect x="24" y="44" width="52" height="40" rx="6" fill="#ffec99"/><circle cx="50" cy="60" r="5" fill="${ink}"/><path d="M50 64v8"/>`,
  shield: `<path d="M50 12l32 12v24c0 20-14 34-32 40-18-6-32-20-32-40V24z" fill="#b2f2bb"/><path d="M36 50l10 10 18-20"/>`,
  book: `<path d="M50 30c-10-8-24-10-36-8v52c12-2 26 0 36 8z" fill="#ffffff"/><path d="M50 30c10-8 24-10 36-8v52c-12-2-26 0-36 8z" fill="#d0ebff"/><path d="M50 30v52M22 36q12-2 22 4M22 48q12-2 22 4M58 40q10-6 22-4M58 52q10-6 22-4"/>`,
  file: `<path d="M26 12h34l16 16v60H26z" fill="#ffffff"/><path d="M60 12v16h16M34 44h32M34 56h32M34 68h20"/>`,
  code: `<rect x="12" y="20" width="76" height="60" rx="6" fill="#343a40"/><path d="M36 40l-12 10 12 10M64 40l12 10-12 10M54 36l-8 28" stroke="#b2f2bb"/>`,
  gear: `<circle cx="50" cy="50" r="31" stroke-width="10" stroke-dasharray="8 8.23"/><circle cx="50" cy="50" r="26" fill="#e9ecef"/><circle cx="50" cy="50" r="10" fill="#ffffff"/>`,
  chip: `<rect x="28" y="28" width="44" height="44" rx="4" fill="#d0bfff"/><rect x="40" y="40" width="20" height="20" rx="2" fill="#ffffff"/><path d="M38 28V16M50 28V16M62 28V16M38 72v12M50 72v12M62 72v12M28 38H16M28 50H16M28 62H16M72 38h12M72 50h12M72 62h12"/>`,
  robot: `<rect x="24" y="32" width="52" height="42" rx="10" fill="#a5d8ff"/><circle cx="40" cy="50" r="5" fill="#ffffff"/><circle cx="60" cy="50" r="5" fill="#ffffff"/><path d="M42 64h16M50 32V21M24 50h-8M76 50h8"/><circle cx="50" cy="17" r="4" fill="#ff8787"/>`,
  brain: `<path d="M50 22c-6-6-18-4-20 4-10 0-14 10-10 16-6 6-4 16 4 18 0 8 10 14 18 10 4 6 8 6 8 0z" fill="#fcc2d7"/><path d="M50 22c6-6 18-4 20 4 10 0 14 10 10 16 6 6 4 16-4 18 0 8-10 14-18 10-4 6-8 6-8 0z" fill="#fcc2d7"/><path d="M50 22v48M36 40q6 4 4 10M64 40q-6 4-4 10"/>`,
  bulb: `<path d="M50 14a24 24 0 0 0-14 43c3 3 4 7 4 11h20c0-4 1-8 4-11a24 24 0 0 0-14-43z" fill="#ffec99"/><path d="M40 76h20M42 84h16M46 50l4 6 4-6"/>`,
  rocket: `<path d="M50 10c14 12 18 30 14 50H36c-4-20 0-38 14-50z" fill="#e9ecef"/><circle cx="50" cy="36" r="7" fill="#a5d8ff"/><path d="M36 50l-12 16 14-2zM64 50l12 16-14-2z" fill="#ff8787"/><path d="M42 64q8 24 16 0" fill="#ffc078"/>`,
  money: `<rect x="14" y="30" width="72" height="40" rx="5" fill="#b2f2bb"/><circle cx="50" cy="50" r="10" fill="#d3f9d8"/><path d="M50 44v12M24 40h6M70 60h6"/>`,
  chart: `<path d="M16 84h70M16 84V16"/><rect x="24" y="56" width="12" height="28" fill="#a5d8ff"/><rect x="42" y="42" width="12" height="42" fill="#b2f2bb"/><rect x="60" y="26" width="12" height="58" fill="#ffc078"/><path d="M24 46l18-14 18 6 18-20"/>`,
  globe: `<circle cx="50" cy="50" r="34" fill="#a5d8ff"/><ellipse cx="50" cy="50" rx="14" ry="34"/><path d="M16 50h68M22 32h56M22 68h56"/>`,
  mail: `<rect x="14" y="26" width="72" height="48" rx="5" fill="#ffffff"/><path d="M14 30l36 26 36-26"/>`,
  chat: `<path d="M16 22h68v42H44L28 80V64H16z" fill="#ffffff"/><path d="M28 38h44M28 50h30"/>`,
  clock: `<circle cx="50" cy="50" r="34" fill="#ffffff"/><path d="M50 28v22l14 10"/>`,
  check: `<circle cx="50" cy="50" r="34" fill="#b2f2bb"/><path d="M34 50l11 12 22-24" stroke-width="6"/>`,
  cross: `<circle cx="50" cy="50" r="34" fill="#ffc9c9"/><path d="M38 38l24 24M62 38L38 62" stroke-width="6"/>`,
  warning: `<path d="M50 14l38 68H12z" fill="#ffec99"/><path d="M50 38v22" stroke-width="6"/><circle cx="50" cy="70" r="3.5" fill="${ink}"/>`,
  star: `<path d="M50 12l11 24 26 3-19 18 5 26-23-13-23 13 5-26-19-18 26-3z" fill="#ffec99"/>`,
  heart: `<path d="M50 84C18 62 14 42 22 30c8-12 24-10 28 2 4-12 20-14 28-2 8 12 4 32-28 54z" fill="#ffc9c9"/>`,
  scale: `<path d="M50 16v66M30 86h40M18 30h64M18 30L8 54M18 30l10 24M82 30L72 54M82 30l10 24"/><path d="M8 54a10 6 0 0 0 20 0zM72 54a10 6 0 0 0 20 0z" fill="#ffec99"/>`,
  search: `<circle cx="42" cy="42" r="24" fill="#d0ebff"/><path d="M60 60l24 24" stroke-width="8"/>`,
} as const;

export const ICONS = Object.keys(icons) as [keyof typeof icons, ...(keyof typeof icons)[]];
export type Icon = keyof typeof icons;

export type Illustration = {
  items: { icon: Icon; label: string | null }[];
  flow: boolean;
  callout: string | null;
};

export const ILLUSTRATION_PILLS = ["#ffec99", "#fcc2d7", "#ffc9a8", "#c3fae8", "#d0ebff"];
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

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

// A width param rather than a second stroke-width attribute: duplicate attributes are fine
// inline in HTML but make the standalone .svg (ImageKit thumbnail) invalid XML, so it won't load.
const strokes = (width = 3.5) => `fill="none" stroke="${ink}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;

// One icon as a standalone SVG file, padded by 4 for the stroke; placed as an image in the drawing editor.
export const iconSvg = (icon: Icon) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 108 108" width="216" height="216"><g ${strokes()}>${icons[icon] ?? icons.star}</g></svg>`;

// Wobble filter + arrowhead; ids are prefixed so several drawings can share a page.
const defs = (uid: string) =>
  `<defs><filter id="${uid}w" filterUnits="userSpaceOnUse" x="-50" y="-50" width="1100" height="400"><feTurbulence baseFrequency="0.03" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter>` +
  `<marker id="${uid}a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1,1 L9,5 L1,9" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/></marker></defs>`;

export const ILLUSTRATION_VIEWBOX = "0 0 1000 260";

// Inner markup of a 1000x260 strip: icons in a row, labels in highlighter pills,
// dashed curved arrows between them and an optional boxed callout on the right.
export function illustrationMarkup(ill: Illustration, uid: string, font: string) {
  const items = ill.items.slice(0, 5);
  const area = ill.callout ? 700 : 1000;
  const xs = items.map((_, i) => (area * (i + 0.5)) / items.length);
  const out: string[] = [defs(uid)];

  const arrow = (x1: number, x2: number) =>
    x2 - x1 > 50 && out.push(`<path d="M${x1} 62 Q${(x1 + x2) / 2} 14 ${x2} 62" ${strokes(2.5)} stroke-dasharray="7 7" marker-end="url(#${uid}a)"/>`);
  if (ill.flow) xs.slice(1).forEach((x, i) => arrow(xs[i] + 64, x - 64));
  if (ill.callout && xs.length) arrow(xs[xs.length - 1] + 64, area + 20);

  items.forEach((it, i) => {
    out.push(`<g transform="translate(${xs[i] - 55} 16) scale(1.1)" ${strokes()} filter="url(#${uid}w)">${icons[it.icon] ?? icons.star}</g>`);
    if (it.label) {
      const w = Math.min(it.label.length * 12 + 28, area / items.length - 12);
      out.push(`<rect x="${xs[i] - w / 2}" y="152" width="${w}" height="40" rx="12" fill="${ILLUSTRATION_PILLS[i % ILLUSTRATION_PILLS.length]}"/>`);
      out.push(`<text x="${xs[i]}" y="180" text-anchor="middle" font-size="24" font-family="${font}" fill="${ink}">${esc(it.label)}</text>`);
    }
  });

  if (ill.callout) {
    const lines = wrap(ill.callout, 20).slice(0, 4);
    const h = lines.length * 32 + 28;
    const y = Math.max(8, 110 - h / 2);
    out.push(`<rect x="${area + 34}" y="${y + 6}" width="262" height="${h}" rx="6" fill="#a5d8ff"/>`);
    out.push(`<rect x="${area + 28}" y="${y}" width="262" height="${h}" rx="6" fill="#ffffff" stroke="${ink}" stroke-width="3"/>`);
    lines.forEach((l, j) => out.push(`<text x="${area + 159}" y="${y + 38 + j * 32}" text-anchor="middle" font-size="25" font-family="${font}" fill="${ink}">${esc(l)}</text>`));
  }
  return out.join("");
}

// Little clouds and spirals in the margins, like a notebook doodled on.
export function decorationMarkup(seed: number) {
  const spiral = (x: number, y: number, c: string) =>
    `<path d="M${x} ${y}c3 0 4 3 2 5s-7 1-7-4 6-9 11-7 9 9 5 14" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`;
  const cloud = (x: number, y: number, s: number, c: string) =>
    `<g transform="translate(${x} ${y}) scale(${s})"><path d="M28 72h46a16 16 0 0 0 0-32 22 22 0 0 0-42-6 18 18 0 0 0-4 38z" fill="${c}" stroke="#6b7280" stroke-width="3"/></g>`;
  const flip = seed % 2 === 0;
  return [
    cloud(flip ? 40 : 1440, 20, 0.9, "#e5dbff"),
    cloud(flip ? 1450 : 60, 34, 0.7, "#d0ebff"),
    spiral(flip ? 1540 : 50, 330 + (seed % 5) * 40, "#f783ac"),
    spiral(flip ? 60 : 1530, 620 + (seed % 3) * 50, "#748ffc"),
    spiral(flip ? 1500 : 110, 820, "#ff922b"),
  ].join("");
}


// A labelled card: the hand-drawn mock-up of a real thing (an order, a profile, a record),
// with its fields as pills and its actions as buttons. Rendered as HTML by the slide, so every
// label is editable in place like the rest of the slide and themes restyle it for free.
export type SlideCard = {
  title: string | null;
  rows: string[];
  buttons: string[];
};

// Action bars on a card, distinct from the pill colours used for its fields.
export const CARD_BUTTONS = ["#ffc9a8", "#dee2e6", "#d0bfff"];
