"use server";

import { redirect } from "next/navigation";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import { tasks } from "@trigger.dev/sdk";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import type { generateDeck } from "@/trigger/generate-deck";
import type { Prisma } from "@/lib/generated/prisma/client";
import { isCardScene, Slide, slideText, THEMES, type SlideT, type Theme } from "@/lib/slide-schema";
import { activePlan, canUseTheme, MIN_DECK_SLIDES, PLANS, PLAN_IDS, razorpayPlanId, subscriptionIsOpen, type PlanId } from "@/lib/plans";
import { keyId, razorpay, verifyCheckout, type Subscription } from "@/lib/razorpay";
import { applySubscription } from "@/lib/billing";

function slugify(text: string) {
  const base = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  return `${base || "deck"}-${Math.random().toString(36).slice(2, 8)}`;
}

// A queue failure is always configuration, and the cause has to reach whoever is looking.
// Trimmed because it lands in a user-facing sentence, not a log line.
function queueReason(err: unknown) {
  const text = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  return text.replace(/\s+/g, " ").trim().slice(0, 160) || "no error message";
}

export async function createDeck(formData: FormData) {
  const { id } = await requireUser();
  const prompt = String(formData.get("prompt") ?? "").trim();
  if (prompt.length < 3) return;

  // Every deck needs a paid plan with room left this month.
  const user = await db.user.findUniqueOrThrow({ where: { id } });
  const plan = activePlan(user);
  if (!plan) redirect("/pricing");
  // Enough room for a whole deck, not just one more slide: a deck that dies halfway
  // through would still have cost the user one of the month's decks.
  if (user.decksUsed >= plan.decks || plan.slides - user.slidesUsed < MIN_DECK_SLIDES) redirect("/dashboard?limit=1");

  const deck = await db.deck.create({
    data: { title: prompt.slice(0, 80), slug: slugify(prompt), prompt, ownerId: user.id },
  });
  await db.user.update({ where: { id }, data: { decksUsed: { increment: 1 } } });

  try {
    const handle = await tasks.trigger<typeof generateDeck>("generate-deck", { deckId: deck.id, prompt }, { priority: plan.priority });
    await db.deck.update({ where: { id: deck.id }, data: { runId: handle.id } });
  } catch (err) {
    // The user gets a calm message, but the cause has to reach the server log: a queue
    // failure is always configuration (key, environment, deployment), never a one-off.
    console.error("[trigger] could not queue deck", { deckId: deck.id, err: String(err) });
    const why = queueReason(err);
    // Nothing was generated, so the deck shouldn't count against the month.
    await db.$transaction([
      db.deck.update({ where: { id: deck.id }, data: { status: "FAILED", error: `The deck couldn't be queued. Nothing was counted against your plan — try again. (${why})` } }),
      db.user.update({ where: { id }, data: { decksUsed: { decrement: 1 } } }),
    ]);
  }

  redirect(`/decks/${deck.id}`);
}

export async function retryDeck(deckId: string) {
  const user = await requireUser();
  const deck = await db.deck.findFirst({
    where: { id: deckId, ownerId: user.id },
    include: { owner: true, _count: { select: { slides: true } } },
  });
  if (!deck) return;
  // Continuing a deck isn't a new deck, but its remaining slides still need a plan.
  const plan = activePlan(deck.owner);
  if (!plan) redirect("/pricing");
  const owner = deck.owner;
  // A deck that produced nothing was refunded, so starting it over counts as a deck again.
  const recharge = deck._count.slides === 0;
  if (recharge) {
    if (owner.decksUsed >= plan.decks || plan.slides - owner.slidesUsed < MIN_DECK_SLIDES) redirect("/dashboard?limit=1");
    await db.user.update({ where: { id: owner.id }, data: { decksUsed: { increment: 1 } } });
  } else if (owner.slidesUsed >= plan.slides) {
    redirect("/dashboard?limit=1");
  }

  await db.deck.update({ where: { id: deck.id }, data: { status: "QUEUED", error: null } });
  try {
    const handle = await tasks.trigger<typeof generateDeck>("generate-deck", { deckId: deck.id, prompt: deck.prompt }, { priority: plan.priority });
    await db.deck.update({ where: { id: deck.id }, data: { runId: handle.id } });
  } catch (err) {
    console.error("[trigger] could not re-queue deck", { deckId: deck.id, err: String(err) });
    const why = queueReason(err);
    await db.deck.update({ where: { id: deck.id }, data: { status: "FAILED", error: `Couldn't start generating again. Nothing was counted against your plan. (${why})` } });
    if (recharge) await db.user.updateMany({ where: { id: owner.id, decksUsed: { gt: 0 } }, data: { decksUsed: { decrement: 1 } } });
  }
  revalidatePath(`/decks/${deck.id}`);
}

export async function deleteDeck(deckId: string) {
  const user = await requireUser();
  await db.deck.deleteMany({ where: { id: deckId, ownerId: user.id } });
  redirect("/dashboard");
}

// A drawing can legitimately be large (Excalidraw elements and embedded images), but not
// unbounded: the scene comes straight from the browser, so it needs a ceiling.
const MAX_SCENE_BYTES = 4_000_000;

export async function saveSlide(slideId: string, scene: Prisma.InputJsonValue) {
  const user = await requireUser();
  if (JSON.stringify(scene).length > MAX_SCENE_BYTES) {
    return { error: "This slide is too large to save. Try removing a pasted image." };
  }
  // Card slides also keep the title and search text in sync with edits.
  let card: SlideT | null = null;
  if (isCardScene(scene)) {
    // The shape is checked rather than trusted: the slide renderer reads these fields directly.
    const parsed = Slide.safeParse(scene.slide);
    if (!parsed.success) return { error: "That edit didn't look like a slide, so it wasn't saved." };
    card = { ...parsed.data, illustration: scene.slide.illustration, drawing: scene.slide.drawing, image: scene.slide.image };
  }
  await db.slide.updateMany({
    where: { id: slideId, deck: { ownerId: user.id } },
    data: card ? { scene, title: card.title, searchText: [card.title, ...slideText(card)].join(" ") } : { scene },
  });
  return { ok: true };
}

export async function renameDeck(deckId: string, title: string) {
  const user = await requireUser();
  const clean = title.trim().slice(0, 120);
  if (!clean) return { error: "A deck needs a title." };
  await db.deck.updateMany({ where: { id: deckId, ownerId: user.id }, data: { title: clean } });
  revalidatePath(`/decks/${deckId}`);
  return { ok: true };
}

export async function setDeckTheme(deckId: string, theme: Theme) {
  const { id } = await requireUser();
  const user = await db.user.findUniqueOrThrow({ where: { id } });
  if (!THEMES.includes(theme) || !canUseTheme(activePlan(user), theme)) return;
  await db.deck.updateMany({ where: { id: deckId, ownerId: user.id }, data: { theme } });
}

// Billing: Razorpay subscription checkout. The page opens Razorpay Checkout with the returned id.
export async function startSubscription(planId: PlanId) {
  const { id } = await requireUser();
  const user = await db.user.findUniqueOrThrow({ where: { id } });
  if (!PLAN_IDS.includes(planId)) return { error: "Unknown plan." };
  // Never create a second subscription while one is still open at Razorpay: both would charge
  // the card, and only the newest id is stored, so events for the older one would go nowhere.
  if (subscriptionIsOpen(user)) {
    if (activePlan(user) && user.subscriptionStatus !== "cancelled") {
      return { error: "You're already subscribed. Use Change plan to move to another one — no second payment." };
    }
    const until = user.periodEnd ? format(user.periodEnd, "d MMMM yyyy") : "the end of the period";
    return { error: `Your cancelled plan is paid for until ${until}, so it keeps working until then. You can start a new plan after that date.` };
  }

  const planRef = razorpayPlanId(planId);
  if (!planRef) return { error: "Payments aren't set up yet." };
  const sub = await razorpay<Subscription>("/subscriptions", {
    method: "POST",
    body: { plan_id: planRef, total_count: 120, customer_notify: 1, notes: { userId: user.id } },
  });
  // Saved now so webhooks for this subscription can find the user. If this write fails the
  // subscription's notes.userId still identifies them (see lib/billing.ts).
  await db.user.update({ where: { id }, data: { subscriptionId: sub.id, subscriptionStatus: sub.status } });
  return { subscriptionId: sub.id, keyId: keyId(), email: user.email, name: user.name };
}

// Moving between plans on the subscription that already exists — no second charge, no
// cancel-and-resubscribe. Upgrades take effect now (Razorpay bills the difference);
// downgrades take effect at the end of the period already paid for.
export async function switchPlan(planId: PlanId) {
  const { id } = await requireUser();
  const user = await db.user.findUniqueOrThrow({ where: { id } });
  if (!PLAN_IDS.includes(planId)) return { error: "Unknown plan." };
  const current = activePlan(user);
  if (!current || !user.subscriptionId) return { error: "You don't have a plan to change yet." };
  if (current.id === planId) return { error: "That's already your plan." };
  if (user.subscriptionStatus === "cancelled") {
    return { error: "This plan is already cancelled, so it can't be changed. You can start a new plan once it ends." };
  }
  const planRef = razorpayPlanId(planId);
  if (!planRef) return { error: "Payments aren't set up yet." };

  const upgrade = PLANS[planId].price > current.price;
  const sub = await razorpay<Subscription>(`/subscriptions/${user.subscriptionId}`, {
    method: "PATCH",
    body: { plan_id: planRef, schedule_change_at: upgrade ? "now" : "cycle_end", customer_notify: 1 },
  });
  await applySubscription(sub);
  revalidatePath("/pricing");
  revalidatePath("/dashboard");
  return upgrade
    ? { ok: true, message: `You're on ${PLANS[planId].name} now. Razorpay will bill the difference for this month.` }
    : { ok: true, message: `${PLANS[planId].name} starts when this month ends — you keep ${current.name} until then.` };
}

export async function confirmSubscription(paymentId: string, subscriptionId: string, signature: string) {
  const { id } = await requireUser();
  const user = await db.user.findUniqueOrThrow({ where: { id } });
  if (user.subscriptionId !== subscriptionId || !verifyCheckout(paymentId, subscriptionId, signature)) {
    return { error: "Payment could not be verified." };
  }
  // The first payment of the subscription, so the month's allowance starts fresh.
  await applySubscription(await razorpay<Subscription>(`/subscriptions/${subscriptionId}`), "subscription.charged");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function cancelSubscription() {
  const { id } = await requireUser();
  const user = await db.user.findUniqueOrThrow({ where: { id } });
  if (!user.subscriptionId) return;
  // Stays usable until the end of the period already paid for.
  await applySubscription(await razorpay<Subscription>(`/subscriptions/${user.subscriptionId}/cancel`,
    { method: "POST", body: { cancel_at_cycle_end: 1 } }));
  revalidatePath("/pricing");
}
