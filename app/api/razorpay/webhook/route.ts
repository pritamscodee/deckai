import { applySubscription } from "@/lib/billing";
import { verifyWebhook, type Subscription } from "@/lib/razorpay";

// Razorpay dashboard → Webhooks: point at /api/razorpay/webhook with the subscription.* events.
// Keeps plans in sync for renewals, failed payments and cancellations.
export async function POST(req: Request) {
  const body = await req.text();
  if (!verifyWebhook(body, req.headers.get("x-razorpay-signature") ?? "")) {
    return new Response("Bad signature", { status: 400 });
  }
  const event = JSON.parse(body) as { event: string; payload: { subscription?: { entity: Subscription } } };
  const sub = event.payload.subscription?.entity;
  if (!event.event.startsWith("subscription.") || !sub) return Response.json({ ok: true, ignored: event.event });

  const result = await applySubscription(sub, event.event);
  // A verified subscription event we can't attach to a user means somebody may be paying for
  // nothing. Loud, because it needs a human to reconcile it against the Razorpay dashboard.
  if (!result.applied) {
    console.error("[razorpay] unmatched subscription event", {
      event: event.event, subscriptionId: sub.id, planId: sub.plan_id, status: sub.status, reason: result.reason,
    });
  }
  return Response.json({ ok: true });
}
