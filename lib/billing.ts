import { db } from "@/lib/db";
import { PLAN_IDS, razorpayPlanId, type PlanId } from "@/lib/plans";
import type { Subscription } from "@/lib/razorpay";

// Mirrors a Razorpay subscription onto its user (from checkout or a webhook).
//
// Found by the subscription id saved at checkout, so a late event from an older subscription
// can't overwrite the current one. If that id was never saved — the write after creating the
// subscription failed — notes.userId, set when the subscription was created, finds the user
// anyway. Without that fallback a customer could pay and never receive their plan.
export async function applySubscription(sub: Subscription, event?: string) {
  const user =
    (await db.user.findUnique({ where: { subscriptionId: sub.id } })) ??
    (sub.notes?.userId ? await db.user.findUnique({ where: { id: sub.notes.userId } }) : null);
  if (!user) return { applied: false as const, reason: "no matching user" };
  // The notes fallback can land on a user who has since moved to a different subscription;
  // an event for the one they left must not reopen it.
  if (user.subscriptionId && user.subscriptionId !== sub.id) {
    return { applied: false as const, reason: `user is on ${user.subscriptionId}, event was for ${sub.id}` };
  }

  const plan = PLAN_IDS.find((p: PlanId) => razorpayPlanId(p) === sub.plan_id) ?? user.plan;
  const periodEnd = sub.current_end ? new Date(sub.current_end * 1000) : user.periodEnd;
  // Only a payment buys a fresh allowance. Any other event carrying a shifted period
  // (a pause, a plan change scheduled for the next cycle) must not hand out a free reset.
  const charged = event === "subscription.charged" && periodEnd?.getTime() !== user.periodEnd?.getTime();

  await db.user.update({
    where: { id: user.id },
    data: {
      plan, subscriptionId: sub.id, subscriptionStatus: sub.status, periodEnd,
      ...(charged && { decksUsed: 0, slidesUsed: 0 }),
    },
  });
  return { applied: true as const, userId: user.id, plan, status: sub.status, usageReset: charged };
}
