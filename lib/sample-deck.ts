import type { SlideT } from "@/lib/slide-schema";

// A real deck, in the generator's own format, shown on the landing page.
export const SAMPLE_DECK: { name: string; color: string; fact: string; slide: SlideT }[] = [
  {
    name: "Title", color: "#ffec99", fact: "Every deck opens with a title slide and a doodle of the idea.",
    slide: {
      layout: "title", title: "How HTTPS keeps you private", subtitle: "What happens between you and the padlock",
      illustration: { items: [{ icon: "laptop", label: "You" }, { icon: "lock", label: "Encrypted" }, { icon: "server", label: "Website" }], flow: true, callout: null },
    },
  },
  {
    name: "Bullets", color: "#fcc2d7", fact: "Key words get a highlighter, just like your own study notes.",
    slide: {
      layout: "bullets", title: "What HTTPS protects", intro: null,
      bullets: ["==Privacy==: nobody on the Wi-Fi can read your messages", "==Integrity==: pages can't be changed on the way", "==Identity==: you're talking to the real site"],
      illustration: { items: [{ icon: "person", label: "You" }, { icon: "shield", label: "TLS" }, { icon: "globe", label: "The web" }], flow: true, callout: "Look for the padlock" },
    },
  },
  {
    name: "Cards", color: "#c3fae8", fact: "Two to four ideas side by side, each on its own sticky note.",
    slide: {
      layout: "cards", title: "Three keys to the lock",
      cards: [
        { emoji: "", heading: "Public key", body: "Shared with everyone so they can lock messages for the server." },
        { emoji: "", heading: "Private key", body: "Kept secret by the server; only it can unlock them." },
        { emoji: "", heading: "Session key", body: "Agreed fresh each visit and used for the rest of the chat." },
      ],
    },
  },
  {
    name: "Timeline", color: "#d0ebff", fact: "Steps in order, so a process reads left to right.",
    slide: {
      layout: "timeline", title: "The handshake, step by step",
      steps: [
        { heading: "Hello", body: "Your browser lists the ciphers it knows." },
        { heading: "Certificate", body: "The site proves who it is." },
        { heading: "Key exchange", body: "Both sides agree a secret key." },
        { heading: "Encrypted", body: "Everything after is scrambled." },
      ],
    },
  },
  {
    name: "Stats", color: "#ffc9a8", fact: "Big numbers carry the slide; the caption says where they come from.",
    slide: {
      layout: "stats", title: "HTTPS is now the default", caption: "Share of pages Chrome loads over HTTPS",
      stats: [{ value: "~95%", label: "of pages on Windows" }, { value: "2014", label: "Google starts ranking HTTPS higher" }],
    },
  },
  {
    name: "Diagram", color: "#ffec99", fact: "Boxes and arrows you can drag, recolor and draw on.",
    slide: {
      layout: "diagram", title: "Who sees what", caption: null,
      nodes: [
        { id: "you", kind: "rectangle", label: "Your browser", x: 120, y: 420, w: 260, h: 120, color: "blue" },
        { id: "wifi", kind: "ellipse", label: "Café Wi-Fi", x: 660, y: 260, w: 260, h: 120, color: "yellow" },
        { id: "site", kind: "rectangle", label: "The website", x: 1200, y: 420, w: 260, h: 120, color: "green" },
        { id: "note", kind: "text", label: "only scrambled bytes", x: 660, y: 520, w: 260, h: 80, color: null },
      ],
      edges: [{ from: "you", to: "wifi", label: null }, { from: "wifi", to: "site", label: null }],
    },
  },
];
