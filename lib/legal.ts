// The details that have to be true and reachable on a page taking recurring payments in India.
//
// ⚠ Before taking live payments: fill in LEGAL_NAME, ADDRESS and SUPPORT_EMAIL with the real
// registered details, set GST_NUMBER if you are registered, and have a lawyer read the three
// pages under /terms, /privacy and /refunds. Razorpay checks that these pages exist, name the
// merchant, and state the refund and cancellation terms before activating a live account.
export const COMPANY = {
  product: "DeckAI",
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME ?? "DeckAI",
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? "",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@deckai.app",
  gstNumber: process.env.NEXT_PUBLIC_GST_NUMBER ?? "",
  jurisdiction: "India",
  // Keep in step with the real last edit; shown on each page.
  updated: "28 October 2026",
  // A literal, not new Date(): the landing page is prerendered, and a clock reading
  // would force it to be rendered per request for the sake of a copyright line.
  year: "2026",
} as const;

// Everyone a deck's contents reach, named on the privacy page because prompts leave the server.
export const PROCESSORS = [
  { name: "Anthropic (Claude)", role: "Writes and illustrates your slides from the topic you type", data: "Your prompt and the slide text it generates" },
  { name: "Neon", role: "Hosts the database", data: "Your account, decks and slides" },
  { name: "Trigger.dev", role: "Runs deck generation in the background", data: "Your prompt and deck id" },
  { name: "ImageKit", role: "Stores and serves slide thumbnails", data: "Rendered slide images" },
  { name: "Razorpay", role: "Takes payments and runs subscriptions", data: "Your name, email and payment details" },
  { name: "Vercel", role: "Hosts and serves the site", data: "Request logs, including IP address" },
] as const;

export const LEGAL_PAGES = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refunds", label: "Refunds" },
] as const;
