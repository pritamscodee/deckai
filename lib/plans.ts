import type { Theme } from "@/lib/slide-schema";

export const PLAN_IDS = ["starter", "pro", "ultra"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type Plan = {
  id: PlanId;
  name: string;
  price: number;              // ₹ per month, inclusive of GST
  decks: number;              // per billing period
  slides: number;
  premiumThemes: boolean;
  editableExport: boolean;    // .pptx with real, editable text boxes; every plan exports PDF
  priority: number;           // trigger.dev queue priority, in seconds of head start
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter", name: "Starter", price: 199, decks: 20, slides: 200,
    premiumThemes: false, editableExport: false, priority: 0,
    features: ["20 decks/month", "200 slides/month", "All basic themes", "PDF export"],
  },
  pro: {
    id: "pro", name: "Pro", price: 499, decks: 60, slides: 600,
    premiumThemes: true, editableExport: true, priority: 30,
    features: ["60 decks/month", "600 slides/month", "Premium themes", "PDF + editable PowerPoint", "Priority generation"],
  },
  ultra: {
    id: "ultra", name: "Ultra", price: 999, decks: 120, slides: 1200,
    premiumThemes: true, editableExport: true, priority: 120,
    features: ["120 decks/month", "1,200 slides/month", "Premium themes", "PDF + editable PowerPoint", "Priority queue"],
  },
};

// Priced so a subscriber who uses the whole allowance still leaves a healthy margin after GST
// and Razorpay fees. Every slide now carries a drawn illustration, which is the dominant cost:
// gpt-image-1-mini at "low" is 272 output tokens at $8/1M, about ₹0.19 an image, so a slide
// costs roughly ₹0.25 all in (illustration + Claude Haiku + Trigger.dev compute).
//
// The illustration model is load-bearing for these prices. gpt-image-1.5 at "medium" is ~15x
// dearer (₹3.00 a slide), which would cost ₹594 of images against ₹199 of Starter revenue.
// Changing the model in trigger/generate-deck.ts means revisiting these numbers.
export const FROM_PRICE = PLANS.starter.price;

// The smallest deck the outline ever plans; a deck is only started when this many slides are left.
export const MIN_DECK_SLIDES = 6;

export const PREMIUM_THEMES: Theme[] = ["midnight"];

// Razorpay plan ids, created once with scripts/razorpay-plans.mjs.
export const razorpayPlanId = (plan: PlanId) => process.env[`RAZORPAY_PLAN_${plan.toUpperCase()}`];

// Razorpay subscription statuses, grouped by what they mean for access.
// live: paid and running. grace: the period already paid for runs out at periodEnd
// (cancelled at cycle end, finished, or a charge being retried).
// Anything else — created (never paid), halted (retries exhausted), paused, expired — gets nothing.
const LIVE = ["active", "authenticated"];
const GRACE = ["cancelled", "completed", "pending"];

type Billing = { plan: string | null; subscriptionStatus: string | null; periodEnd: Date | null };

// The user's plan if their subscription is paid up. Status and period have to agree:
// a halted subscription doesn't keep working just because its period hasn't ended.
export function activePlan(user: Billing): Plan | null {
  if (!user.plan || !PLAN_IDS.includes(user.plan as PlanId)) return null;
  const status = user.subscriptionStatus;
  const paidThrough = !!user.periodEnd && user.periodEnd > new Date();
  // No subscription id at all (a plan granted directly, e.g. scripts/free-user.mjs) rides on periodEnd.
  const live = status === null ? paidThrough : LIVE.includes(status) || (GRACE.includes(status) && paidThrough);
  return live ? PLANS[user.plan as PlanId] : null;
}

// True while a subscription still exists at Razorpay and must not be replaced by a new one.
export const subscriptionIsOpen = (user: Billing & { subscriptionId: string | null }) =>
  !!user.subscriptionId &&
  (LIVE.includes(user.subscriptionStatus ?? "") ||
    (GRACE.includes(user.subscriptionStatus ?? "") && !!user.periodEnd && user.periodEnd > new Date()));

export const canUseTheme = (plan: Plan | null, theme: Theme) => !PREMIUM_THEMES.includes(theme) || !!plan?.premiumThemes;
